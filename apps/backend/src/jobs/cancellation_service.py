from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Optional, Tuple

from django.db import transaction as db_transaction
from django.utils import timezone

from accounts.models import Job, JobLog, Notification, Transaction, Wallet


TWO_PLACES = Decimal("0.01")


def _q(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def _actor_role_for_job(job: Job, actor_account) -> Optional[str]:
    if job.clientID and job.clientID.profileID and job.clientID.profileID.accountFK == actor_account:
        return "CLIENT"

    if job.assignedWorkerID and job.assignedWorkerID.profileID and job.assignedWorkerID.profileID.accountFK == actor_account:
        return "WORKER"

    if job.assignedAgencyFK and job.assignedAgencyFK.accountFK == actor_account:
        return "AGENCY"

    return None


def _worker_recipient_account(job: Job):
    if job.assignedWorkerID and job.assignedWorkerID.profileID:
        return job.assignedWorkerID.profileID.accountFK

    if job.assignedAgencyFK:
        return job.assignedAgencyFK.accountFK

    return None


def _credit_wallet(account, amount: Decimal, tx_type: str, description: str, job: Job, reference: str) -> None:
    if amount <= 0:
        return

    wallet, _ = Wallet.objects.get_or_create(accountFK=account)
    wallet.balance = _q(wallet.balance + amount)
    wallet.save(update_fields=["balance", "updatedAt"])

    Transaction.objects.create(
        walletID=wallet,
        transactionType=tx_type,
        amount=amount,
        balanceAfter=wallet.balance,
        status=Transaction.TransactionStatus.COMPLETED,
        description=description,
        relatedJobPosting=job,
        referenceNumber=reference,
    )


def cancel_job_with_scenarios(job: Job, actor_account, reason: Optional[str] = None) -> Dict:
    """
    Centralized cancellation logic for project jobs.

    Rules:
    - Before work start: client gets full escrow back.
    - After arrival/work-start markers: worker side gets 50% of escrow pool,
      client gets the remaining 50%.
    - If escrow was only reserved (not paid), release reserved funds instead.
    """
    actor_role = _actor_role_for_job(job, actor_account)
    if actor_role is None:
        raise PermissionError("You are not authorized to cancel this job")

    if not reason or not reason.strip():
        raise ValueError("Cancellation reason is required")

    if job.status == Job.JobStatus.CANCELLED:
        raise ValueError("This job is already cancelled")

    if job.status == Job.JobStatus.COMPLETED:
        raise ValueError("Cannot cancel a completed job")

    if job.status not in [Job.JobStatus.ACTIVE, Job.JobStatus.IN_PROGRESS]:
        raise ValueError(f"Cannot cancel job with status: {job.status}")

    if not job.clientID or not job.clientID.profileID or not job.clientID.profileID.accountFK:
        raise ValueError("Job is missing a valid client account reference")

    client_account = job.clientID.profileID.accountFK
    worker_recipient = _worker_recipient_account(job)

    escrow_pool = _q(job.escrowAmount if job.escrowAmount and job.escrowAmount > 0 else (job.budget * Decimal("0.5")))
    platform_fee = _q(Decimal(str(job.budget)) * Decimal("0.10"))

    cancellation_stage = "BEFORE_WORK_START"
    client_refund = Decimal("0.00")
    worker_compensation = Decimal("0.00")
    reserved_release = Decimal("0.00")

    after_arrival_or_started = bool(
        job.clientConfirmedWorkStarted or job.workerMarkedJobStarted
    )

    if job.status == Job.JobStatus.IN_PROGRESS and after_arrival_or_started:
        cancellation_stage = "AFTER_ARRIVAL_OR_STARTED"
        worker_compensation = _q(escrow_pool * Decimal("0.50"))
        client_refund = _q(escrow_pool - worker_compensation)
    elif job.status == Job.JobStatus.IN_PROGRESS and job.workerMarkedOnTheWay:
        cancellation_stage = "ON_THE_WAY_NOT_STARTED"
        client_refund = escrow_pool
    else:
        cancellation_stage = "BEFORE_WORK_START"
        client_refund = escrow_pool

    # Safety: if there is no worker/agency recipient, revert all to client refund.
    if worker_compensation > 0 and worker_recipient is None:
        client_refund = _q(client_refund + worker_compensation)
        worker_compensation = Decimal("0.00")
        cancellation_stage = "AFTER_ARRIVAL_NO_RECIPIENT_FALLBACK"

    now = timezone.now()
    reason_text = reason.strip()
    reference_suffix = now.strftime("%Y%m%d%H%M%S")

    with db_transaction.atomic():
        if job.escrowPaid:
            _credit_wallet(
                account=client_account,
                amount=client_refund,
                tx_type=Transaction.TransactionType.REFUND,
                description=f"Client refund for cancelled job: {job.title}",
                job=job,
                reference=f"CANCEL-CLIENT-{job.jobID}-{reference_suffix}",
            )

            if worker_compensation > 0 and worker_recipient:
                _credit_wallet(
                    account=worker_recipient,
                    amount=worker_compensation,
                    tx_type=Transaction.TransactionType.EARNING,
                    description=f"Cancellation compensation for job: {job.title}",
                    job=job,
                    reference=f"CANCEL-WORKER-{job.jobID}-{reference_suffix}",
                )
        else:
            # Reserved-only flow (typically LISTING before acceptance).
            wallet, _ = Wallet.objects.get_or_create(accountFK=client_account)
            reserved_release = _q(escrow_pool + platform_fee)
            wallet.reservedBalance = _q(wallet.reservedBalance - reserved_release)
            if wallet.reservedBalance < 0:
                wallet.reservedBalance = Decimal("0.00")
            wallet.save(update_fields=["reservedBalance", "updatedAt"])

            Transaction.objects.filter(
                relatedJobPosting=job,
                status=Transaction.TransactionStatus.PENDING,
            ).update(status=Transaction.TransactionStatus.CANCELLED)

            # No escrow was collected, so worker compensation cannot be paid.
            worker_compensation = Decimal("0.00")
            client_refund = Decimal("0.00")

        old_status = job.status
        job.status = Job.JobStatus.CANCELLED
        job.cancellationReason = reason_text
        job.cancelledAt = now
        job.cancelledByAccountID = actor_account
        job.cancelledByRole = actor_role
        job.cancellationStage = cancellation_stage
        job.clientRefundAmount = _q(client_refund)
        job.workerCompensationAmount = _q(worker_compensation)
        job.save()

        JobLog.objects.create(
            jobID=job,
            notes=(
                f"[{now.strftime('%Y-%m-%d %I:%M:%S %p')}] Job cancelled by {actor_role}. "
                f"Stage={cancellation_stage}; client_refund=₱{job.clientRefundAmount}; "
                f"worker_compensation=₱{job.workerCompensationAmount}; reason={reason_text}"
            ),
            changedBy=actor_account,
            oldStatus=old_status,
            newStatus=job.status,
        )

        # Close related conversation when cancellation is finalized.
        try:
            from profiles.models import Conversation
            from profiles.conversation_service import archive_conversation

            conversation = Conversation.objects.filter(relatedJobPosting=job).first()
            if conversation:
                conversation.status = Conversation.ConversationStatus.COMPLETED
                conversation.save(update_fields=["status", "updatedAt"])
                archive_conversation(conversation)
        except Exception:
            # Cancellation must not fail if conversation closure/archive fails.
            pass

    # Notifications outside atomic write block for clarity.
    involved_accounts = {client_account.accountID: client_account}
    if worker_recipient:
        involved_accounts[worker_recipient.accountID] = worker_recipient

    for account in involved_accounts.values():
        Notification.objects.create(
            accountFK=account,
            notificationType=Notification.NotificationType.JOB_CANCELLED,
            title="Job Cancelled",
            message=(
                f"Job '{job.title}' was cancelled. "
                f"Reason: {reason_text}. "
                f"Client refund: ₱{job.clientRefundAmount}. "
                f"Worker compensation: ₱{job.workerCompensationAmount}."
            ),
            relatedJobID=job.jobID,
        )

    client_wallet, _ = Wallet.objects.get_or_create(accountFK=client_account)

    return {
        "success": True,
        "job_id": job.jobID,
        "message": "Job cancelled successfully",
        "cancelled_by_role": actor_role,
        "cancellation_stage": cancellation_stage,
        "client_refund_amount": float(job.clientRefundAmount),
        "worker_compensation_amount": float(job.workerCompensationAmount),
        "reserved_release_amount": float(reserved_release),
        "escrow_paid": bool(job.escrowPaid),
        "available_balance": float(client_wallet.availableBalance),
    }
