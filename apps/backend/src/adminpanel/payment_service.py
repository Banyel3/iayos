"""
Payment Management Service for Admin Panel

This module handles all payment-related operations for the admin panel:
- Transaction listing and filtering
- Transaction statistics and analytics
- Escrow management (hold, release, bulk operations)
- Worker earnings and payouts
- Dispute management and resolution
- Revenue trends and analytics
"""

from django.db.models import Sum, Count, Avg, Q, F, DecimalField, Value
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, Coalesce
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, Dict, List, Any

from accounts.models import (
    Transaction, Job, Profile, Wallet, JobDispute, 
    ClientProfile, WorkerProfile, Accounts, UserPaymentMethod, Notification
)
from adminpanel.audit_service import log_action


# ===============================
# Transaction Management
# ===============================

def get_transactions_list(
    page: int = 1,
    limit: int = 50,
    status: Optional[str] = None,
    payment_method: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get paginated list of all transactions with filtering
    
    Args:
        page: Page number (1-indexed)
        limit: Number of records per page
        status: Filter by transaction status (PENDING/COMPLETED/FAILED/CANCELLED)
        payment_method: Filter by payment method (WALLET/GCASH/MAYA/CARD/BANK_TRANSFER/CASH)
        date_from: Start date for filtering (YYYY-MM-DD)
        date_to: End date for filtering (YYYY-MM-DD)
        search: Search term for description, reference number
        
    Returns:
        Dictionary with transactions list and metadata
    """
    try:
        # Base queryset with related data
        queryset = Transaction.objects.select_related(
            'walletID__accountFK',
            'relatedJobPosting'
        ).all()
        
        # Apply filters
        if status:
            queryset = queryset.filter(status=status)
            
        if payment_method:
            queryset = queryset.filter(paymentMethod=payment_method)
            
        if date_from:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
            queryset = queryset.filter(createdAt__gte=date_from_obj)
            
        if date_to:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
            # Add 1 day to include the entire end date
            queryset = queryset.filter(createdAt__lt=date_to_obj + timedelta(days=1))
            
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(referenceNumber__icontains=search) |
                Q(transactionID__icontains=search)
            )
        
        # Get total count
        total = queryset.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        transactions = queryset[offset:offset + limit]
        
        # Format transactions
        transactions_list = []
        for txn in transactions:
            # Get user info
            user_email = txn.walletID.accountFK.email if txn.walletID else 'N/A'
            # Get profile for name (Profile has firstName/lastName, not Accounts)
            profile = Profile.objects.filter(accountFK=txn.walletID.accountFK).first() if txn.walletID else None
            user_name = f"{profile.firstName or ''} {profile.lastName or ''}".strip() if profile else user_email
            if not user_name:
                user_name = user_email
            
            # Get job info
            job_title = txn.relatedJobPosting.title if txn.relatedJobPosting else None
            job_id = txn.relatedJobPosting.jobID if txn.relatedJobPosting else None
            
            transactions_list.append({
                'id': str(txn.transactionID),
                'reference_number': txn.referenceNumber or f"TXN-{txn.transactionID}",
                'type': txn.transactionType,
                'amount': float(txn.amount),
                'status': txn.status,
                'payment_method': txn.paymentMethod,
                'user_name': user_name,
                'user_email': user_email,
                'job_title': job_title,
                'job_id': job_id,
                'description': txn.description or '',
                'created_at': txn.createdAt.isoformat(),
                'completed_at': txn.completedAt.isoformat() if txn.completedAt else None,
            })
        
        return {
            'success': True,
            'transactions': transactions_list,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit  # Ceiling division
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'transactions': [],
            'total': 0
        }


def get_transaction_statistics() -> Dict[str, Any]:
    """
    Get overall transaction statistics
    
    Returns:
        Dictionary with various transaction metrics
    """
    try:
        # Total transactions
        total_transactions = Transaction.objects.count()
        
        # Total volume (all completed transactions)
        total_volume = Transaction.objects.filter(
            status='COMPLETED'
        ).aggregate(
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        )['total']
        
        # Pending transactions
        pending_count = Transaction.objects.filter(status='PENDING').count()
        pending_amount = Transaction.objects.filter(
            status='PENDING'
        ).aggregate(
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        )['total']
        
        # Platform fees collected (FEE type transactions)
        platform_fees = Transaction.objects.filter(
            transactionType='FEE',
            status='COMPLETED'
        ).aggregate(
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        )['total']
        
        # Escrow held (PAYMENT type, PENDING status)
        escrow_held = Transaction.objects.filter(
            transactionType='PAYMENT',
            status='PENDING'
        ).aggregate(
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        )['total']
        
        # Refunded amount (REFUND type, COMPLETED status)
        refunded_amount = Transaction.objects.filter(
            transactionType='REFUND',
            status='COMPLETED'
        ).aggregate(
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        )['total']
        
        # Today's transactions
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = Transaction.objects.filter(createdAt__gte=today_start).count()
        today_volume = Transaction.objects.filter(
            createdAt__gte=today_start,
            status='COMPLETED'
        ).aggregate(
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        )['total']
        
        # This month's transactions
        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_count = Transaction.objects.filter(createdAt__gte=month_start).count()
        month_volume = Transaction.objects.filter(
            createdAt__gte=month_start,
            status='COMPLETED'
        ).aggregate(
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        )['total']
        
        # Payment method breakdown
        payment_methods = Transaction.objects.values('paymentMethod').annotate(
            count=Count('transactionID'),
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        ).order_by('-total')
        
        return {
            'success': True,
            'total_transactions': total_transactions,
            'total_volume': float(total_volume),
            'pending_transactions': pending_count,
            'pending_amount': float(pending_amount),
            'platform_fees': float(platform_fees),
            'escrow_held': float(escrow_held),
            'refunded_amount': float(refunded_amount),
            'today': {
                'count': today_count,
                'volume': float(today_volume)
            },
            'this_month': {
                'count': month_count,
                'volume': float(month_volume)
            },
            'payment_methods': [
                {
                    'method': pm['paymentMethod'],
                    'count': pm['count'],
                    'total': float(pm['total'])
                }
                for pm in payment_methods
            ]
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_transaction_detail(transaction_id: int) -> Dict[str, Any]:
    """
    Get detailed information about a specific transaction
    
    Args:
        transaction_id: Transaction ID
        
    Returns:
        Dictionary with complete transaction details formatted for frontend
    """
    try:
        txn = Transaction.objects.select_related(
            'walletID__accountFK',
            'relatedJobPosting__clientID__profileID__accountFK',
            'relatedJobPosting__assignedWorkerID__profileID__accountFK'
        ).get(transactionID=transaction_id)
        
        # User info (wallet owner)
        user = txn.walletID.accountFK if txn.walletID else None
        user_info = None
        if user:
            profile = Profile.objects.filter(accountFK=user).first()
            user_info = {
                'id': str(user.accountID),
                'email': user.email,
                'name': f"{profile.firstName or ''} {profile.lastName or ''}".strip() if profile else user.email,
                'phone': profile.contactNum if profile else 'N/A',
                'profile_type': profile.profileType if profile else 'Unknown'
            }
        
        # Build payer and payee info from job or wallet owner
        payer_info = None
        payee_info = None
        job_info = None
        
        if txn.relatedJobPosting:
            job = txn.relatedJobPosting
            
            # Client info (payer)
            if job.clientID and job.clientID.profileID:
                client = job.clientID.profileID.accountFK
                client_profile = job.clientID.profileID
                payer_info = {
                    'id': str(client.accountID),
                    'name': f"{client_profile.firstName or ''} {client_profile.lastName or ''}".strip() or client.email,
                    'email': client.email,
                    'profile_type': 'CLIENT'
                }
            
            # Worker info (payee)
            if job.assignedWorkerID and job.assignedWorkerID.profileID:
                worker = job.assignedWorkerID.profileID.accountFK
                worker_profile = job.assignedWorkerID.profileID
                payee_info = {
                    'id': str(worker.accountID),
                    'name': f"{worker_profile.firstName or ''} {worker_profile.lastName or ''}".strip() or worker.email,
                    'email': worker.email,
                    'profile_type': 'WORKER'
                }
            
            # Job info
            job_info = {
                'id': str(job.jobID),
                'title': job.title,
                'status': job.status,
                'budget': float(job.budget)
            }
        else:
            # Fallback to wallet owner as payer/payee based on transaction type
            if user_info:
                if txn.transactionType in ['DEPOSIT', 'PAYMENT', 'FEE']:
                    payer_info = user_info
                elif txn.transactionType in ['WITHDRAWAL', 'REFUND', 'EARNINGS']:
                    payee_info = user_info
        
        # Escrow details (for PAYMENT type transactions)
        escrow_details = None
        if txn.transactionType == 'PAYMENT':
            days_held = (timezone.now() - txn.createdAt).days
            downpayment = float(txn.amount)
            escrow_details = {
                'amount_held': downpayment,
                'downpayment_amount': downpayment,
                'final_payment_amount': downpayment,  # Same as downpayment (50/50 split)
                'days_held': days_held,
                'can_release': txn.status == 'PENDING',
                'escrow_paid_at': txn.createdAt.isoformat(),
                'released_at': txn.completedAt.isoformat() if txn.status == 'COMPLETED' and txn.completedAt else None
            }
        
        return {
            'success': True,
            'transaction': {
                'id': str(txn.transactionID),
                'reference_number': txn.referenceNumber or f"TXN-{txn.transactionID}",
                'type': txn.transactionType,
                'amount': float(txn.amount),
                'balance_after': float(txn.balanceAfter) if txn.balanceAfter else None,
                'status': txn.status.lower() if txn.status else 'pending',
                'payment_method': txn.paymentMethod or 'WALLET',
                'description': txn.description or '',
                'created_at': txn.createdAt.isoformat(),
                'completed_at': txn.completedAt.isoformat() if txn.completedAt else None
            },
            'payer': payer_info,
            'payee': payee_info,
            'job': job_info,
            'escrow_details': escrow_details,
            'audit_trail': []  # TODO: Implement audit trail from AuditLog model
        }
        
    except Transaction.DoesNotExist:
        return {
            'success': False,
            'error': 'Transaction not found'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def release_escrow(transaction_id: int, reason: Optional[str] = None, admin=None, request=None) -> Dict[str, Any]:
    """
    Release escrow payment to worker
    
    Args:
        transaction_id: Transaction ID
        reason: Optional reason for release
        admin: Admin user performing the action
        request: HTTP request object for audit logging
        
    Returns:
        Success/error response
    """
    try:
        txn = Transaction.objects.select_related('relatedJobPosting').get(
            transactionID=transaction_id
        )
        
        # Validate transaction type and status
        if txn.transactionType != 'PAYMENT':
            return {
                'success': False,
                'error': 'Only PAYMENT transactions can be released from escrow'
            }
        
        if txn.status != 'PENDING':
            return {
                'success': False,
                'error': f'Cannot release transaction with status: {txn.status}'
            }
        
        # Store before state for audit
        before_state = {"status": txn.status, "amount": float(txn.amount)}
        
        # Update transaction status
        txn.status = 'COMPLETED'
        txn.completedAt = timezone.now()
        if reason:
            txn.description = f"{txn.description or ''}\nRelease reason: {reason}".strip()
        txn.save()
        
        # Update job escrow status if exists
        if txn.relatedJobPosting:
            job = txn.relatedJobPosting
            job.escrowPaid = True
            job.escrowPaidAt = timezone.now()
            job.save()
        
        # Log audit trail
        if admin:
            log_action(
                admin=admin,
                action="payment_release",
                entity_type="payment",
                entity_id=str(transaction_id),
                details={"action": "escrow_released", "reason": reason or "N/A", "amount": float(txn.amount)},
                before_value=before_state,
                after_value={"status": "COMPLETED", "amount": float(txn.amount)},
                request=request
            )
        
        return {
            'success': True,
            'message': 'Escrow payment released successfully',
            'transaction_id': str(txn.transactionID)
        }
        
    except Transaction.DoesNotExist:
        return {
            'success': False,
            'error': 'Transaction not found'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def process_refund(
    transaction_id: int,
    amount: float,
    reason: str,
    refund_to: str = 'WALLET',
    admin=None,
    request=None
) -> Dict[str, Any]:
    """
    Process refund for a transaction
    
    Args:
        transaction_id: Original transaction ID
        amount: Refund amount
        reason: Reason for refund
        refund_to: Refund destination (WALLET/GCASH/BANK_TRANSFER)
        admin: Admin user performing the action
        request: HTTP request object for audit logging
        
    Returns:
        Success/error response
    """
    try:
        original_txn = Transaction.objects.select_related('walletID').get(
            transactionID=transaction_id
        )
        
        # Validate refund amount
        if Decimal(str(amount)) > original_txn.amount:
            return {
                'success': False,
                'error': 'Refund amount cannot exceed original transaction amount'
            }
        
        # Create refund transaction
        refund_txn = Transaction.objects.create(
            walletID=original_txn.walletID,
            transactionType='REFUND',
            amount=Decimal(str(amount)),
            status='COMPLETED',
            paymentMethod=refund_to,
            description=f"Refund for TXN-{transaction_id}: {reason}",
            referenceNumber=f"REFUND-{transaction_id}-{timezone.now().timestamp()}",
            relatedJobPosting=original_txn.relatedJobPosting,
            completedAt=timezone.now()
        )
        
        # Update wallet balance
        if original_txn.walletID:
            wallet = original_txn.walletID
            wallet.balance += Decimal(str(amount))
            wallet.save()
            refund_txn.balanceAfter = wallet.balance
            refund_txn.save()
        
        # Update original transaction
        original_txn.description = f"{original_txn.description or ''}\nRefunded: ₱{amount} - {reason}".strip()
        original_txn.save()
        
        # Log audit trail
        if admin:
            log_action(
                admin=admin,
                action="payment_refund",
                entity_type="payment",
                entity_id=str(transaction_id),
                details={"action": "refund_processed", "amount": amount, "reason": reason, "refund_to": refund_to},
                before_value={"original_amount": float(original_txn.amount)},
                after_value={"refund_amount": amount, "refund_txn_id": str(refund_txn.transactionID)},
                request=request
            )
        
        return {
            'success': True,
            'message': 'Refund processed successfully',
            'refund_transaction_id': str(refund_txn.transactionID),
            'amount_refunded': float(amount)
        }
        
    except Transaction.DoesNotExist:
        return {
            'success': False,
            'error': 'Original transaction not found'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


# ===============================
# Escrow Management
# ===============================

def get_escrow_payments(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50
) -> Dict[str, Any]:
    """
    Get list of escrow payments (50% downpayments)
    
    Args:
        status: Filter by status (PENDING/COMPLETED)
        search: Search term
        page: Page number
        limit: Records per page
        
    Returns:
        Dictionary with escrow payments list
    """
    try:
        # Base queryset - PAYMENT type transactions
        queryset = Transaction.objects.filter(
            transactionType='PAYMENT'
        ).select_related(
            'walletID__accountFK',
            'relatedJobPosting__clientID__profileID__accountFK',
            'relatedJobPosting__assignedWorkerID__profileID__accountFK'
        )
        
        # Apply filters
        if status:
            queryset = queryset.filter(status=status)
            
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(referenceNumber__icontains=search) |
                Q(relatedJobPosting__title__icontains=search)
            )
        
        # Get total count
        total = queryset.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        escrow_payments = queryset[offset:offset + limit]
        
        # Format escrow payments
        escrow_list = []
        for txn in escrow_payments:
            job = txn.relatedJobPosting
            client = job.clientID.profileID.accountFK if job else None
            client_profile = job.clientID.profileID if job else None
            worker = job.assignedWorkerID.profileID.accountFK if job and job.assignedWorkerID else None
            worker_profile = job.assignedWorkerID.profileID if job and job.assignedWorkerID else None
            
            days_held = (timezone.now() - txn.createdAt).days
            
            escrow_list.append({
                'id': str(txn.transactionID),
                'reference_number': txn.referenceNumber or f"TXN-{txn.transactionID}",
                'amount': float(txn.amount),
                'status': txn.status,
                'job_id': job.jobID if job else None,
                'job_title': job.title if job else 'N/A',
                'client_name': f"{client_profile.firstName or ''} {client_profile.lastName or ''}".strip() if client_profile else 'N/A',
                'worker_name': f"{worker_profile.firstName or ''} {worker_profile.lastName or ''}".strip() if worker_profile else 'Not assigned',
                'days_held': days_held,
                'created_at': txn.createdAt.isoformat(),
                'completed_at': txn.completedAt.isoformat() if txn.completedAt else None,
            })
        
        return {
            'success': True,
            'escrow_payments': escrow_list,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'escrow_payments': [],
            'total': 0
        }


def get_escrow_statistics() -> Dict[str, Any]:
    """
    Get escrow payment statistics
    
    Returns:
        Dictionary with escrow metrics
    """
    try:
        # Total escrow held (PENDING payments)
        escrow_held = Transaction.objects.filter(
            transactionType='PAYMENT',
            status='PENDING'
        ).aggregate(
            total=Coalesce(Sum('amount'), Value(Decimal('0.00'))),
            count=Count('transactionID')
        )
        
        # Released today
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        released_today = Transaction.objects.filter(
            transactionType='PAYMENT',
            status='COMPLETED',
            completedAt__gte=today_start
        ).aggregate(
            total=Coalesce(Sum('amount'), Value(Decimal('0.00'))),
            count=Count('transactionID')
        )
        
        # Refunded this month
        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        refunded_month = Transaction.objects.filter(
            transactionType='REFUND',
            status='COMPLETED',
            createdAt__gte=month_start
        ).aggregate(
            total=Coalesce(Sum('amount'), Value(Decimal('0.00'))),
            count=Count('transactionID')
        )
        
        # Average escrow amount
        avg_escrow = Transaction.objects.filter(
            transactionType='PAYMENT'
        ).aggregate(
            avg=Coalesce(Avg('amount'), Value(Decimal('0.00')))
        )['avg']
        
        # Oldest pending escrow
        oldest_pending = Transaction.objects.filter(
            transactionType='PAYMENT',
            status='PENDING'
        ).order_by('createdAt').first()
        
        oldest_days = 0
        if oldest_pending:
            oldest_days = (timezone.now() - oldest_pending.createdAt).days
        
        return {
            'success': True,
            'total_held': float(escrow_held['total']),
            'pending_count': escrow_held['count'],
            'released_today': {
                'amount': float(released_today['total']),
                'count': released_today['count']
            },
            'refunded_this_month': {
                'amount': float(refunded_month['total']),
                'count': refunded_month['count']
            },
            'average_amount': float(avg_escrow),
            'oldest_pending_days': oldest_days
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def bulk_release_escrow(escrow_ids: List[int], reason: Optional[str] = None) -> Dict[str, Any]:
    """
    Release multiple escrow payments at once
    
    Args:
        escrow_ids: List of transaction IDs
        reason: Optional reason for bulk release
        
    Returns:
        Success/error response with counts
    """
    try:
        # Get pending payment transactions
        transactions = Transaction.objects.filter(
            transactionID__in=escrow_ids,
            transactionType='PAYMENT',
            status='PENDING'
        )
        
        # Count transactions
        count = transactions.count()
        
        if count == 0:
            return {
                'success': False,
                'error': 'No valid escrow payments found to release'
            }
        
        # Update all transactions
        now = timezone.now()
        updated = transactions.update(
            status='COMPLETED',
            completedAt=now
        )
        
        # Update related jobs
        job_ids = transactions.values_list('relatedJobPosting', flat=True)
        Job.objects.filter(jobID__in=job_ids).update(
            escrowPaid=True,
            escrowPaidAt=now
        )
        
        return {
            'success': True,
            'message': f'Successfully released {updated} escrow payments',
            'released_count': updated
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


# ===============================
# Worker Earnings & Payouts
# ===============================

def get_worker_earnings(
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50
) -> Dict[str, Any]:
    """
    Get worker earnings aggregated by worker
    
    Args:
        search: Search term for worker name/email
        page: Page number
        limit: Records per page
        
    Returns:
        Dictionary with worker earnings list
    """
    try:
        # Get all workers with earnings
        workers = WorkerProfile.objects.select_related(
            'profileID__accountFK'
        ).filter(
            assigned_jobs__isnull=False
        ).distinct()
        
        # Apply search filter
        if search:
            workers = workers.filter(
                Q(profileID__accountFK__firstName__icontains=search) |
                Q(profileID__accountFK__lastName__icontains=search) |
                Q(profileID__accountFK__email__icontains=search)
            )
        
        # Get total count
        total = workers.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        workers = workers[offset:offset + limit]
        
        # Calculate earnings for each worker
        earnings_list = []
        for worker in workers:
            account = worker.profileID.accountFK
            
            # Get completed jobs
            completed_jobs = Job.objects.filter(
                assignedWorkerID=worker,
                status='COMPLETED'
            )
            
            # Calculate total earnings (job budget - platform fees)
            total_earnings = completed_jobs.aggregate(
                total=Coalesce(Sum('budget'), Value(Decimal('0.00')))
            )['total']
            
            # Platform takes 5% fee
            platform_fee = total_earnings * Decimal('0.05')
            net_earnings = total_earnings - platform_fee
            
            # Get payout transactions (WITHDRAWAL type)
            payouts = Transaction.objects.filter(
                walletID__accountFK=account,
                transactionType='WITHDRAWAL',
                status='COMPLETED'
            ).aggregate(
                total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
            )['total']
            
            # Calculate pending payout
            pending_payout = net_earnings - payouts
            
            earnings_list.append({
                'worker_id': worker.pk,  # Use pk instead of workerID
                'name': f"{worker.profileID.firstName or ''} {worker.profileID.lastName or ''}".strip() or account.email,
                'email': account.email,
                'jobs_completed': completed_jobs.count(),
                'total_earnings': float(total_earnings),
                'platform_fee': float(platform_fee),
                'net_earnings': float(net_earnings),
                'paid_out': float(payouts),
                'pending_payout': float(pending_payout),
                'average_per_job': float(total_earnings / completed_jobs.count()) if completed_jobs.count() > 0 else 0.0
            })
        
        # Sort by pending payout (highest first)
        earnings_list.sort(key=lambda x: x['pending_payout'], reverse=True)
        
        return {
            'success': True,
            'worker_earnings': earnings_list,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'worker_earnings': [],
            'total': 0
        }


def get_worker_earnings_statistics() -> Dict[str, Any]:
    """
    Get overall worker earnings statistics
    
    Returns:
        Dictionary with worker earnings metrics
    """
    try:
        # Total completed jobs
        completed_jobs = Job.objects.filter(status='COMPLETED')
        total_jobs = completed_jobs.count()
        
        # Total earnings (sum of all completed job budgets)
        total_earnings = completed_jobs.aggregate(
            total=Coalesce(Sum('budget'), Value(Decimal('0.00')))
        )['total']
        
        # Platform fees (5%)
        platform_fees = total_earnings * Decimal('0.05')
        net_earnings = total_earnings - platform_fees
        
        # Total payouts (WITHDRAWAL transactions)
        total_payouts = Transaction.objects.filter(
            transactionType='WITHDRAWAL',
            status='COMPLETED'
        ).aggregate(
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        )['total']
        
        # Pending payouts
        pending_payouts = net_earnings - total_payouts
        
        # Average per worker
        active_workers = WorkerProfile.objects.filter(
            assigned_jobs__status='COMPLETED'
        ).distinct().count()
        
        avg_per_worker = net_earnings / active_workers if active_workers > 0 else Decimal('0.00')
        
        # This month's payouts
        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_payouts = Transaction.objects.filter(
            transactionType='WITHDRAWAL',
            status='COMPLETED',
            completedAt__gte=month_start
        ).aggregate(
            total=Coalesce(Sum('amount'), Value(Decimal('0.00'))),
            count=Count('transactionID')
        )
        
        return {
            'success': True,
            'total_workers': active_workers,
            'total_jobs_completed': total_jobs,
            'total_earnings': float(total_earnings),
            'platform_fees': float(platform_fees),
            'net_earnings': float(net_earnings),
            'total_payouts': float(total_payouts),
            'pending_payouts': float(pending_payouts),
            'average_per_worker': float(avg_per_worker),
            'this_month_payouts': {
                'amount': float(month_payouts['total']),
                'count': month_payouts['count']
            }
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def process_payout(
    worker_id: int,
    amount: float,
    payout_method: str,
    gcash_number: Optional[str] = None,
    bank_details: Optional[str] = None
) -> Dict[str, Any]:
    """
    Process payout to worker
    
    Args:
        worker_id: Worker profile ID
        amount: Payout amount
        payout_method: GCASH or BANK_TRANSFER
        gcash_number: GCash number (if GCASH method)
        bank_details: Bank account details (if BANK_TRANSFER method)
        
    Returns:
        Success/error response
    """
    try:
        # Get worker and account
        worker = WorkerProfile.objects.select_related('profileID__accountFK').get(
            workerID=worker_id
        )
        account = worker.profileID.accountFK
        
        # Get or create wallet
        wallet, created = Wallet.objects.get_or_create(
            accountFK=account,
            defaults={'balance': Decimal('0.00')}
        )
        
        # Validate amount
        amount_decimal = Decimal(str(amount))
        if amount_decimal <= 0:
            return {
                'success': False,
                'error': 'Payout amount must be greater than 0'
            }
        
        # Create payout transaction
        description = f"Payout to worker via {payout_method}"
        if payout_method == 'GCASH' and gcash_number:
            description += f" - GCash: {gcash_number}"
        elif payout_method == 'BANK_TRANSFER' and bank_details:
            description += f" - {bank_details}"
        
        payout_txn = Transaction.objects.create(
            walletID=wallet,
            transactionType='WITHDRAWAL',
            amount=amount_decimal,
            status='COMPLETED',
            paymentMethod=payout_method,
            description=description,
            referenceNumber=f"PAYOUT-{worker_id}-{timezone.now().timestamp()}",
            completedAt=timezone.now()
        )
        
        # Update wallet balance (deduct payout)
        wallet.balance -= amount_decimal
        wallet.save()
        payout_txn.balanceAfter = wallet.balance
        payout_txn.save()
        
        return {
            'success': True,
            'message': 'Payout processed successfully',
            'transaction_id': str(payout_txn.transactionID),
            'amount': float(amount)
        }
        
    except WorkerProfile.DoesNotExist:
        return {
            'success': False,
            'error': 'Worker not found'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


# ===============================
# Dispute Management
# ===============================

def get_disputes_list(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50
) -> Dict[str, Any]:
    """
    Get list of job disputes
    
    Args:
        status: Filter by status (OPEN/UNDER_REVIEW/RESOLVED/CLOSED)
        priority: Filter by priority (LOW/MEDIUM/HIGH/CRITICAL)
        search: Search term
        page: Page number
        limit: Records per page
        
    Returns:
        Dictionary with disputes list
    """
    try:
        # Base queryset
        queryset = JobDispute.objects.select_related(
            'jobID__clientID__profileID__accountFK',
            'jobID__assignedWorkerID__profileID__accountFK'
        ).all()
        
        # Apply filters
        if status:
            queryset = queryset.filter(status=status)
            
        if priority:
            queryset = queryset.filter(priority=priority)
            
        if search:
            queryset = queryset.filter(
                Q(reason__icontains=search) |
                Q(description__icontains=search) |
                Q(jobID__title__icontains=search) |
                Q(disputeID__icontains=search)
            )
        
        # Get total count
        total = queryset.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        disputes = queryset[offset:offset + limit]
        
        # Format disputes
        disputes_list = []
        for dispute in disputes:
            job = dispute.jobID
            client = job.clientID.profileID.accountFK
            worker = job.assignedWorkerID.profileID.accountFK if job.assignedWorkerID else None
            
            days_open = (timezone.now() - dispute.openedDate).days
            
            disputes_list.append({
                'id': dispute.disputeID,
                'job_id': job.jobID,
                'job_title': job.title,
                'disputed_by': dispute.disputedBy,
                'reason': dispute.reason,
                'status': dispute.status,
                'priority': dispute.priority,
                'job_amount': float(dispute.jobAmount),
                'disputed_amount': float(dispute.disputedAmount),
                'client_name': f"{job.clientID.profileID.firstName or ''} {job.clientID.profileID.lastName or ''}".strip() or client.email,
                'worker_name': f"{job.assignedWorkerID.profileID.firstName or ''} {job.assignedWorkerID.profileID.lastName or ''}".strip() if job.assignedWorkerID else 'Not assigned',
                'days_open': days_open,
                'opened_date': dispute.openedDate.isoformat(),
                'resolved_date': dispute.resolvedDate.isoformat() if dispute.resolvedDate else None,
                'assigned_to': dispute.assignedTo
            })
        
        return {
            'success': True,
            'disputes': disputes_list,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'disputes': [],
            'total': 0
        }


def get_dispute_detail(dispute_id: int) -> Dict[str, Any]:
    """
    Get detailed information about a specific dispute
    
    Args:
        dispute_id: Dispute ID
        
    Returns:
        Dictionary with complete dispute details including job logs and backjob workflow
    """
    try:
        from accounts.models import JobLog
        
        dispute = JobDispute.objects.select_related(
            'jobID__clientID__profileID__accountFK',
            'jobID__assignedWorkerID__profileID__accountFK',
            'jobID__assignedAgencyFK__accountFK'
        ).prefetch_related('evidence').get(disputeID=dispute_id)
        
        job = dispute.jobID
        client = job.clientID.profileID.accountFK
        worker = job.assignedWorkerID.profileID.accountFK if job.assignedWorkerID else None
        agency = job.assignedAgencyFK if job.assignedAgencyFK else None
        
        # Get evidence images - construct full URL for local storage paths
        base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
        evidence_images = []
        for e in dispute.evidence.all():
            url = e.imageURL
            # If it's a relative path (starts with /media/), prepend the base URL
            if url and url.startswith('/media/'):
                url = f"{base_url}{url}"
            evidence_images.append(url)
        
        # Get related transactions
        transactions = Transaction.objects.filter(
            relatedJobPosting=job
        ).values(
            'transactionID', 'transactionType', 'amount', 
            'status', 'paymentMethod', 'createdAt'
        )
        
        # Get job logs (activity log) - especially backjob-related ones
        job_logs = JobLog.objects.filter(jobID=job).select_related('changedBy').order_by('-createdAt')
        activity_logs = []
        for log in job_logs:
            activity_logs.append({
                'id': log.logID,
                'old_status': log.oldStatus,
                'new_status': log.newStatus,
                'changed_by': log.changedBy.email if log.changedBy else 'System',
                'notes': log.notes,
                'created_at': log.createdAt.isoformat(),
                'is_backjob_event': log.newStatus in ['BACKJOB_REQ', 'BACKJOB_APPROVED', 'BACKJOB_STARTED', 'BACKJOB_WORKER_DONE', 'BACKJOB_RESOLVED']
            })
        
        # Get backjob workflow status
        backjob_workflow = {
            'backjob_started': dispute.backjobStarted,
            'backjob_started_at': dispute.backjobStartedAt.isoformat() if dispute.backjobStartedAt else None,
            'worker_marked_complete': dispute.workerMarkedBackjobComplete,
            'worker_marked_complete_at': dispute.workerMarkedBackjobCompleteAt.isoformat() if dispute.workerMarkedBackjobCompleteAt else None,
            'client_confirmed': dispute.clientConfirmedBackjob,
            'client_confirmed_at': dispute.clientConfirmedBackjobAt.isoformat() if dispute.clientConfirmedBackjobAt else None,
        }
        
        return {
            'success': True,
            'dispute': {
                'id': dispute.disputeID,
                'disputed_by': dispute.disputedBy,
                'reason': dispute.reason,
                'description': dispute.description,
                'status': dispute.status,
                'priority': dispute.priority,
                'job_amount': float(dispute.jobAmount),
                'disputed_amount': float(dispute.disputedAmount),
                'resolution': dispute.resolution,
                'assigned_to': dispute.assignedTo,
                'opened_date': dispute.openedDate.isoformat(),
                'resolved_date': dispute.resolvedDate.isoformat() if dispute.resolvedDate else None,
                'job': {
                    'id': job.jobID,
                    'title': job.title,
                    'description': job.description,
                    'status': job.status,
                    'budget': float(job.budget)
                },
                'client': {
                    'name': f"{job.clientID.profileID.firstName or ''} {job.clientID.profileID.lastName or ''}".strip() or client.email,
                    'email': client.email,
                    'phone': job.clientID.profileID.contactNum or 'N/A'
                },
                'worker': {
                    'name': f"{job.assignedWorkerID.profileID.firstName or ''} {job.assignedWorkerID.profileID.lastName or ''}".strip() if job.assignedWorkerID else 'Not assigned',
                    'email': worker.email if worker else 'N/A',
                    'phone': job.assignedWorkerID.profileID.contactNum if job.assignedWorkerID else 'N/A'
                } if worker else None,
                'agency': {
                    'id': agency.agencyId,
                    'name': agency.agencyName,
                    'email': agency.ownerFK.email if agency.ownerFK else 'N/A'
                } if agency else None,
                'evidence_images': evidence_images,
                'transactions': [
                    {
                        'id': str(t['transactionID']),
                        'type': t['transactionType'],
                        'amount': float(t['amount']),
                        'status': t['status'],
                        'payment_method': t['paymentMethod'],
                        'created_at': t['createdAt'].isoformat()
                    }
                    for t in transactions
                ],
                'activity_logs': activity_logs,
                'backjob_workflow': backjob_workflow
            }
        }
        
    except JobDispute.DoesNotExist:
        return {
            'success': False,
            'error': 'Dispute not found'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def resolve_dispute(
    dispute_id: int,
    resolution: str,
    decision: str,
    refund_amount: Optional[float] = None,
    admin=None,
    request=None
) -> Dict[str, Any]:
    """
    Resolve a job dispute
    
    Args:
        dispute_id: Dispute ID
        resolution: Resolution details/notes
        decision: Resolution decision (FAVOR_CLIENT/FAVOR_WORKER/PARTIAL)
        refund_amount: Optional refund amount (if applicable)
        admin: Admin user performing the action
        request: HTTP request object for audit logging
        
    Returns:
        Success/error response
    """
    try:
        dispute = JobDispute.objects.select_related('jobID').get(
            disputeID=dispute_id
        )
        
        # Store before state for audit
        before_state = {"status": dispute.status, "resolution": dispute.resolution}
        
        # Update dispute status
        dispute.status = 'RESOLVED'
        dispute.resolution = f"{decision}: {resolution}"
        dispute.resolvedDate = timezone.now()
        dispute.save()
        
        # Process refund if applicable
        refund_txn_id = None
        if refund_amount and refund_amount > 0:
            # Get escrow transaction for this job
            escrow_txn = Transaction.objects.filter(
                relatedJobPosting=dispute.jobID,
                transactionType='PAYMENT'
            ).first()
            
            if escrow_txn:
                refund_result = process_refund(
                    transaction_id=escrow_txn.transactionID,
                    amount=refund_amount,
                    reason=f"Dispute #{dispute_id} resolved: {decision}",
                    refund_to='WALLET',
                    admin=admin,
                    request=request
                )
                
                if refund_result['success']:
                    refund_txn_id = refund_result.get('refund_transaction_id')
        
        # Log audit trail
        if admin:
            log_action(
                admin=admin,
                action="dispute_resolve",
                entity_type="payment",
                entity_id=str(dispute_id),
                details={"decision": decision, "resolution": resolution, "refund_amount": refund_amount or 0},
                before_value=before_state,
                after_value={"status": "RESOLVED", "decision": decision},
                request=request
            )
        
        return {
            'success': True,
            'message': 'Dispute resolved successfully',
            'dispute_id': dispute.disputeID,
            'refund_transaction_id': refund_txn_id
        }
        
    except JobDispute.DoesNotExist:
        return {
            'success': False,
            'error': 'Dispute not found'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_disputes_statistics() -> Dict[str, Any]:
    """
    Get dispute statistics
    
    Returns:
        Dictionary with dispute metrics
    """
    try:
        # Total disputes
        total_disputes = JobDispute.objects.count()
        
        # By status
        status_counts = JobDispute.objects.values('status').annotate(
            count=Count('disputeID')
        )
        
        # By priority
        priority_counts = JobDispute.objects.values('priority').annotate(
            count=Count('disputeID')
        )
        
        # Total disputed amount
        total_disputed = JobDispute.objects.aggregate(
            total=Coalesce(Sum('disputedAmount'), Value(Decimal('0.00')))
        )['total']
        
        # Average resolution time
        resolved_disputes = JobDispute.objects.filter(
            status='RESOLVED',
            resolvedDate__isnull=False
        )
        
        avg_resolution_days = 0
        if resolved_disputes.exists():
            resolution_times = [
                (d.resolvedDate - d.openedDate).days 
                for d in resolved_disputes if d.resolvedDate is not None
            ]
            avg_resolution_days = sum(resolution_times) / len(resolution_times)
        
        # Open disputes older than 7 days
        week_ago = timezone.now() - timedelta(days=7)
        old_open = JobDispute.objects.filter(
            status__in=['OPEN', 'UNDER_REVIEW'],
            openedDate__lt=week_ago
        ).count()
        
        return {
            'success': True,
            'total_disputes': total_disputes,
            'by_status': {s['status']: s['count'] for s in status_counts},
            'by_priority': {p['priority']: p['count'] for p in priority_counts},
            'total_disputed_amount': float(total_disputed),
            'average_resolution_days': round(avg_resolution_days, 1),
            'old_open_disputes': old_open
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


# ===============================
# Analytics
# ===============================

def get_revenue_trends(period: str = 'last_30_days') -> Dict[str, Any]:
    """
    Get revenue trends over time
    
    Args:
        period: Time period (last_7_days/last_30_days/last_90_days/this_year)
        
    Returns:
        Dictionary with daily/weekly revenue data
    """
    try:
        # Calculate date range
        now = timezone.now()
        if period == 'last_7_days':
            start_date = now - timedelta(days=7)
            trunc_func = TruncDate
        elif period == 'last_30_days':
            start_date = now - timedelta(days=30)
            trunc_func = TruncDate
        elif period == 'last_90_days':
            start_date = now - timedelta(days=90)
            trunc_func = TruncWeek
        elif period == 'this_year':
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            trunc_func = TruncMonth
        else:
            start_date = now - timedelta(days=30)
            trunc_func = TruncDate
        
        # Get completed transactions grouped by date
        trends = Transaction.objects.filter(
            status='COMPLETED',
            completedAt__gte=start_date
        ).annotate(
            period=trunc_func('completedAt')
        ).values('period').annotate(
            total_amount=Coalesce(Sum('amount'), Value(Decimal('0.00'))),
            transaction_count=Count('transactionID')
        ).order_by('period')
        
        return {
            'success': True,
            'period': period,
            'trends': [
                {
                    'date': t['period'].isoformat(),
                    'amount': float(t['total_amount']),
                    'count': t['transaction_count']
                }
                for t in trends
            ]
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'trends': []
        }


def get_payment_methods_breakdown(period: str = 'last_30_days') -> Dict[str, Any]:
    """
    Get payment methods breakdown by percentage
    
    Args:
        period: Time period for filtering
        
    Returns:
        Dictionary with payment method statistics
    """
    try:
        # Calculate date range
        now = timezone.now()
        if period == 'last_7_days':
            start_date = now - timedelta(days=7)
        elif period == 'last_30_days':
            start_date = now - timedelta(days=30)
        elif period == 'last_90_days':
            start_date = now - timedelta(days=90)
        elif period == 'this_year':
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            start_date = now - timedelta(days=30)
        
        # Get payment method breakdown
        breakdown = Transaction.objects.filter(
            status='COMPLETED',
            completedAt__gte=start_date
        ).values('paymentMethod').annotate(
            count=Count('transactionID'),
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        ).order_by('-total')
        
        # Calculate total for percentages
        total_amount = sum(b['total'] for b in breakdown)
        total_count = sum(b['count'] for b in breakdown)
        
        return {
            'success': True,
            'period': period,
            'breakdown': [
                {
                    'method': b['paymentMethod'],
                    'count': b['count'],
                    'amount': float(b['total']),
                    'percentage': round((b['total'] / total_amount * 100) if total_amount > 0 else 0, 2)
                }
                for b in breakdown
            ],
            'total_amount': float(total_amount),
            'total_count': total_count
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'breakdown': []
        }


def get_top_performers(period: str = 'last_30_days') -> Dict[str, Any]:
    """
    Get top performing clients, workers, and categories
    
    Args:
        period: Time period for filtering
        
    Returns:
        Dictionary with top performers data
    """
    try:
        # Calculate date range
        now = timezone.now()
        if period == 'last_7_days':
            start_date = now - timedelta(days=7)
        elif period == 'last_30_days':
            start_date = now - timedelta(days=30)
        elif period == 'last_90_days':
            start_date = now - timedelta(days=90)
        elif period == 'this_year':
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            start_date = now - timedelta(days=30)
        
        # Top clients by total spent
        top_clients = Job.objects.filter(
            status='COMPLETED',
            completedAt__gte=start_date
        ).values(
            'clientID__profileID__accountFK__id',
            'clientID__profileID__accountFK__firstName',
            'clientID__profileID__accountFK__lastName',
            'clientID__profileID__accountFK__email'
        ).annotate(
            total_spent=Coalesce(Sum('budget'), Value(Decimal('0.00'))),
            jobs_posted=Count('jobID')
        ).order_by('-total_spent')[:10]
        
        # Top workers by total earned
        top_workers = Job.objects.filter(
            status='COMPLETED',
            completedAt__gte=start_date,
            assignedWorkerID__isnull=False
        ).values(
            'assignedWorkerID__workerID',
            'assignedWorkerID__profileID__accountFK__firstName',
            'assignedWorkerID__profileID__accountFK__lastName',
            'assignedWorkerID__profileID__accountFK__email'
        ).annotate(
            total_earned=Coalesce(Sum('budget'), Value(Decimal('0.00'))),
            jobs_completed=Count('jobID')
        ).order_by('-total_earned')[:10]
        
        # Top categories by revenue
        top_categories = Job.objects.filter(
            status='COMPLETED',
            completedAt__gte=start_date,
            categoryID__isnull=False
        ).values(
            'categoryID__specID',
            'categoryID__category'
        ).annotate(
            total_revenue=Coalesce(Sum('budget'), Value(Decimal('0.00'))),
            jobs_count=Count('jobID')
        ).order_by('-total_revenue')[:10]
        
        return {
            'success': True,
            'period': period,
            'top_clients': [
                {
                    'id': c['clientID__profileID__accountFK__id'],
                    'name': f"{c['clientID__profileID__accountFK__firstName'] or ''} {c['clientID__profileID__accountFK__lastName'] or ''}".strip() or c['clientID__profileID__accountFK__email'],
                    'email': c['clientID__profileID__accountFK__email'],
                    'total_spent': float(c['total_spent']),
                    'jobs_posted': c['jobs_posted']
                }
                for c in top_clients
            ],
            'top_workers': [
                {
                    'id': w['assignedWorkerID__workerID'],
                    'name': f"{w['assignedWorkerID__profileID__accountFK__firstName'] or ''} {w['assignedWorkerID__profileID__accountFK__lastName'] or ''}".strip() or w['assignedWorkerID__profileID__accountFK__email'],
                    'email': w['assignedWorkerID__profileID__accountFK__email'],
                    'total_earned': float(w['total_earned']),
                    'jobs_completed': w['jobs_completed']
                }
                for w in top_workers
            ],
            'top_categories': [
                {
                    'id': cat['categoryID__specID'],
                    'name': cat['categoryID__category'],
                    'total_revenue': float(cat['total_revenue']),
                    'jobs_count': cat['jobs_count']
                }
                for cat in top_categories
            ]
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'top_clients': [],
            'top_workers': [],
            'top_categories': []
        }


# ===============================
# Withdrawal Management (Admin)
# ===============================

def get_withdrawals_list(
    page: int = 1,
    limit: int = 50,
    status: Optional[str] = None,
    payment_method: Optional[str] = None,
    search: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get paginated list of all withdrawal transactions with filtering for admin panel.
    
    Args:
        page: Page number (1-indexed)
        limit: Number of records per page
        status: Filter by transaction status (PENDING/COMPLETED/FAILED)
        payment_method: Filter by payment method (GCASH/BANK/PAYPAL)
        search: Search term for user name, email, description
        
    Returns:
        Dictionary with withdrawals list and metadata
    """
    try:
        # Base queryset - only WITHDRAWAL transactions
        queryset = Transaction.objects.select_related(
            'walletID__accountFK',
        ).filter(
            transactionType='WITHDRAWAL'
        )
        
        # Apply filters
        if status:
            queryset = queryset.filter(status=status)
            
        if payment_method:
            if payment_method == 'GCASH':
                queryset = queryset.filter(paymentMethod='GCASH')
            elif payment_method == 'BANK':
                queryset = queryset.filter(paymentMethod='BANK_TRANSFER')
            # PayPal filter via description
            elif payment_method == 'PAYPAL':
                queryset = queryset.filter(description__icontains='PAYPAL')
            
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(referenceNumber__icontains=search) |
                Q(walletID__accountFK__email__icontains=search) |
                Q(walletID__accountFK__firstName__icontains=search) |
                Q(walletID__accountFK__lastName__icontains=search)
            )
        
        # Get total count
        total = queryset.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        transactions = queryset.order_by('-createdAt')[offset:offset + limit]
        
        # Format withdrawals
        withdrawals_list = []
        for txn in transactions:
            # Get user info
            account = txn.walletID.accountFK if txn.walletID else None
            user_email = account.email if account else 'N/A'
            # Get profile for name (Profile has firstName/lastName, not Accounts)
            profile = None
            if account:
                from accounts.models import Profile
                profile = Profile.objects.filter(accountFK=account).first()
            user_name = f"{profile.firstName or ''} {profile.lastName or ''}".strip() if profile else user_email
            user_id = account.accountID if account else 0
            
            # Parse payment method type from description
            payment_method_type = "GCASH"
            if txn.paymentMethod == 'BANK_TRANSFER':
                payment_method_type = "BANK"
            elif txn.description and 'PAYPAL' in txn.description.upper():
                payment_method_type = "PAYPAL"
            elif txn.paymentMethod == 'GCASH':
                payment_method_type = "GCASH"
            
            # Try to get recipient details from payment method or description
            recipient_name = user_name
            account_number = ""
            bank_name = None
            
            # Try to get payment method from user's saved methods
            if account:
                payment_method_obj = UserPaymentMethod.objects.filter(
                    accountFK=account,
                    methodType=payment_method_type
                ).first()
                if payment_method_obj:
                    recipient_name = payment_method_obj.accountName
                    account_number = payment_method_obj.accountNumber
                    bank_name = payment_method_obj.bankName
            
            # Parse from description as fallback
            if not account_number and txn.description:
                # Description format: "Withdrawal to GCASH - 09171234567"
                parts = txn.description.split(' - ')
                if len(parts) > 1:
                    account_number = parts[-1]
            
            withdrawals_list.append({
                'transaction_id': txn.transactionID,
                'user_id': user_id,
                'user_name': user_name,
                'user_email': user_email,
                'amount': float(txn.amount),
                'payment_method_type': payment_method_type,
                'recipient_name': recipient_name,
                'account_number': account_number,
                'bank_name': bank_name,
                'status': txn.status,
                'created_at': txn.createdAt.isoformat() if txn.createdAt else None,
                'completed_at': txn.completedAt.isoformat() if txn.completedAt else None,
                'disbursement_id': txn.referenceNumber or f"WD-{txn.transactionID}",
                'notes': txn.description,
            })
        
        return {
            'success': True,
            'withdrawals': withdrawals_list,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'withdrawals': [],
            'total': 0,
            'page': page,
            'limit': limit,
            'total_pages': 0
        }


