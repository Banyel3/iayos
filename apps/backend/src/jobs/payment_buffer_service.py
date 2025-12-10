"""
Payment Buffer Service - 7-Day Holding Period

This service handles the payment buffer system where worker earnings are held
for a configurable period (default 7 days) before being released to their wallet.
During this buffer period, clients can request backjobs.

Functions:
- get_payment_buffer_days(): Get configured buffer period from PlatformSettings
- add_pending_earnings(): Add earnings to worker's pendingEarnings (Due Balance)
- release_pending_payment(): Transfer from pendingEarnings to balance
- get_pending_earnings_for_worker(): Get list of pending payments for a worker
- can_release_payment(): Check if payment can be released (no active backjob)
"""

from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Q

from accounts.models import (
    Job, Wallet, Transaction, Notification, JobDispute
)


def get_payment_buffer_days() -> int:
    """
    Get the payment buffer period from PlatformSettings.
    Returns 7 days as default if not configured.
    """
    try:
        from adminpanel.models import PlatformSettings
        settings = PlatformSettings.objects.first()
        if settings and settings.escrowHoldingDays:
            return settings.escrowHoldingDays
    except Exception as e:
        print(f"⚠️ Could not fetch PlatformSettings: {e}")
    return 7  # Default 7 days


def get_backjob_cooldown_hours() -> int:
    """
    Get the cooldown period after a backjob is rejected before client can submit another.
    Default: 24 hours
    """
    return 24  # 24 hours cooldown


def has_active_backjob(job: Job) -> bool:
    """
    Check if the job has an active/pending backjob request.
    Active means: OPEN or UNDER_REVIEW status
    """
    return JobDispute.objects.filter(
        jobID=job,
        status__in=['OPEN', 'UNDER_REVIEW']
    ).exists()


def can_request_backjob(job: Job) -> dict:
    """
    Check if a client can request a backjob for a job.
    
    Returns: {
        'can_request': bool,
        'reason': str (if can_request is False),
        'remaining_hours': int (if in cooldown)
    }
    """
    # Check if payment already released
    if job.paymentReleasedToWorker:
        return {
            'can_request': False,
            'reason': 'Payment has already been released to the worker. Backjob window has closed.'
        }
    
    # Check if job is completed
    if job.status != 'COMPLETED':
        return {
            'can_request': False,
            'reason': 'Backjob can only be requested for completed jobs.'
        }
    
    # Check for active backjob
    if has_active_backjob(job):
        return {
            'can_request': False,
            'reason': 'A backjob request is already pending for this job.'
        }
    
    # Check for cooldown after rejection
    last_rejected = JobDispute.objects.filter(
        jobID=job,
        status='CLOSED',
        adminRejectedAt__isnull=False
    ).order_by('-adminRejectedAt').first()
    
    if last_rejected and last_rejected.adminRejectedAt:
        cooldown_hours = get_backjob_cooldown_hours()
        cooldown_end = last_rejected.adminRejectedAt + timedelta(hours=cooldown_hours)
        
        if timezone.now() < cooldown_end:
            remaining = cooldown_end - timezone.now()
            remaining_hours = int(remaining.total_seconds() / 3600) + 1
            return {
                'can_request': False,
                'reason': f'Please wait {remaining_hours} hours before submitting another backjob request.',
                'remaining_hours': remaining_hours,
                'cooldown_ends_at': cooldown_end.isoformat()
            }
    
    return {'can_request': True}


