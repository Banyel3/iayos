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
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, Dict, List, Any

from accounts.models import (
    Transaction, Job, Profile, Wallet, JobDispute, 
    ClientProfile, WorkerProfile, Accounts
)


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
        Dictionary with complete transaction details
    """
    try:
        txn = Transaction.objects.select_related(
            'walletID__accountFK',
            'relatedJobPosting__clientID__profileID__accountFK',
            'relatedJobPosting__assignedWorkerID__profileID__accountFK'
        ).get(transactionID=transaction_id)
        
        # User info
        user = txn.walletID.accountFK if txn.walletID else None
        user_info = None
        if user:
            profile = Profile.objects.filter(accountFK=user).first()
            user_info = {
                'id': user.accountID,
                'email': user.email,
                'name': f"{profile.firstName or ''} {profile.lastName or ''}".strip() if profile else user.email,
                'phone': profile.contactNum if profile else 'N/A'
            }
        
        # Job info
        job_info = None
        if txn.relatedJobPosting:
            job = txn.relatedJobPosting
            client = job.clientID.profileID.accountFK
            client_profile = job.clientID.profileID
            worker = job.assignedWorkerID.profileID.accountFK if job.assignedWorkerID else None
            worker_profile = job.assignedWorkerID.profileID if job.assignedWorkerID else None
            
            job_info = {
                'id': job.jobID,
                'title': job.title,
                'status': job.status,
                'budget': float(job.budget),
                'client': {
                    'id': client.accountID,
                    'name': f"{client_profile.firstName or ''} {client_profile.lastName or ''}".strip() or client.email,
                    'email': client.email
                },
                'worker': {
                    'id': worker.accountID,
                    'name': f"{worker_profile.firstName or ''} {worker_profile.lastName or ''}".strip() or worker.email,
                    'email': worker.email
                } if worker and worker_profile else None
            }
        
        # Escrow details (for PAYMENT type transactions)
        escrow_details = None
        if txn.transactionType == 'PAYMENT':
            days_held = (timezone.now() - txn.createdAt).days
            escrow_details = {
                'amount_held': float(txn.amount),
                'days_held': days_held,
                'can_release': txn.status == 'PENDING',
                'escrow_paid_at': txn.createdAt.isoformat()
            }
        
        # Xendit info (if available)
        xendit_info = None
        if txn.xenditInvoiceID or txn.xenditPaymentID:
            xendit_info = {
                'invoice_id': txn.xenditInvoiceID,
                'payment_id': txn.xenditPaymentID,
                'payment_channel': txn.xenditPaymentChannel
            }
        
        return {
            'success': True,
            'transaction': {
                'id': str(txn.transactionID),
                'reference_number': txn.referenceNumber or f"TXN-{txn.transactionID}",
                'type': txn.transactionType,
                'amount': float(txn.amount),
                'balance_after': float(txn.balanceAfter) if txn.balanceAfter else None,
                'status': txn.status,
                'payment_method': txn.paymentMethod,
                'description': txn.description or '',
                'created_at': txn.createdAt.isoformat(),
                'completed_at': txn.completedAt.isoformat() if txn.completedAt else None,
                'user': user_info,
                'job': job_info,
                'escrow_details': escrow_details,
                'xendit_info': xendit_info
            }
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


def release_escrow(transaction_id: int, reason: Optional[str] = None) -> Dict[str, Any]:
    """
    Release escrow payment to worker
    
    Args:
        transaction_id: Transaction ID
        reason: Optional reason for release
        
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
    refund_to: str = 'WALLET'
) -> Dict[str, Any]:
    """
    Process refund for a transaction
    
    Args:
        transaction_id: Original transaction ID
        amount: Refund amount
        reason: Reason for refund
        refund_to: Refund destination (WALLET/GCASH/BANK_TRANSFER)
        
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
        Dictionary with complete dispute details
    """
    try:
        dispute = JobDispute.objects.select_related(
            'jobID__clientID__profileID__accountFK',
            'jobID__assignedWorkerID__profileID__accountFK'
        ).get(disputeID=dispute_id)
        
        job = dispute.jobID
        client = job.clientID.profileID.accountFK
        worker = job.assignedWorkerID.profileID.accountFK if job.assignedWorkerID else None
        
        # Get related transactions
        transactions = Transaction.objects.filter(
            relatedJobPosting=job
        ).values(
            'transactionID', 'transactionType', 'amount', 
            'status', 'paymentMethod', 'createdAt'
        )
        
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
                ]
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
    refund_amount: Optional[float] = None
) -> Dict[str, Any]:
    """
    Resolve a job dispute
    
    Args:
        dispute_id: Dispute ID
        resolution: Resolution details/notes
        decision: Resolution decision (FAVOR_CLIENT/FAVOR_WORKER/PARTIAL)
        refund_amount: Optional refund amount (if applicable)
        
    Returns:
        Success/error response
    """
    try:
        dispute = JobDispute.objects.select_related('jobID').get(
            disputeID=dispute_id
        )
        
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
                    refund_to='WALLET'
                )
                
                if refund_result['success']:
                    refund_txn_id = refund_result.get('refund_transaction_id')
        
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