def get_withdrawals_statistics() -> Dict[str, Any]:
    """
    Get withdrawal statistics for admin dashboard.
    
    Returns:
        Dictionary with pending count/amount, completed today count/amount
    """
    try:
        today = timezone.now().date()
        
        # Pending withdrawals
        pending_stats = Transaction.objects.filter(
            transactionType='WITHDRAWAL',
            status='PENDING'
        ).aggregate(
            count=Count('transactionID'),
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        )
        
        # Completed today
        completed_today_stats = Transaction.objects.filter(
            transactionType='WITHDRAWAL',
            status='COMPLETED',
            completedAt__date=today
        ).aggregate(
            count=Count('transactionID'),
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        )
        
        # Total completed this month
        month_start = today.replace(day=1)
        completed_month_stats = Transaction.objects.filter(
            transactionType='WITHDRAWAL',
            status='COMPLETED',
            completedAt__date__gte=month_start
        ).aggregate(
            count=Count('transactionID'),
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        )
        
        # Failed this month
        failed_month_stats = Transaction.objects.filter(
            transactionType='WITHDRAWAL',
            status='FAILED',
            createdAt__date__gte=month_start
        ).aggregate(
            count=Count('transactionID'),
            total=Coalesce(Sum('amount'), Value(Decimal('0.00')))
        )
        
        return {
            'success': True,
            'pending_withdrawals': pending_stats['count'] or 0,
            'pending_amount': float(pending_stats['total'] or 0),
            'completed_today': completed_today_stats['count'] or 0,
            'completed_amount_today': float(completed_today_stats['total'] or 0),
            'completed_this_month': completed_month_stats['count'] or 0,
            'completed_amount_month': float(completed_month_stats['total'] or 0),
            'failed_this_month': failed_month_stats['count'] or 0,
            'failed_amount_month': float(failed_month_stats['total'] or 0),
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'pending_withdrawals': 0,
            'pending_amount': 0,
            'completed_today': 0,
            'completed_amount_today': 0,
            'completed_this_month': 0,
            'completed_amount_month': 0,
            'failed_this_month': 0,
            'failed_amount_month': 0,
        }