@transaction.atomic
def add_pending_earnings(
    job: Job,
    recipient_account,
    amount: Decimal,
    recipient_type: str = "worker"
) -> dict:
    """
    Add earnings to worker's/agency's pendingEarnings (Due Balance).
    Sets up the payment buffer with release date.
    
    Args:
        job: The completed job
        recipient_account: The worker's or agency's account
        amount: The payment amount (full budget)
        recipient_type: "worker" or "agency"
    
    Returns:
        {
            'success': bool,
            'pending_earning_id': transaction ID,
            'release_date': datetime,
            'amount': Decimal
        }
    """
    buffer_days = get_payment_buffer_days()
    release_date = timezone.now() + timedelta(days=buffer_days)
    
    # Get or create recipient wallet
    recipient_wallet, _ = Wallet.objects.get_or_create(
        accountFK=recipient_account,
        defaults={'balance': Decimal('0.00'), 'pendingEarnings': Decimal('0.00')}
    )
    
    # Add to pending earnings (NOT to balance yet)
    recipient_wallet.pendingEarnings += amount
    recipient_wallet.save()
    
    print(f"💰 Added ₱{amount} to {recipient_type} pendingEarnings. New pending: ₱{recipient_wallet.pendingEarnings}")
    
    # Create PENDING_EARNING transaction record
    pending_txn = Transaction.objects.create(
        walletID=recipient_wallet,
        transactionType="PENDING_EARNING",
        amount=amount,
        balanceAfter=recipient_wallet.balance,  # Balance unchanged, this is pending
        status="PENDING",
        description=f"Pending payment for job: {job.title} (releases {release_date.strftime('%b %d, %Y')})" + 
                    (f" (Agency: {job.assignedAgencyFK.businessName})" if recipient_type == "agency" else ""),
        referenceNumber=f"JOB-{job.jobID}-PENDING-{timezone.now().strftime('%Y%m%d%H%M%S')}",
        relatedJobPosting=job
    )
    
    # Update job with payment buffer info
    job.paymentReleaseDate = release_date
    job.paymentReleasedToWorker = False
    job.paymentHeldReason = 'BUFFER_PERIOD'
    job.save()
    
    # Notify the recipient about pending payment
    days_text = f"{buffer_days} days" if buffer_days > 1 else "1 day"
    release_date_str = release_date.strftime('%B %d, %Y at %I:%M %p')
    
    if recipient_type == "agency":
        Notification.objects.create(
            accountFK=recipient_account,
            notificationType="PAYMENT_PENDING",
            title=f"Payment Pending - ₱{amount} 💰",
            message=f"Your agency earned ₱{amount} for '{job.title}'. Payment will be released on {release_date_str} ({days_text}).",
            relatedJobID=job.jobID
        )
    else:
        Notification.objects.create(
            accountFK=recipient_account,
            notificationType="PAYMENT_PENDING",
            title=f"Payment Pending - ₱{amount} 💰",
            message=f"You earned ₱{amount} for '{job.title}'. Payment will be released on {release_date_str} ({days_text}).",
            relatedJobID=job.jobID
        )
    
    print(f"📬 Pending payment notification sent to {recipient_type} {recipient_account.email}")
    
    return {
        'success': True,
        'pending_earning_id': pending_txn.transactionID,
        'release_date': release_date,
        'release_date_str': release_date_str,
        'amount': amount,
        'buffer_days': buffer_days
    }


@transaction.atomic  
def release_pending_payment(job: Job, force: bool = False) -> dict:
    """
    Release pending payment to worker's/agency's wallet.
    Transfers from pendingEarnings to balance.
    
    Args:
        job: The completed job to release payment for
        force: If True, releases even if there's an active backjob (admin use only)
    
    Returns:
        {
            'success': bool,
            'error': str (if failed),
            'amount': Decimal (if success)
        }
    """
    # Validation checks
    if job.paymentReleasedToWorker:
        return {'success': False, 'error': 'Payment already released'}
    
    if not force and has_active_backjob(job):
        return {'success': False, 'error': 'Cannot release payment while backjob is pending'}
    
    if not force and job.paymentReleaseDate and timezone.now() < job.paymentReleaseDate:
        return {
            'success': False, 
            'error': f'Payment not yet due. Release date: {job.paymentReleaseDate.strftime("%b %d, %Y")}'
        }
    
    # Determine recipient
    recipient_account = None
    recipient_type = None
    
    if job.assignedWorkerID and job.assignedWorkerID.profileID:
        recipient_account = job.assignedWorkerID.profileID.accountFK
        recipient_type = "worker"
    elif job.assignedAgencyFK:
        recipient_account = job.assignedAgencyFK.accountFK
        recipient_type = "agency"
    
    if not recipient_account:
        return {'success': False, 'error': 'No recipient found for this job'}
    
    # Get wallet
    try:
        recipient_wallet = Wallet.objects.get(accountFK=recipient_account)
    except Wallet.DoesNotExist:
        return {'success': False, 'error': 'Recipient wallet not found'}
    
    # Find the pending transaction for this job
    pending_txn = Transaction.objects.filter(
        walletID=recipient_wallet,
        relatedJobPosting=job,
        transactionType="PENDING_EARNING",
        status="PENDING"
    ).first()
    
    if not pending_txn:
        # Fallback: use job budget
        amount = job.budget
        print(f"⚠️ No pending transaction found, using job budget: ₱{amount}")
    else:
        amount = pending_txn.amount
    
    # Transfer from pendingEarnings to balance
    if recipient_wallet.pendingEarnings >= amount:
        recipient_wallet.pendingEarnings -= amount
    else:
        # Edge case: pendingEarnings was modified, just zero it out
        recipient_wallet.pendingEarnings = Decimal('0.00')
    
    recipient_wallet.balance += amount
    recipient_wallet.save()
    
    print(f"💸 Released ₱{amount} to {recipient_type} wallet. New balance: ₱{recipient_wallet.balance}, Pending: ₱{recipient_wallet.pendingEarnings}")
    
    # Update pending transaction to COMPLETED
    if pending_txn:
        pending_txn.status = "COMPLETED"
        pending_txn.balanceAfter = recipient_wallet.balance
        pending_txn.description = pending_txn.description.replace("Pending payment", "Payment released")
        pending_txn.completedAt = timezone.now()
        pending_txn.save()
    
    # Create EARNING transaction record for the release
    Transaction.objects.create(
        walletID=recipient_wallet,
        transactionType="EARNING",
        amount=amount,
        balanceAfter=recipient_wallet.balance,
        status="COMPLETED",
        description=f"Payment released for job: {job.title}" + 
                    (f" (Agency: {job.assignedAgencyFK.businessName})" if recipient_type == "agency" else ""),
        referenceNumber=f"JOB-{job.jobID}-RELEASE-{timezone.now().strftime('%Y%m%d%H%M%S')}",
        relatedJobPosting=job,
        completedAt=timezone.now()
    )
    
    # Update job
    job.paymentReleasedToWorker = True
    job.paymentReleasedAt = timezone.now()
    job.paymentHeldReason = 'RELEASED'
    job.save()
    
    # Notify the recipient
    if recipient_type == "agency":
        Notification.objects.create(
            accountFK=recipient_account,
            notificationType="PAYMENT_RELEASED",
            title=f"Payment Released! 🎉",
            message=f"Your agency received ₱{amount} for '{job.title}'. The funds have been added to your wallet!",
            relatedJobID=job.jobID
        )
    else:
        Notification.objects.create(
            accountFK=recipient_account,
            notificationType="PAYMENT_RELEASED",
            title=f"Payment Released! 🎉",
            message=f"You received ₱{amount} for '{job.title}'. The funds have been added to your wallet!",
            relatedJobID=job.jobID
        )
    
    print(f"📬 Payment release notification sent to {recipient_type} {recipient_account.email}")
    
    return {
        'success': True,
        'amount': amount,
        'recipient_type': recipient_type,
        'new_balance': recipient_wallet.balance
    }


