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
from typing import Optional
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Sum

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
    Active means: OPEN, IN_NEGOTIATION, or UNDER_REVIEW status.
    """
    return JobDispute.objects.filter(
        jobID=job,
        status__in=['OPEN', 'IN_NEGOTIATION', 'UNDER_REVIEW']
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
    recipient_type: str = "worker",
    idempotency_key: Optional[str] = None,
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

    # Idempotency guard for retried requests.
    # When a deterministic key is provided, return the existing ledger row instead of duplicating funds.
    reference_number = None
    if idempotency_key:
        reference_number = f"JOB-{job.jobID}-PENDING-{idempotency_key}"
        existing_txn = Transaction.objects.filter(
            walletID=recipient_wallet,
            relatedJobPosting=job,
            transactionType="PENDING_EARNING",
            referenceNumber=reference_number,
        ).order_by('-transactionID').first()

        if existing_txn:
            release_date = job.paymentReleaseDate or (timezone.now() + timedelta(days=buffer_days))
            release_date_str = release_date.strftime('%B %d, %Y at %I:%M %p')
            return {
                'success': True,
                'pending_earning_id': existing_txn.transactionID,
                'release_date': release_date,
                'release_date_str': release_date_str,
                'amount': existing_txn.amount,
                'buffer_days': buffer_days,
                'idempotent_replay': True,
            }
    
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
                    (f" (Agency: {getattr(job.assignedAgencyFK, 'businessName', 'Agency')})" if recipient_type == "agency" else ""),
        referenceNumber=reference_number or f"JOB-{job.jobID}-PENDING-{timezone.now().strftime('%Y%m%d%H%M%S')}",
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


def has_receivable_ledger_for_account(job: Job, account) -> bool:
    """Return True if the account has either pending or released earnings rows for this job."""
    if not account:
        return False

    wallet = Wallet.objects.filter(accountFK=account).first()
    if not wallet:
        return False

    return Transaction.objects.filter(
        walletID=wallet,
        relatedJobPosting=job,
        transactionType__in=["PENDING_EARNING", "EARNING"],
        status__in=["PENDING", "COMPLETED"],
    ).exists()


def estimate_job_receivable_amount(job: Job) -> Decimal:
    """Estimate receivable amount for a completed job using safest available signals."""
    from accounts.models import DailyAttendance, JobEmployeeAssignment

    approved_assignments_total = JobEmployeeAssignment.objects.filter(
        job=job,
        clientApproved=True,
    ).aggregate(total=Sum("paymentAmount")).get("total")

    if approved_assignments_total and approved_assignments_total > Decimal("0.00"):
        return Decimal(str(approved_assignments_total))

    daily_paid_total = DailyAttendance.objects.filter(
        jobID=job,
        payment_processed=True,
    ).aggregate(total=Sum("amount_earned")).get("total")

    if daily_paid_total and daily_paid_total > Decimal("0.00"):
        return Decimal(str(daily_paid_total))

    remaining = Decimal(str(getattr(job, "remainingPayment", Decimal("0.00")) or Decimal("0.00")))
    materials = Decimal(str(getattr(job, "materialsCost", Decimal("0.00")) or Decimal("0.00")))
    fallback = remaining + materials
    if fallback > Decimal("0.00"):
        return fallback

    # Only use full-budget fallback when final payment was marked as settled.
    if getattr(job, "remainingPaymentPaid", False):
        budget = Decimal(str(getattr(job, "budget", Decimal("0.00")) or Decimal("0.00")))
        if budget > Decimal("0.00"):
            return budget

    return Decimal("0.00")


@transaction.atomic
def reconcile_missing_agency_receivables_for_account(account, limit: int = 200, dry_run: bool = False) -> dict:
    """
    Backfill missing agency receivable ledger entries for legacy completed jobs.

    This is safe to call repeatedly: idempotency checks prevent duplicate pending rows,
    and existing receivable ledgers are always skipped.
    """
    if not account:
        return {
            "success": False,
            "error": "account is required",
            "scanned": 0,
            "repaired": 0,
            "skipped": 0,
            "errors": 0,
            "reasons": {},
        }

    now = timezone.now()
    limit = max(1, int(limit or 200))
    mature_cutoff = now - timedelta(days=get_payment_buffer_days())

    jobs_qs = (
        Job.objects.select_related("assignedAgencyFK__accountFK")
        .filter(
            assignedAgencyFK__accountFK=account,
            status="COMPLETED",
        )
        .order_by("-updatedAt")[:limit]
    )

    scanned = 0
    repaired = 0
    skipped = 0
    errors = 0
    reasons = {
        "already_has_receivable": 0,
        "non_positive_expected_amount": 0,
        "repaired_pending": 0,
        "repaired_released_ledger_only": 0,
        "repaired_released_now": 0,
        "error": 0,
    }

    for job in jobs_qs:
        scanned += 1

        if has_receivable_ledger_for_account(job, account):
            skipped += 1
            reasons["already_has_receivable"] += 1
            continue

        expected_amount = estimate_job_receivable_amount(job)
        if expected_amount <= Decimal("0.00"):
            skipped += 1
            reasons["non_positive_expected_amount"] += 1
            continue

        if dry_run:
            continue

        try:
            if job.paymentReleasedToWorker:
                wallet, _ = Wallet.objects.get_or_create(accountFK=account)
                reference_number = f"BACKFILL-JOB-{job.jobID}-RELEASED-COMPAT"
                Transaction.objects.get_or_create(
                    walletID=wallet,
                    relatedJobPosting=job,
                    referenceNumber=reference_number,
                    defaults={
                        "transactionType": "EARNING",
                        "amount": expected_amount,
                        "balanceAfter": wallet.balance,
                        "status": "COMPLETED",
                        "description": f"[Backfill] Released earning ledger for completed agency job: {job.title}",
                        "completedAt": now,
                    },
                )
                reasons["repaired_released_ledger_only"] += 1
                repaired += 1
                continue

            settlement = add_pending_earnings(
                job=job,
                recipient_account=account,
                amount=expected_amount,
                recipient_type="agency",
                idempotency_key=f"backfill-agency-{job.jobID}",
            )
            if not settlement.get("success"):
                raise RuntimeError("pending settlement helper returned unsuccessful result")

            reasons["repaired_pending"] += 1

            is_matured = bool(
                (job.paymentReleaseDate and job.paymentReleaseDate <= now)
                or ((job.completedAt or job.updatedAt or job.createdAt) and (job.completedAt or job.updatedAt or job.createdAt) <= mature_cutoff)
            )
            if is_matured:
                release_result = release_pending_payment(job, force=True)
                if release_result.get("success"):
                    reasons["repaired_released_now"] += 1
                else:
                    error_text = str(release_result.get("error") or "")
                    if "already released" not in error_text.lower():
                        raise RuntimeError(f"failed auto-release after backfill: {error_text or 'unknown error'}")

            repaired += 1
        except Exception:
            errors += 1
            reasons["error"] += 1

    return {
        "success": errors == 0,
        "scanned": scanned,
        "repaired": repaired,
        "skipped": skipped,
        "errors": errors,
        "reasons": reasons,
        "dry_run": dry_run,
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
    
    # Multi-recipient path first: release all pending earning transactions for this job.
    pending_txns = list(
        Transaction.objects.select_related('walletID__accountFK').filter(
            relatedJobPosting=job,
            transactionType="PENDING_EARNING",
            status="PENDING"
        ).order_by('transactionID')
    )

    if pending_txns:
        total_released = Decimal('0.00')
        released_recipients = 0

        for pending_txn in pending_txns:
            recipient_wallet = Wallet.objects.select_for_update().get(pk=pending_txn.walletID.pk)
            amount = pending_txn.amount
            recipient_account = recipient_wallet.accountFK

            if recipient_wallet.pendingEarnings >= amount:
                recipient_wallet.pendingEarnings -= amount
            else:
                recipient_wallet.pendingEarnings = Decimal('0.00')

            recipient_wallet.balance += amount
            recipient_wallet.save(update_fields=['balance', 'pendingEarnings', 'updatedAt'])

            pending_txn.status = "COMPLETED"
            pending_txn.balanceAfter = recipient_wallet.balance
            pending_txn.description = (pending_txn.description or "").replace("Pending payment", "Payment released")
            pending_txn.completedAt = timezone.now()
            pending_txn.save(update_fields=['status', 'balanceAfter', 'description', 'completedAt'])

            Transaction.objects.create(
                walletID=recipient_wallet,
                transactionType="EARNING",
                amount=amount,
                balanceAfter=recipient_wallet.balance,
                status="COMPLETED",
                description=f"Payment released for job: {job.title}",
                referenceNumber=f"JOB-{job.jobID}-RELEASE-{timezone.now().strftime('%Y%m%d%H%M%S')}-{pending_txn.transactionID}",
                relatedJobPosting=job,
                completedAt=timezone.now()
            )

            Notification.objects.create(
                accountFK=recipient_account,
                notificationType="PAYMENT_RELEASED",
                title="Payment Released! 🎉",
                message=f"You received ₱{amount} for '{job.title}'. The funds have been added to your wallet!",
                relatedJobID=job.jobID
            )

            total_released += amount
            released_recipients += 1

        job.paymentReleasedToWorker = True
        job.paymentReleasedAt = timezone.now()
        job.paymentHeldReason = 'RELEASED'
        job.save(update_fields=['paymentReleasedToWorker', 'paymentReleasedAt', 'paymentHeldReason', 'updatedAt'])

        print(f"💸 Released ₱{total_released} to {released_recipients} recipient(s) for Job #{job.jobID}")

        return {
            'success': True,
            'amount': total_released,
            'recipients_released': released_recipients,
            'recipient_type': 'multiple' if released_recipients > 1 else 'single'
        }

    # Backward-compatible single-recipient fallback for legacy jobs
    recipient_account = None
    recipient_type = None

    if job.assignedWorkerID and job.assignedWorkerID.profileID:
        recipient_account = job.assignedWorkerID.profileID.accountFK
        recipient_type = "worker"
    elif job.assignedAgencyFK:
        recipient_account = job.assignedAgencyFK.accountFK
        recipient_type = "agency"

    if not recipient_account:
        # Backward-compat for legacy/archived jobs:
        # some historical jobs may not have assignedWorkerID/assignedAgencyFK anymore,
        # but already contain completed earning ledger entries tied to this job.
        legacy_earning_txns = Transaction.objects.filter(
            relatedJobPosting=job,
            transactionType="EARNING",
            status="COMPLETED"
        )

        if legacy_earning_txns.exists():
            if not job.paymentReleasedToWorker:
                job.paymentReleasedToWorker = True
                if not job.paymentReleasedAt:
                    job.paymentReleasedAt = timezone.now()
                job.paymentHeldReason = 'RELEASED'
                job.save(update_fields=['paymentReleasedToWorker', 'paymentReleasedAt', 'paymentHeldReason', 'updatedAt'])

            return {
                'success': True,
                'amount': Decimal('0.00'),
                'recipient_type': 'legacy_archived',
                'message': 'Legacy archived job normalized: payment was already released in historical ledger records.'
            }

        return {'success': False, 'error': 'No recipient found for this job'}

    try:
        recipient_wallet = Wallet.objects.select_for_update().get(accountFK=recipient_account)
    except Wallet.DoesNotExist:
        return {'success': False, 'error': 'Recipient wallet not found'}

    amount = job.budget
    if recipient_wallet.pendingEarnings >= amount:
        recipient_wallet.pendingEarnings -= amount
    else:
        recipient_wallet.pendingEarnings = Decimal('0.00')

    recipient_wallet.balance += amount
    recipient_wallet.save(update_fields=['balance', 'pendingEarnings', 'updatedAt'])

    Transaction.objects.create(
        walletID=recipient_wallet,
        transactionType="EARNING",
        amount=amount,
        balanceAfter=recipient_wallet.balance,
        status="COMPLETED",
        description=f"Payment released for job: {job.title}" +
                    (f" (Agency: {getattr(job.assignedAgencyFK, 'businessName', 'Agency')})" if recipient_type == "agency" else ""),
        referenceNumber=f"JOB-{job.jobID}-RELEASE-{timezone.now().strftime('%Y%m%d%H%M%S')}",
        relatedJobPosting=job,
        completedAt=timezone.now()
    )

    job.paymentReleasedToWorker = True
    job.paymentReleasedAt = timezone.now()
    job.paymentHeldReason = 'RELEASED'
    job.save(update_fields=['paymentReleasedToWorker', 'paymentReleasedAt', 'paymentHeldReason', 'updatedAt'])

    if recipient_type == "agency":
        Notification.objects.create(
            accountFK=recipient_account,
            notificationType="PAYMENT_RELEASED",
            title="Payment Released! 🎉",
            message=f"Your agency received ₱{amount} for '{job.title}'. The funds have been added to your wallet!",
            relatedJobID=job.jobID
        )
    else:
        Notification.objects.create(
            accountFK=recipient_account,
            notificationType="PAYMENT_RELEASED",
            title="Payment Released! 🎉",
            message=f"You received ₱{amount} for '{job.title}'. The funds have been added to your wallet!",
            relatedJobID=job.jobID
        )

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