def process_withdrawal_approval(
    transaction_id: int,
    action: str,  # 'approve' or 'reject'
    admin_notes: Optional[str] = None,
    admin = None,
    request = None,
    reference_number: Optional[str] = None
) -> Dict[str, Any]:
    """
    Process withdrawal approval or rejection by admin.
    
    For approved withdrawals:
    - Mark transaction as COMPLETED
    - Update completedAt timestamp
    - Store admin reference number for audit trail
    - Admin manually processes payment via PayMongo/Bank portal
    
    For rejected withdrawals:
    - Mark transaction as FAILED
    - Refund amount back to user's wallet
    
    Args:
        transaction_id: Transaction ID to process
        action: 'approve' or 'reject'
        admin_notes: Optional notes from admin
        admin: Admin account performing the action
        request: HTTP request for audit logging
        reference_number: Bank/payment reference number from admin (for audit)
    """
    try:
        # Get the transaction
        transaction = Transaction.objects.select_related(
            'walletID__accountFK'
        ).filter(
            transactionID=transaction_id,
            transactionType='WITHDRAWAL'
        ).first()
        
        if not transaction:
            return {'success': False, 'error': 'Withdrawal transaction not found'}
        
        if transaction.status != 'PENDING':
            return {'success': False, 'error': f'Transaction is already {transaction.status}, cannot process'}
        
        wallet = transaction.walletID
        user_account = wallet.accountFK if wallet else None
        user_email = user_account.email if user_account else 'unknown@email.com'
        
        # Get profile for name (Profile has firstName/lastName, not Accounts)
        profile = None
        if user_account:
            profile = Profile.objects.filter(accountFK=user_account).first()
        user_name = f"{profile.firstName or ''} {profile.lastName or ''}".strip() if profile else user_email
        
        if action == 'approve':
            # Mark as completed - admin will manually process the actual payment
            transaction.status = 'COMPLETED'
            transaction.completedAt = timezone.now()
            transaction.processedAt = timezone.now()
            
            # Store admin reference number for audit trail
            if reference_number:
                transaction.adminReferenceNumber = reference_number
            
            # Store which admin processed this
            if admin:
                transaction.processedByAdmin = admin
            
            if admin_notes:
                transaction.description = f"{transaction.description} | Admin: {admin_notes}"
            transaction.save()
            
            # Send notification to user about approved withdrawal
            if user_account:
                Notification.objects.create(
                    accountFK=user_account,
                    notificationType='PAYMENT_RELEASED',
                    title='Withdrawal Approved! 💸',
                    message=f'Your withdrawal of ₱{transaction.amount:,.2f} has been approved and processed. Reference: {reference_number or f"WD-{transaction_id}"}. Funds have been sent to your {transaction.paymentMethod} account.'
                )
            
            # Send email receipt to user
            _send_withdrawal_receipt_email(
                user_email=user_email,
                user_name=user_name,
                amount=float(transaction.amount),
                payment_method=transaction.paymentMethod,
                reference_number=reference_number or f"WD-{transaction_id}",
                transaction_id=transaction_id,
                completed_at=transaction.completedAt
            )
            
            # Log action
            if admin and request:
                log_action(
                    admin=admin,
                    action='APPROVE_WITHDRAWAL',
                    target_type='Transaction',
                    target_id=transaction_id,
                    details={
                        'amount': float(transaction.amount),
                        'user': user_name,
                        'payment_method': transaction.paymentMethod,
                        'notes': admin_notes,
                        'reference_number': reference_number
                    },
                    request=request
                )
            
            return {
                'success': True,
                'message': f'Withdrawal of ₱{transaction.amount:,.2f} approved for {user_name}',
                'transaction_id': transaction_id,
                'new_status': 'COMPLETED',
                'reference_number': reference_number
            }
            
        elif action == 'reject':
            # Mark as failed and refund to wallet
            transaction.status = 'FAILED'
            if admin_notes:
                transaction.description = f"{transaction.description} | Rejected: {admin_notes}"
            transaction.save()
            
            # Send notification to user about rejected withdrawal
            if user_account:
                Notification.objects.create(
                    accountFK=user_account,
                    notificationType='SYSTEM',
                    title='Withdrawal Rejected',
                    message=f'Your withdrawal request of ₱{transaction.amount:,.2f} was not approved. Reason: {admin_notes or "No reason provided"}. The amount has been refunded to your wallet.'
                )
            
            # Refund amount back to wallet
            if wallet:
                wallet.balance += transaction.amount
                wallet.save()
                
                # Create refund transaction record
                Transaction.objects.create(
                    walletID=wallet,
                    transactionType='REFUND',
                    amount=transaction.amount,
                    balanceAfter=wallet.balance,
                    status='COMPLETED',
                    description=f"Withdrawal rejection refund - Original txn #{transaction_id}",
                    referenceNumber=f"REFUND-WD-{transaction_id}",
                    completedAt=timezone.now()
                )
            
            # Log action
            if admin and request:
                log_action(
                    admin=admin,
                    action='REJECT_WITHDRAWAL',
                    target_type='Transaction',
                    target_id=transaction_id,
                    details={
                        'amount': float(transaction.amount),
                        'user': user_name,
                        'reason': admin_notes,
                        'refunded': True
                    },
                    request=request
                )
            
            return {
                'success': True,
                'message': f'Withdrawal of ₱{transaction.amount:,.2f} rejected. Amount refunded to {user_name}\'s wallet.',
                'transaction_id': transaction_id,
                'new_status': 'FAILED',
                'refunded': True
            }
        
        else:
            return {'success': False, 'error': f'Invalid action: {action}. Use "approve" or "reject"'}
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': str(e)}


