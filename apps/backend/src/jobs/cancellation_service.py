from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta
from typing import Dict, List, Optional, Tuple

from django.db import transaction as db_transaction
from django.utils import timezone

from accounts.models import (
    Job,
    JobEmployeeAssignment,
    JobLog,
    JobWorkerAssignment,
    Notification,
    Transaction,
    Wallet,
)


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


def _worker_recipient_accounts(job: Job) -> List:
    """
    Resolve worker-side recipients for cancellation compensation.

    Supports direct jobs, agency jobs, team jobs, and agency-employee assignments.
    """
    recipients = []

    if job.assignedWorkerID and job.assignedWorkerID.profileID and job.assignedWorkerID.profileID.accountFK:
        recipients.append(job.assignedWorkerID.profileID.accountFK)

    if job.assignedAgencyFK and job.assignedAgencyFK.accountFK:
        recipients.append(job.assignedAgencyFK.accountFK)

    if getattr(job, "is_team_job", False):
        team_assignments = JobWorkerAssignment.objects.filter(
            jobID=job,
            assignment_status=JobWorkerAssignment.AssignmentStatus.ACTIVE,
        ).select_related('workerID__profileID__accountFK')

        for assignment in team_assignments:
            account = assignment.workerID.profileID.accountFK if assignment.workerID and assignment.workerID.profileID else None
            if account:
                recipients.append(account)

    has_active_employee_assignment = JobEmployeeAssignment.objects.filter(
        job=job,
        status__in=[
            JobEmployeeAssignment.AssignmentStatus.ASSIGNED,
            JobEmployeeAssignment.AssignmentStatus.IN_PROGRESS,
            JobEmployeeAssignment.AssignmentStatus.COMPLETED,
        ],
    ).exists()
    if has_active_employee_assignment and job.assignedAgencyFK and job.assignedAgencyFK.accountFK:
        recipients.append(job.assignedAgencyFK.accountFK)

    deduped = {}
    for account in recipients:
        deduped[account.accountID] = account
    return list(deduped.values())


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
        - Client cancels before worker arrival: client gets full escrow back.
        - Client cancels after arrival but before work start: escrow is split 50/50.
        - Client cancels after worker started: worker gets full escrow.
        - Client cancels after worker marked complete: worker gets full escrow,
            and client is suspended for 1 day.
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
    worker_recipients = _worker_recipient_accounts(job)

    escrow_pool = _q(job.escrowAmount if job.escrowAmount and job.escrowAmount > 0 else (job.budget * Decimal("0.5")))
    platform_fee = _q(Decimal(str(job.budget)) * Decimal("0.10"))

    cancellation_stage = "BEFORE_ARRIVAL"
    client_refund = Decimal("0.00")
    worker_compensation = Decimal("0.00")
    reserved_release = Decimal("0.00")
    suspension_applied = False
    suspension_until = None

    # Apply strict policy to CLIENT cancellations; preserve previous behavior for other actor roles.
    if actor_role == "CLIENT":
        if job.workerMarkedComplete:
            cancellation_stage = "AFTER_WORKER_MARKED_DONE"
            worker_compensation = escrow_pool
            client_refund = Decimal("0.00")
        elif job.workerMarkedJobStarted:
            cancellation_stage = "AFTER_WORK_STARTED"
            worker_compensation = escrow_pool
            client_refund = Decimal("0.00")
        elif job.clientConfirmedWorkStarted:
            cancellation_stage = "AFTER_ARRIVAL_BEFORE_WORK_START"
            worker_compensation = _q(escrow_pool * Decimal("0.50"))
            client_refund = _q(escrow_pool - worker_compensation)
        else:
            cancellation_stage = "BEFORE_ARRIVAL"
            client_refund = escrow_pool
    else:
        # Legacy routing for worker/agency initiated cancellations.
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

    # Safety: if there is no worker-side recipient, revert all to client refund.
    if worker_compensation > 0 and len(worker_recipients) == 0:
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

            if worker_compensation > 0 and worker_recipients:
                per_recipient = _q(worker_compensation / Decimal(len(worker_recipients)))
                distributed_total = _q(per_recipient * Decimal(len(worker_recipients)))
                adjustment = _q(worker_compensation - distributed_total)

                for idx, recipient in enumerate(worker_recipients):
                    payout = per_recipient
                    if idx == 0 and adjustment != Decimal("0.00"):
                        payout = _q(per_recipient + adjustment)

                    _credit_wallet(
                        account=recipient,
                        amount=payout,
                        tx_type=Transaction.TransactionType.EARNING,
                        description=f"Cancellation compensation for job: {job.title}",
                        job=job,
                        reference=f"CANCEL-WORKER-{job.jobID}-{reference_suffix}-{idx + 1}",
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

        # Policy enforcement: if client cancels after worker marked done, suspend client for 1 day.
        if actor_role == "CLIENT" and cancellation_stage == "AFTER_WORKER_MARKED_DONE":
            suspension_until = now + timedelta(days=1)
            client_account.is_suspended = True
            client_account.suspended_until = suspension_until
            client_account.suspended_reason = (
                "Account temporarily suspended for 1 day due to cancellation after worker marked job done."
            )
            client_account.save(update_fields=["is_suspended", "suspended_until", "suspended_reason"])
            suspension_applied = True

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
    for recipient in worker_recipients:
        involved_accounts[recipient.accountID] = recipient

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

    if suspension_applied:
        Notification.objects.create(
            accountFK=client_account,
            notificationType=Notification.NotificationType.JOB_CANCELLED,
            title="Temporary Account Suspension",
            message=(
                "Your account has been suspended for 1 day due to cancelling "
                "a job after the worker marked it as done."
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
        "worker_recipient_count": len(worker_recipients),
        "reserved_release_amount": float(reserved_release),
        "escrow_paid": bool(job.escrowPaid),
        "suspension_applied": suspension_applied,
        "suspension_until": suspension_until.isoformat() if suspension_until else None,
        "available_balance": float(client_wallet.availableBalance),
    }