def get_pending_earnings_for_account(account) -> list:
    """
    Get all pending earnings for a user account.
    Returns list of pending payments with job details and release dates.
    """
    try:
        wallet = Wallet.objects.get(accountFK=account)
    except Wallet.DoesNotExist:
        return []
    
    # Get pending transactions
    pending_txns = Transaction.objects.filter(
        walletID=wallet,
        transactionType="PENDING_EARNING",
        status="PENDING"
    ).select_related('relatedJobPosting').order_by('relatedJobPosting__paymentReleaseDate')
    
    result = []
    for txn in pending_txns:
        job = txn.relatedJobPosting
        if job:
            result.append({
                'transaction_id': txn.transactionID,
                'job_id': job.jobID,
                'job_title': job.title,
                'amount': float(txn.amount),
                'release_date': job.paymentReleaseDate.isoformat() if job.paymentReleaseDate else None,
                'release_date_formatted': job.paymentReleaseDate.strftime('%b %d, %Y') if job.paymentReleaseDate else 'Unknown',
                'days_until_release': (job.paymentReleaseDate - timezone.now()).days if job.paymentReleaseDate else 0,
                'held_reason': job.paymentHeldReason,
                'has_active_backjob': has_active_backjob(job),
                'created_at': txn.createdAt.isoformat()
            })
    
    return result


def get_jobs_ready_for_payment_release() -> list:
    """
    Get all jobs that are ready for automatic payment release.
    Criteria:
    - Job status is COMPLETED
    - paymentReleasedToWorker is False
    - paymentReleaseDate <= now
    - No active backjob (OPEN or UNDER_REVIEW)
    """
    now = timezone.now()
    
    # Get completed jobs with pending payments
    jobs = Job.objects.filter(
        status='COMPLETED',
        paymentReleasedToWorker=False,
        paymentReleaseDate__lte=now
    ).select_related(
        'assignedWorkerID__profileID__accountFK',
        'assignedAgencyFK__accountFK'
    )
    
    # Filter out jobs with active backjobs
    ready_jobs = []
    for job in jobs:
        if not has_active_backjob(job):
            ready_jobs.append(job)
    
    return ready_jobs


def hold_payment_for_backjob(job: Job) -> dict:
    """
    Put a payment on hold due to a backjob request.
    Called when a backjob is submitted.
    """
    job.paymentHeldReason = 'BACKJOB_PENDING'
    job.save()
    
    print(f"⏸️ Payment for job #{job.jobID} held due to backjob request")
    
    return {'success': True, 'held_reason': 'BACKJOB_PENDING'}


def resume_payment_after_backjob_rejection(job: Job) -> dict:
    """
    Resume the payment buffer countdown after a backjob is rejected.
    Does NOT immediately release - just changes status back to BUFFER_PERIOD.
    """
    job.paymentHeldReason = 'BUFFER_PERIOD'
    job.save()
    
    print(f"▶️ Payment buffer resumed for job #{job.jobID} after backjob rejection")
    
    # Check if release date has already passed
    if job.paymentReleaseDate and timezone.now() >= job.paymentReleaseDate:
        # Release immediately
        return release_pending_payment(job)
    
    return {'success': True, 'held_reason': 'BUFFER_PERIOD', 'auto_released': False}