def _send_withdrawal_receipt_email(
    user_email: str,
    user_name: str,
    amount: float,
    payment_method: str,
    reference_number: str,
    transaction_id: int,
    completed_at: datetime
) -> bool:
    """
    Send withdrawal receipt/confirmation email to user after admin approval.
    
    Args:
        user_email: User's email address
        user_name: User's full name
        amount: Withdrawal amount in PHP
        payment_method: Payment method used (GCASH, BANK, MAYA, etc.)
        reference_number: Admin-provided reference number
        transaction_id: Transaction ID
        completed_at: Completion timestamp
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    import requests
    
    # Payment method display names
    method_names = {
        'GCASH': 'GCash',
        'BANK': 'Bank Transfer',
        'BANK_TRANSFER': 'Bank Transfer',
        'PAYPAL': 'PayPal',
        'VISA': 'Visa/Credit Card',
        'GRABPAY': 'GrabPay',
        'MAYA': 'Maya',
        'PAYMAYA': 'Maya'
    }
    method_display = method_names.get(payment_method, payment_method)
    
    # Format date
    date_str = completed_at.strftime('%B %d, %Y at %I:%M %p') if completed_at else 'N/A'
    
    try:
        resend_api_key = getattr(settings, 'RESEND_API_KEY', None)
        if not resend_api_key:
            print("⚠️ RESEND_API_KEY not configured, skipping withdrawal receipt email")
            return False
        
        email_html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Withdrawal Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">💸 Withdrawal Successful!</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <p style="color: #333; font-size: 16px;">Hi {user_name},</p>
                
                <p style="color: #666; font-size: 14px;">
                    Great news! Your withdrawal request has been approved and processed. Here are the details:
                </p>
                
                <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; color: #666; font-size: 14px;">Amount:</td>
                            <td style="padding: 10px 0; color: #10B981; font-size: 20px; font-weight: bold; text-align: right;">₱{amount:,.2f}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666; font-size: 14px; border-top: 1px solid #e5e7eb;">Payment Method:</td>
                            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right; border-top: 1px solid #e5e7eb;">{method_display}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666; font-size: 14px; border-top: 1px solid #e5e7eb;">Reference Number:</td>
                            <td style="padding: 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: right; border-top: 1px solid #e5e7eb;">{reference_number}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666; font-size: 14px; border-top: 1px solid #e5e7eb;">Transaction ID:</td>
                            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right; border-top: 1px solid #e5e7eb;">#{transaction_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666; font-size: 14px; border-top: 1px solid #e5e7eb;">Processed On:</td>
                            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right; border-top: 1px solid #e5e7eb;">{date_str}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #ecfdf5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #065f46; font-size: 14px;">
                        <strong>✅ Funds Sent</strong><br>
                        The funds have been sent to your {method_display} account. Please allow 1-3 business days for the transfer to reflect, depending on your payment provider.
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    Keep this email as your receipt. If you have any questions about this transaction, please contact our support team.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                    This is an automated email from iAyos. Please do not reply directly to this email.
                </p>
            </div>
        </body>
        </html>
        '''
        
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {resend_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "from": "iAyos <noreply@iayos.com>",
                "to": [user_email],
                "subject": f"✅ Withdrawal of ₱{amount:,.2f} Approved - Reference: {reference_number}",
                "html": email_html
            },
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ Withdrawal receipt email sent to {user_email}")
            return True
        else:
            print(f"⚠️ Failed to send withdrawal email: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error sending withdrawal receipt email: {str(e)}")
        return False