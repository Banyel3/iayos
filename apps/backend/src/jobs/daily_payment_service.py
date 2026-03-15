"""
Daily Payment Service
Handles daily-rate job payment logic including:
- Daily attendance tracking
- Per-day payment processing
- Extension requests with mutual approval
- Rate change requests with mutual approval
- Multi-worker and agency support
"""

from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional, Dict, Any, List
from django.db import transaction, IntegrityError
from django.utils import timezone
from django.db.models import Sum

from accounts.models import (
    Job, 
    WorkerProfile, 
    JobWorkerAssignment, 
    JobLog,
    DailyAttendance,
    DailyJobExtension,
    DailyRateChange,
    Wallet,
    Transaction,
    Notification,
    Accounts
)


class DailyPaymentService:
    """Service class for handling daily payment operations."""
    
    PLATFORM_FEE_PERCENT = Decimal('0.10')  # 10% platform fee
    ABSENT_PENALTY_PERCENT = Decimal('0.10')  # 10% expected-earnings penalty per absent day

    @staticmethod
    def calculate_absent_penalty(attendance: DailyAttendance) -> Decimal:
        """Calculate absent penalty amount for one attendance row."""
        daily_rate = attendance.jobID.daily_rate_agreed or Decimal('0.00')
        penalty = (daily_rate * DailyPaymentService.ABSENT_PENALTY_PERCENT).quantize(Decimal('0.01'))
        return penalty if penalty > 0 else Decimal('0.00')

    @staticmethod
    def apply_absent_penalty(attendance: DailyAttendance) -> Decimal:
        """
        Apply absent penalty idempotently on attendance row.
        Penalty affects expected earnings metrics and is tracked per day.
        """
        if attendance.absent_penalty_applied:
            return attendance.absent_penalty_amount or Decimal('0.00')

        penalty = DailyPaymentService.calculate_absent_penalty(attendance)
        attendance.absent_penalty_percent = (DailyPaymentService.ABSENT_PENALTY_PERCENT * Decimal('100')).quantize(Decimal('0.01'))
        attendance.absent_penalty_amount = penalty
        attendance.absent_penalty_applied = True
        attendance.absent_penalty_applied_at = timezone.now()
        attendance.save(update_fields=[
            'absent_penalty_percent',
            'absent_penalty_amount',
            'absent_penalty_applied',
            'absent_penalty_applied_at',
            'updatedAt',
        ])
        return penalty
    
    @staticmethod
    def calculate_daily_escrow(daily_rate: Decimal, num_workers: int, num_days: int) -> Dict[str, Decimal]:
        """
        Calculate escrow for a daily job.
        100% upfront escrow for protection (unlike project-based 50/50).
        
        Returns:
            Dict with 'escrow_amount', 'platform_fee', 'total_required'
        """
        base_amount = daily_rate * num_workers * num_days
        platform_fee = base_amount * DailyPaymentService.PLATFORM_FEE_PERCENT
        total_required = base_amount + platform_fee
        
        return {
            'escrow_amount': base_amount,
            'platform_fee': platform_fee,
            'total_required': total_required,
            'daily_rate': daily_rate,
            'num_workers': num_workers,
            'num_days': num_days,
        }
    
    @staticmethod
    @transaction.atomic
    def create_daily_job(
        job: Job,
        daily_rate: Decimal,
        duration_days: int,
        num_workers: int = 1
    ) -> Dict[str, Any]:
        """
        Initialize a daily-rate job with proper escrow calculation.
        Called after job creation to set up daily payment fields.
        
        Args:
            job: The Job instance (already created)
            daily_rate: Agreed daily rate per worker
            duration_days: Expected number of work days
            num_workers: Number of workers (default 1 for single-worker jobs)
        
        Returns:
            Dict with escrow details and success status
        """
        escrow_calc = DailyPaymentService.calculate_daily_escrow(
            daily_rate, num_workers, duration_days
        )
        
        # Update job with daily payment fields
        job.payment_model = 'DAILY'
        job.daily_rate_agreed = daily_rate
        job.duration_days = duration_days
        job.daily_escrow_total = escrow_calc['escrow_amount']
        job.budget = escrow_calc['escrow_amount']  # Budget = total escrow for daily jobs
        job.escrowAmount = escrow_calc['escrow_amount']
        job.save()
        
        return {
            'success': True,
            'job_id': job.jobID,
            'escrow_details': escrow_calc,
            'message': f"Daily job setup complete. Total escrow: ₱{escrow_calc['total_required']}"
        }
    
    @staticmethod
    @transaction.atomic
    def log_attendance(
        job: Job,
        work_date: date,
        worker: Optional[WorkerProfile] = None,
        assignment: Optional[JobWorkerAssignment] = None,
        employee_id: Optional[int] = None,
        time_in: Optional[datetime] = None,
        time_out: Optional[datetime] = None,
        status: str = 'PENDING',
        notes: str = ''
    ) -> Dict[str, Any]:
        """
        Log daily attendance for a worker.
        
        For freelance workers: worker parameter required
        For team jobs: assignment parameter required  
        For agency jobs: employee_id parameter required
        
        Returns:
            Dict with attendance record details
        """
        if job.payment_model != 'DAILY':
            return {'success': False, 'error': 'Job is not a daily-rate job'}
        
        # Determine daily rate based on worker type
        if assignment:
            daily_rate = assignment.daily_rate_at_assignment or job.daily_rate_agreed
            worker = assignment.workerID
        elif worker:
            daily_rate = job.daily_rate_agreed
        elif employee_id:
            from agency.models import AgencyEmployee
            try:
                employee = AgencyEmployee.objects.get(employeeID=employee_id)
                daily_rate = employee.daily_rate or job.daily_rate_agreed
            except AgencyEmployee.DoesNotExist:
                return {'success': False, 'error': 'Employee not found'}
        else:
            return {'success': False, 'error': 'Worker, assignment, or employee required'}
        
        # Calculate amount for this day
        if status == 'PRESENT':
            amount = daily_rate
        elif status == 'HALF_DAY':
            amount = daily_rate / 2
        else:
            amount = Decimal('0.00')
        
        # Create or update attendance record
        # Use different lookup fields based on worker type to ensure unique records
        if employee_id:
            # Agency employee - use employeeID in lookup
            attendance, created = DailyAttendance.objects.update_or_create(
                jobID=job,
                employeeID_id=employee_id,
                date=work_date,
                defaults={
                    'workerID': None,
                    'assignmentID': None,
                    'time_in': time_in,
                    'time_out': time_out,
                    'status': status,
                    'amount_earned': amount,
                    'notes': notes,
                }
            )
        elif assignment:
            # Team job assignment - use assignmentID in lookup
            attendance, created = DailyAttendance.objects.update_or_create(
                jobID=job,
                assignmentID=assignment,
                date=work_date,
                defaults={
                    'workerID': worker,
                    'employeeID': None,
                    'time_in': time_in,
                    'time_out': time_out,
                    'status': status,
                    'amount_earned': amount,
                    'notes': notes,
                }
            )
        else:
            # Individual worker - use workerID in lookup
            attendance, created = DailyAttendance.objects.update_or_create(
                jobID=job,
                workerID=worker,
                date=work_date,
                defaults={
                    'assignmentID': None,
                    'employeeID': None,
                    'time_in': time_in,
                    'time_out': time_out,
                    'status': status,
                    'amount_earned': amount,
                    'notes': notes,
                }
            )
        
        return {
            'success': True,
            'attendance_id': attendance.attendanceID,
            'created': created,
            'date': str(work_date),
            'status': status,
            'amount_earned': float(amount),
        }
    
    @staticmethod
    @transaction.atomic
    def confirm_attendance_worker(
        attendance: DailyAttendance,
        user: Accounts
    ) -> Dict[str, Any]:
        """
        Worker confirms their attendance for a day.
        For freelance workers, they confirm for themselves.
        For agency jobs, agency rep confirms.
        """
        # Defense in depth: ensure only the correct worker-side actor can confirm.
        if attendance.workerID:
            if attendance.workerID.profileID.accountFK != user:
                return {'success': False, 'error': 'Only the assigned worker can confirm attendance'}
        elif attendance.assignmentID:
            if attendance.assignmentID.workerID.profileID.accountFK != user:
                return {'success': False, 'error': 'Only the assigned team worker can confirm attendance'}
        elif attendance.employeeID:
            if not attendance.jobID.assignedAgencyFK or attendance.jobID.assignedAgencyFK.accountFK != user:
                return {'success': False, 'error': 'Only the assigned agency can confirm attendance for employees'}
        else:
            return {'success': False, 'error': 'Invalid attendance record'}

        if attendance.worker_confirmed:
            return {'success': False, 'error': 'Attendance already confirmed by worker'}
        
        attendance.worker_confirmed = True
        attendance.worker_confirmed_at = timezone.now()
        attendance.save()
        
        # Check if both confirmed
        if attendance.is_confirmed():
            # Auto-process payment if both confirmed
            return DailyPaymentService.process_day_payment(attendance)
        
        return {
            'success': True,
            'attendance_id': attendance.attendanceID,
            'worker_confirmed': True,
            'awaiting_client_confirmation': not attendance.client_confirmed
        }
    
    @staticmethod
    @transaction.atomic
    def confirm_attendance_client(
        attendance: DailyAttendance,
        user: Accounts,
        approved_status: str = None,
        payment_method: str = 'WALLET',
        cash_proof_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Client confirms attendance for a worker's day.
        Client can also adjust the status if needed.
        """
        if attendance.client_confirmed:
            return {'success': False, 'error': 'Attendance already confirmed by client'}

        payment_method_upper = str(payment_method or 'WALLET').upper()
        if payment_method_upper not in ['WALLET', 'CASH']:
            return {'success': False, 'error': 'Invalid payment method. Choose WALLET or CASH'}
        
        # Client can override status
        if approved_status and approved_status in ['PRESENT', 'HALF_DAY', 'ABSENT']:
            attendance.status = approved_status
            # Recalculate amount
            daily_rate = attendance.jobID.daily_rate_agreed
            if approved_status == 'PRESENT':
                attendance.amount_earned = daily_rate
            elif approved_status == 'HALF_DAY':
                attendance.amount_earned = daily_rate / 2
            else:
                attendance.amount_earned = Decimal('0.00')
        
        attendance.client_confirmed = True
        attendance.client_confirmed_at = timezone.now()
        attendance.save()
        
        # Check if both confirmed
        if attendance.is_confirmed():
            # Auto-process payment if both confirmed
            return DailyPaymentService.process_day_payment(
                attendance,
                payment_method=payment_method_upper,
                cash_proof_url=cash_proof_url,
            )
        
        return {
            'success': True,
            'attendance_id': attendance.attendanceID,
            'client_confirmed': True,
            'status': attendance.status,
            'amount': float(attendance.amount_earned),
            'awaiting_worker_confirmation': not attendance.worker_confirmed
        }
    
    @staticmethod
    @transaction.atomic
    def process_day_payment(
        attendance: DailyAttendance,
        payment_method: str = 'WALLET',
        cash_proof_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process payment for a confirmed day of work.

        WALLET: adds earnings to pendingEarnings (7-day buffer).
        CASH: credits wallet balance immediately after proof upload.
        """
        if attendance.payment_processed:
            return {'success': False, 'error': 'Payment already processed for this day'}
        
        if not attendance.is_confirmed():
            return {'success': False, 'error': 'Attendance not fully confirmed yet'}
        
        payment_method_upper = str(payment_method or 'WALLET').upper()
        if payment_method_upper not in ['WALLET', 'CASH']:
            return {'success': False, 'error': 'Invalid payment method. Choose WALLET or CASH'}

        if attendance.status in ['ABSENT', 'PENDING', 'DISPUTED']:
            penalty_amount = Decimal('0.00')
            if attendance.status == 'ABSENT':
                penalty_amount = DailyPaymentService.apply_absent_penalty(attendance)

            attendance.payment_method = payment_method_upper
            if payment_method_upper == 'CASH' and cash_proof_url:
                attendance.cash_payment_proof_url = cash_proof_url
                attendance.cash_proof_uploaded_at = timezone.now()
                attendance.cash_payment_verified = True
                attendance.cash_payment_verified_at = timezone.now()
            attendance.payment_processed = True
            attendance.payment_processed_at = timezone.now()
            attendance.save()
            return {
                'success': True,
                'message': f'No payment for {attendance.status} status',
                'amount': 0,
                'absent_penalty_amount': float(penalty_amount),
                'payment_method': payment_method_upper,
            }
        
        job = attendance.jobID
        amount = attendance.amount_earned
        
        if amount <= 0:
            attendance.payment_method = payment_method_upper
            if payment_method_upper == 'CASH' and cash_proof_url:
                attendance.cash_payment_proof_url = cash_proof_url
                attendance.cash_proof_uploaded_at = timezone.now()
                attendance.cash_payment_verified = True
                attendance.cash_payment_verified_at = timezone.now()
            attendance.payment_processed = True
            attendance.payment_processed_at = timezone.now()
            attendance.save()
            return {
                'success': True,
                'amount': 0,
                'message': 'Zero amount, no payment needed',
                'payment_method': payment_method_upper,
            }
        
        # Get worker's wallet
        worker_account = None
        if attendance.workerID:
            worker_account = attendance.workerID.profileID.accountFK
        elif attendance.employeeID:
            # For agency employees, payment goes to agency wallet
            worker_account = attendance.employeeID.agency
        
        if not worker_account:
            return {'success': False, 'error': 'Could not determine worker account'}
        
        try:
            wallet = Wallet.objects.get(accountFK=worker_account)
        except Wallet.DoesNotExist:
            wallet = Wallet.objects.create(accountFK=worker_account)
        
        if payment_method_upper == 'CASH' and not cash_proof_url:
            return {'success': False, 'error': 'Cash proof is required for CASH payment'}

        # WALLET keeps 7-day pending buffer; CASH is immediately released.
        if payment_method_upper == 'CASH':
            wallet.balance += amount
        else:
            wallet.pendingEarnings += amount
        wallet.save()
        
        # Update job tracking
        job.total_days_worked += 1
        job.save()
        
        # Update assignment if team job
        if attendance.assignmentID:
            attendance.assignmentID.days_worked += 1
            attendance.assignmentID.total_earned += amount
            attendance.assignmentID.save()
        
        # Create transaction record
        Transaction.objects.create(
            walletID=wallet,
            transactionType='EARNING' if payment_method_upper == 'CASH' else 'PENDING_EARNING',
            amount=amount,
            balanceAfter=wallet.balance,
            status='COMPLETED',
            description=(
                f'Daily cash payment for {attendance.date} - Job #{job.jobID}'
                if payment_method_upper == 'CASH'
                else f'Daily payment for {attendance.date} - Job #{job.jobID}'
            ),
            relatedJobPosting=job,
            paymentMethod=payment_method_upper,
        )
        
        # Mark attendance as processed
        attendance.payment_method = payment_method_upper
        if payment_method_upper == 'CASH':
            attendance.cash_payment_proof_url = cash_proof_url
            attendance.cash_proof_uploaded_at = timezone.now()
            attendance.cash_payment_verified = True
            attendance.cash_payment_verified_at = timezone.now()
        attendance.payment_processed = True
        attendance.payment_processed_at = timezone.now()
        attendance.save()
        
        # Create notification
        Notification.objects.create(
            accountFK=worker_account,
            notificationType='PAYMENT_RECEIVED',
            title='Daily Payment Received',
            message=(
                f'P{float(amount):,.2f} cash payment for {attendance.date} is now available in your wallet balance.'
                if payment_method_upper == 'CASH'
                else f'P{float(amount):,.2f} earned for {attendance.date} has been added to your pending earnings.'
            ),
            relatedJobID=job.jobID
        )
        
        return {
            'success': True,
            'amount': float(amount),
            'date': str(attendance.date),
            'pending_earnings': float(wallet.pendingEarnings),
            'wallet_balance': float(wallet.balance),
            'payment_method': payment_method_upper,
            'cash_payment_verified': payment_method_upper == 'CASH',
            'message': (
                f'₱{amount} released immediately to wallet balance (cash proof verified)'
                if payment_method_upper == 'CASH'
                else f'₱{amount} added to pending earnings (7-day buffer)'
            )
        }
    
    @staticmethod
    @transaction.atomic
    def request_extension(
        job: Job,
        additional_days: int,
        reason: str,
        requested_by: str,
        user: Accounts
    ) -> Dict[str, Any]:
        """
        Request an extension for a daily job.
        Requires mutual approval from both client and worker/agency.
        
        Args:
            job: The Job instance
            additional_days: Number of days to extend
            reason: Reason for extension
            requested_by: 'CLIENT', 'WORKER', or 'AGENCY'
            user: The user making the request
        """
        if job.payment_model != 'DAILY':
            return {'success': False, 'error': 'Job is not a daily-rate job'}
        
        if job.status != 'IN_PROGRESS':
            return {'success': False, 'error': 'Can only extend jobs that are in progress'}
        
        # Check for pending extensions
        pending = DailyJobExtension.objects.filter(
            jobID=job,
            status='PENDING'
        ).exists()
        if pending:
            return {'success': False, 'error': 'There is already a pending extension request'}
        
        # Calculate additional escrow needed
        num_workers = job.total_workers_needed or 1
        daily_rate = job.daily_rate_agreed or Decimal('0.00')
        additional_escrow = daily_rate * num_workers * additional_days
        
        # Create extension request
        extension = DailyJobExtension.objects.create(
            jobID=job,
            additional_days=additional_days,
            additional_escrow=additional_escrow,
            reason=reason,
            requested_by=requested_by,
            requestedByUser=user,
            # Auto-approve for requester
            client_approved=(requested_by == 'CLIENT'),
            client_approved_at=timezone.now() if requested_by == 'CLIENT' else None,
            worker_approved=(requested_by in ['WORKER', 'AGENCY']),
            worker_approved_at=timezone.now() if requested_by in ['WORKER', 'AGENCY'] else None,
        )
        
        # Notify the other party
        if requested_by == 'CLIENT':
            # Notify worker/agency
            notify_user = None
            if job.assignedWorkerID:
                notify_user = job.assignedWorkerID.profileID.accountFK
            elif job.assignedAgencyFK:
                notify_user = job.assignedAgencyFK.accountFK
            
            if notify_user:
                Notification.objects.create(
                    accountFK=notify_user,
                    notificationType='EXTENSION_REQUEST',
                    title='Extension Request',
                    message=f'Client has requested a {additional_days}-day extension. Your approval is needed.',
                    relatedJobID=job.jobID
                )
        else:
            # Notify client
            Notification.objects.create(
                accountFK=job.clientID.profileID.accountFK,
                notificationType='EXTENSION_REQUEST',
                title='Extension Request',
                message=f'{"Agency" if requested_by == "AGENCY" else "Worker"} has requested a {additional_days}-day extension. Your approval is needed.',
                relatedJobID=job.jobID
            )
        
        return {
            'success': True,
            'extension_id': extension.extensionID,
            'additional_days': additional_days,
            'additional_escrow': float(additional_escrow),
            'awaiting_approval_from': 'worker' if requested_by == 'CLIENT' else 'client'
        }
    
    @staticmethod
    @transaction.atomic
    def approve_extension(
        extension: DailyJobExtension,
        approver_type: str,
        user: Accounts
    ) -> Dict[str, Any]:
        """
        Approve an extension request.
        When both parties approve, collects additional escrow and extends job.
        
        Args:
            extension: The DailyJobExtension instance
            approver_type: 'CLIENT', 'WORKER', or 'AGENCY'
            user: The approving user
        """
        if extension.status != 'PENDING':
            return {'success': False, 'error': f'Extension is {extension.status}, not pending'}
        
        # Record approval
        if approver_type == 'CLIENT':
            if extension.client_approved:
                return {'success': False, 'error': 'Client already approved'}
            extension.client_approved = True
            extension.client_approved_at = timezone.now()
        else:
            if extension.worker_approved:
                return {'success': False, 'error': 'Worker/Agency already approved'}
            extension.worker_approved = True
            extension.worker_approved_at = timezone.now()
        
        extension.save()
        
        # Check if fully approved
        if extension.is_fully_approved():
            job = extension.jobID
            
            # Check client wallet balance
            client_account = job.clientID.profileID.accountFK
            try:
                client_wallet = Wallet.objects.select_for_update().get(accountFK=client_account)
            except Wallet.DoesNotExist:
                extension.status = 'REJECTED'
                extension.save()
                return {'success': False, 'error': 'Client wallet not found'}
            
            total_needed = extension.additional_escrow * (1 + DailyPaymentService.PLATFORM_FEE_PERCENT)
            
            if client_wallet.availableBalance < total_needed:
                return {
                    'success': False,
                    'error': (
                        f'Insufficient client balance. Need ₱{total_needed}, '
                        f'have ₱{client_wallet.availableBalance} available '
                        f'(₱{client_wallet.balance} balance, ₱{client_wallet.reservedBalance} reserved).'
                    ),
                    'needs_top_up': True,
                    'amount_needed': float(total_needed)
                }
            
            # Collect additional escrow
            client_wallet.balance -= total_needed
            client_wallet.reservedBalance += extension.additional_escrow
            try:
                client_wallet.save()
            except IntegrityError:
                return {
                    'success': False,
                    'error': 'Extension approval failed due to reserved wallet constraints',
                    'needs_top_up': True,
                    'amount_needed': float(total_needed),
                }
            
            # Update job
            job.duration_days += extension.additional_days
            job.daily_escrow_total += extension.additional_escrow
            job.budget += extension.additional_escrow
            job.escrowAmount += extension.additional_escrow
            job.save()
            
            # Update extension status
            extension.status = 'APPROVED'
            extension.escrow_collected = True
            extension.escrow_collected_at = timezone.now()
            extension.save()
            
            # Notify both parties
            Notification.objects.create(
                accountFK=client_account,
                notificationType='EXTENSION_APPROVED',
                title='Extension Approved',
                message=f'Job extension approved. {extension.additional_days} days added.',
                relatedJobID=job.jobID
            )
            
            return {
                'success': True,
                'status': 'APPROVED',
                'new_duration_days': job.duration_days,
                'additional_escrow_collected': float(extension.additional_escrow),
                'message': f'Extension approved and {extension.additional_days} days added to job'
            }
        
        return {
            'success': True,
            'status': 'PENDING',
            'client_approved': extension.client_approved,
            'worker_approved': extension.worker_approved,
            'message': 'Approval recorded, waiting for other party'
        }
    
    @staticmethod
    @transaction.atomic
    def request_rate_change(
        job: Job,
        new_rate: Decimal,
        reason: str,
        effective_date: date,
        requested_by: str,
        user: Accounts
    ) -> Dict[str, Any]:
        """
        Request a daily rate change for an in-progress job.
        Requires mutual approval from both client and worker/agency.
        """
        if job.payment_model != 'DAILY':
            return {'success': False, 'error': 'Job is not a daily-rate job'}
        
        if job.status != 'IN_PROGRESS':
            return {'success': False, 'error': 'Can only change rate for jobs in progress'}
        
        old_rate = job.daily_rate_agreed
        
        if new_rate == old_rate:
            return {'success': False, 'error': 'New rate is same as current rate'}
        
        # Check for pending rate changes
        pending = DailyRateChange.objects.filter(
            jobID=job,
            status='PENDING'
        ).exists()
        if pending:
            return {'success': False, 'error': 'There is already a pending rate change request'}
        
        # Create rate change request
        rate_change = DailyRateChange.objects.create(
            jobID=job,
            old_rate=old_rate,
            new_rate=new_rate,
            reason=reason,
            effective_date=effective_date,
            requested_by=requested_by,
            requestedByUser=user,
            # Auto-approve for requester
            client_approved=(requested_by == 'CLIENT'),
            client_approved_at=timezone.now() if requested_by == 'CLIENT' else None,
            worker_approved=(requested_by in ['WORKER', 'AGENCY']),
            worker_approved_at=timezone.now() if requested_by in ['WORKER', 'AGENCY'] else None,
        )
        
        # Notify the other party
        rate_diff = new_rate - old_rate
        direction = "increase" if rate_diff > 0 else "decrease"
        
        if requested_by == 'CLIENT':
            notify_user = None
            if job.assignedWorkerID:
                notify_user = job.assignedWorkerID.profileID.accountFK
            elif job.assignedAgencyFK:
                notify_user = job.assignedAgencyFK.accountFK
            
            if notify_user:
                Notification.objects.create(
                    accountFK=notify_user,
                    notificationType='RATE_CHANGE_REQUEST',
                    title='Rate Change Request',
                    message=f'Client has requested a rate {direction} to ₱{new_rate}/day. Your approval is needed.',
                    relatedJobID=job.jobID
                )
        else:
            Notification.objects.create(
                accountFK=job.clientID.profileID.accountFK,
                notificationType='RATE_CHANGE_REQUEST',
                title='Rate Change Request',
                message=f'{"Agency" if requested_by == "AGENCY" else "Worker"} has requested a rate {direction} to ₱{new_rate}/day. Your approval is needed.',
                relatedJobID=job.jobID
            )
        
        return {
            'success': True,
            'change_id': rate_change.changeID,
            'old_rate': float(old_rate),
            'new_rate': float(new_rate),
            'effective_date': str(effective_date),
            'awaiting_approval_from': 'worker' if requested_by == 'CLIENT' else 'client'
        }
    
    @staticmethod
    @transaction.atomic
    def approve_rate_change(
        rate_change: DailyRateChange,
        approver_type: str,
        user: Accounts
    ) -> Dict[str, Any]:
        """
        Approve a rate change request.
        When both parties approve, updates job rate and adjusts escrow if needed.
        """
        if rate_change.status != 'PENDING':
            return {'success': False, 'error': f'Rate change is {rate_change.status}, not pending'}
        
        # Record approval
        if approver_type == 'CLIENT':
            if rate_change.client_approved:
                return {'success': False, 'error': 'Client already approved'}
            rate_change.client_approved = True
            rate_change.client_approved_at = timezone.now()
        else:
            if rate_change.worker_approved:
                return {'success': False, 'error': 'Worker/Agency already approved'}
            rate_change.worker_approved = True
            rate_change.worker_approved_at = timezone.now()
        
        rate_change.save()
        
        # Check if fully approved
        if rate_change.is_fully_approved():
            job = rate_change.jobID
            
            # Calculate remaining days
            days_worked = job.total_days_worked
            remaining_days = (job.duration_days or 0) - days_worked
            
            if remaining_days > 0:
                # Calculate escrow adjustment
                num_workers = job.total_workers_needed or 1
                old_remaining_escrow = rate_change.old_rate * num_workers * remaining_days
                new_remaining_escrow = rate_change.new_rate * num_workers * remaining_days
                adjustment = new_remaining_escrow - old_remaining_escrow
                
                if adjustment > 0:
                    # Client needs to pay more
                    client_account = job.clientID.profileID.accountFK
                    try:
                        client_wallet = Wallet.objects.select_for_update().get(accountFK=client_account)
                    except Wallet.DoesNotExist:
                        rate_change.status = 'REJECTED'
                        rate_change.save()
                        return {'success': False, 'error': 'Client wallet not found'}
                    
                    adjustment_with_fee = adjustment * (1 + DailyPaymentService.PLATFORM_FEE_PERCENT)
                    
                    if client_wallet.availableBalance < adjustment_with_fee:
                        return {
                            'success': False,
                            'error': (
                                f'Insufficient balance for rate increase. Need ₱{adjustment_with_fee}, '
                                f'have ₱{client_wallet.availableBalance} available.'
                            ),
                            'needs_top_up': True,
                            'amount_needed': float(adjustment_with_fee)
                        }
                    
                    # Collect additional funds
                    client_wallet.balance -= adjustment_with_fee
                    client_wallet.reservedBalance += adjustment
                    try:
                        client_wallet.save()
                    except IntegrityError:
                        return {
                            'success': False,
                            'error': 'Rate change approval failed due to reserved wallet constraints',
                            'needs_top_up': True,
                            'amount_needed': float(adjustment_with_fee),
                        }
                
                elif adjustment < 0:
                    # Refund client
                    client_account = job.clientID.profileID.accountFK
                    client_wallet, _ = Wallet.objects.get_or_create(accountFK=client_account)
                    
                    refund_amount = abs(adjustment)
                    client_wallet.balance += refund_amount
                    client_wallet.reservedBalance -= refund_amount
                    client_wallet.save()
                
                rate_change.escrow_adjustment_amount = adjustment
            
            # Update job rate
            job.daily_rate_agreed = rate_change.new_rate
            job.save()
            
            # Update rate change status
            rate_change.status = 'APPROVED'
            rate_change.escrow_adjusted = True
            rate_change.save()
            
            # Notify both parties
            Notification.objects.create(
                accountFK=job.clientID.profileID.accountFK,
                notificationType='RATE_CHANGE_APPROVED',
                title='Rate Change Approved',
                message=f'Daily rate changed to ₱{rate_change.new_rate}/day effective {rate_change.effective_date}.',
                relatedJobID=job.jobID
            )
            
            return {
                'success': True,
                'status': 'APPROVED',
                'new_rate': float(rate_change.new_rate),
                'escrow_adjustment': float(rate_change.escrow_adjustment_amount),
                'message': f'Rate changed to ₱{rate_change.new_rate}/day'
            }
        
        return {
            'success': True,
            'status': 'PENDING',
            'client_approved': rate_change.client_approved,
            'worker_approved': rate_change.worker_approved,
            'message': 'Approval recorded, waiting for other party'
        }
    
    @staticmethod
    def get_daily_summary(job: Job) -> Dict[str, Any]:
        """
        Get a summary of daily attendance and payments for a job.
        """
        if job.payment_model != 'DAILY':
            return {'error': 'Job is not a daily-rate job'}
        
        attendance_records = DailyAttendance.objects.filter(jobID=job).order_by('date')
        
        total_earned = attendance_records.filter(
            payment_processed=True
        ).aggregate(total=Sum('amount_earned'))['total'] or Decimal('0.00')
        
        pending_confirmation = attendance_records.filter(
            status='PENDING'
        ).count()
        
        days_present = attendance_records.filter(status='PRESENT').count()
        days_half = attendance_records.filter(status='HALF_DAY').count()
        days_absent = attendance_records.filter(status='ABSENT').count()

        absent_penalty_total = attendance_records.filter(
            status='ABSENT',
            absent_penalty_applied=True
        ).aggregate(total=Sum('absent_penalty_amount'))['total'] or Decimal('0.00')

        gross_expected_earnings = (
            (Decimal(days_present) * (job.daily_rate_agreed or Decimal('0.00')))
            + (Decimal(days_half) * (job.daily_rate_agreed or Decimal('0.00')) / Decimal('2.00'))
        )
        net_expected_earnings = gross_expected_earnings - absent_penalty_total
        if net_expected_earnings < Decimal('0.00'):
            net_expected_earnings = Decimal('0.00')
        
        # Get pending extensions/rate changes
        pending_extensions = DailyJobExtension.objects.filter(
            jobID=job, status='PENDING'
        ).count()
        
        pending_rate_changes = DailyRateChange.objects.filter(
            jobID=job, status='PENDING'
        ).count()
        
        return {
            'job_id': job.jobID,
            'payment_model': 'DAILY',
            'daily_rate': float(job.daily_rate_agreed or 0),
            'duration_days': job.duration_days,
            'days_worked': job.total_days_worked,
            'remaining_days': (job.duration_days or 0) - job.total_days_worked,
            'attendance': {
                'total_records': attendance_records.count(),
                'pending_confirmation': pending_confirmation,
                'days_present': days_present,
                'days_half': days_half,
                'days_absent': days_absent,
            },
            'payments': {
                'total_earned': float(total_earned),
                'escrow_total': float(job.daily_escrow_total),
                'escrow_remaining': float(job.daily_escrow_total - total_earned),
                'gross_expected_earnings': float(gross_expected_earnings),
                'absent_penalty_total': float(absent_penalty_total),
                'net_expected_earnings': float(net_expected_earnings),
            },
            'pending_requests': {
                'extensions': pending_extensions,
                'rate_changes': pending_rate_changes,
            }
        }
    
    @staticmethod
    @transaction.atomic
    def cancel_remaining_days(
        job: Job,
        reason: str,
        cancelled_by: str,
        user: Accounts
    ) -> Dict[str, Any]:
        """
        Cancel remaining days of a daily job.
        Refunds only unused escrow principal to the client.
        Platform fee remains retained by the platform.
        """
        if job.payment_model != 'DAILY':
            return {'success': False, 'error': 'Job is not a daily-rate job'}
        
        if job.status not in ['ACTIVE', 'IN_PROGRESS']:
            return {'success': False, 'error': f'Cannot cancel job in {job.status} status'}

        # First settle any fully-confirmed attendance rows that were not processed yet.
        # This prevents underpaying workers when cancellation happens after a completed day.
        confirmed_unprocessed_rows = DailyAttendance.objects.filter(
            jobID=job,
            payment_processed=False,
            worker_confirmed=True,
            client_confirmed=True,
            status__in=['PRESENT', 'HALF_DAY'],
        ).order_by('date', 'attendanceID')

        for attendance in confirmed_unprocessed_rows:
            DailyPaymentService.process_day_payment(attendance)
        
        # Calculate paid-out principal based on processed attendance.
        paid_attendance_qs = DailyAttendance.objects.filter(
            jobID=job,
            payment_processed=True
        )
        total_paid = paid_attendance_qs.aggregate(total=Sum('amount_earned'))['total'] or Decimal('0.00')
        processed_days_count = paid_attendance_qs.count()

        pending_attendance_count = DailyAttendance.objects.filter(
            jobID=job,
            payment_processed=False,
        ).exclude(status='ABSENT').count()

        escrow_collected = Decimal(str(job.daily_escrow_total or Decimal('0.00')))
        if escrow_collected < Decimal('0.00'):
            escrow_collected = Decimal('0.00')

        refundable_escrow = escrow_collected - total_paid
        if refundable_escrow < Decimal('0.00'):
            refundable_escrow = Decimal('0.00')

        if processed_days_count == 0 and pending_attendance_count == 0:
            cancellation_stage = 'BEFORE_FIRST_PAID_DAY'
        elif processed_days_count == 0 and pending_attendance_count > 0:
            cancellation_stage = 'DAY_IN_PROGRESS_NO_PAYOUT_YET'
        elif refundable_escrow > Decimal('0.00') and pending_attendance_count > 0:
            cancellation_stage = 'MID_DAY_AFTER_SOME_PAYOUT'
        elif refundable_escrow > Decimal('0.00'):
            cancellation_stage = 'BETWEEN_PAID_DAYS'
        else:
            cancellation_stage = 'AFTER_ALL_DAYS_PAID'

        platform_fee_retained = (escrow_collected * DailyPaymentService.PLATFORM_FEE_PERCENT).quantize(Decimal('0.01'))

        # Refund escrow principal only (platform fee is retained).
        client_account = job.clientID.profileID.accountFK
        client_wallet, _ = Wallet.objects.get_or_create(accountFK=client_account)

        if refundable_escrow > Decimal('0.00'):
            client_wallet.balance += refundable_escrow

            # Keep reserved balance non-negative; some payment paths deduct directly,
            # while others may reserve funds before conversion.
            if client_wallet.reservedBalance > Decimal('0.00'):
                reserved_release = min(client_wallet.reservedBalance, refundable_escrow)
                client_wallet.reservedBalance -= reserved_release

            client_wallet.save()

            Transaction.objects.create(
                walletID=client_wallet,
                transactionType=Transaction.TransactionType.REFUND,
                amount=refundable_escrow,
                balanceAfter=client_wallet.balance,
                status=Transaction.TransactionStatus.COMPLETED,
                description=f'Refund for cancelled daily job remaining escrow - Job #{job.jobID}',
                relatedJobPosting=job,
                paymentMethod='WALLET'
            )
        else:
            client_wallet.save()

        # Keep platform-fee visibility in transaction history for cancelled daily jobs.
        existing_fee_txn = Transaction.objects.filter(
            relatedJobPosting=job,
            transactionType=Transaction.TransactionType.FEE,
        ).order_by('-createdAt').first()

        if escrow_collected > Decimal('0.00'):
            if existing_fee_txn:
                if existing_fee_txn.status != Transaction.TransactionStatus.COMPLETED:
                    existing_fee_txn.status = Transaction.TransactionStatus.COMPLETED
                    existing_fee_txn.completedAt = timezone.now()
                    existing_fee_txn.amount = platform_fee_retained
                    existing_fee_txn.description = (
                        existing_fee_txn.description
                        or f'Platform fee retained for cancelled daily job - Job #{job.jobID}'
                    )
                    existing_fee_txn.save(update_fields=['status', 'completedAt', 'amount', 'description', 'updatedAt'])
            else:
                Transaction.objects.create(
                    walletID=client_wallet,
                    transactionType=Transaction.TransactionType.FEE,
                    amount=platform_fee_retained,
                    balanceAfter=client_wallet.balance,
                    status=Transaction.TransactionStatus.COMPLETED,
                    description=f'Platform fee retained for cancelled daily job - Job #{job.jobID}',
                    relatedJobPosting=job,
                    paymentMethod='WALLET',
                    completedAt=timezone.now(),
                    referenceNumber=f'DAILY-FEE-RET-{job.jobID}-{timezone.now().strftime("%Y%m%d%H%M%S")}',
                )
        
        # Update job status
        old_status = job.status
        job.status = 'CANCELLED'
        job.cancellationReason = reason
        job.save()

        # Persist structured cancellation metadata in JobLog so receipt fallback parsing
        # can reconstruct settlement details even if optional model fields are absent.
        JobLog.objects.create(
            jobID=job,
            notes=(
                f"[{timezone.now().strftime('%Y-%m-%d %I:%M:%S %p')}] Daily job cancelled by {cancelled_by}. "
                f"Stage={cancellation_stage}; client_refund=₱{refundable_escrow}; "
                f"worker_compensation=₱{total_paid}; reason={reason}"
            ),
            changedBy=user,
            oldStatus=old_status,
            newStatus=job.status,
        )

        # Close related conversation immediately when cancellation is finalized.
        # This keeps chat state consistent with project cancellation behavior.
        try:
            from profiles.models import Conversation
            from profiles.conversation_service import archive_conversation

            conversation = Conversation.objects.filter(relatedJobPosting=job).first()
            if conversation:
                conversation.status = Conversation.ConversationStatus.COMPLETED
                conversation.save(update_fields=['status', 'updatedAt'])
                archive_conversation(conversation)
        except Exception:
            # Cancellation should not fail if conversation closure/archive fails.
            pass

        # Notify client
        client_cancel_message = (
            f"Daily job cancelled ({cancellation_stage}). "
            f"₱{refundable_escrow} unused escrow refunded to your wallet. "
            f"Platform fee retained: ₱{platform_fee_retained}."
        )

        Notification.objects.create(
            accountFK=client_account,
            notificationType='JOB_CANCELLED',
            title='Job Cancelled',
            message=client_cancel_message,
            relatedJobID=job.jobID
        )

        if refundable_escrow > Decimal('0.00'):
            Notification.objects.create(
                accountFK=client_account,
                notificationType='PAYMENT_REFUNDED',
                title='Unused Escrow Refunded',
                message=(
                    f"Refunded ₱{refundable_escrow} unused daily escrow to your wallet. "
                    f"Platform fee retained: ₱{platform_fee_retained}."
                ),
                relatedJobID=job.jobID
            )

        # Notify worker/agency participants so mobile can surface consistent cancellation context.
        recipients: List[Accounts] = []
        if job.assignedWorkerID and job.assignedWorkerID.profileID and job.assignedWorkerID.profileID.accountFK:
            recipients.append(job.assignedWorkerID.profileID.accountFK)
        if job.assignedAgencyFK and job.assignedAgencyFK.accountFK:
            recipients.append(job.assignedAgencyFK.accountFK)

        seen_accounts = set()
        for recipient in recipients:
            if recipient.accountID in seen_accounts:
                continue
            seen_accounts.add(recipient.accountID)

            Notification.objects.create(
                accountFK=recipient,
                notificationType='JOB_CANCELLED',
                title='Daily Job Cancelled',
                message=(
                    f"Job '{job.title}' was cancelled by {cancelled_by.lower()}. "
                    f"Stage: {cancellation_stage}. Reason: {reason}."
                ),
                relatedJobID=job.jobID
            )
        
        return {
            'success': True,
            'cancelled_by': cancelled_by,
            'cancellation_stage': cancellation_stage,
            'days_planned': int(job.duration_days or 0),
            'days_paid': int(processed_days_count),
            'days_with_unprocessed_attendance': int(pending_attendance_count),
            'days_completed': job.total_days_worked,
            'total_paid_out': float(total_paid),
            'worker_compensation_amount': float(total_paid),
            'escrow_collected': float(escrow_collected),
            'refund_amount': float(refundable_escrow),
            'platform_fee_retained': float(platform_fee_retained),
            'refunded_escrow_only': True,
            'message': (
                f'Job cancelled ({cancellation_stage}). '
                f'₱{refundable_escrow} unused escrow refunded to client. '
                f'Platform fee retained: ₱{platform_fee_retained}.'
            )
        }
