"""
Management command: wipe_jobs
Deletes all job-related records and resets all wallet balances to ₱0.00.
Preserves: Accounts, Profiles, Skills, Certifications, Portfolios, KYC data.

Cascade-deleted via Job.delete():
  JobPhoto, JobLog, JobApplication, SavedJob, PriceNegotiation,
  JobDispute, BackjobScheduleConfirmation, DisputeEvidence, JobReview,
  ReviewSkillTag, JobSkillSlot, JobWorkerAssignment, DailyAttendance,
  DailyJobExtension, DailyRateChange, DailySkipDayRequest, JobMaterial,
  JobEmployeeAssignment, Conversation (+ Message, MessageAttachment,
  ConversationParticipant via Conversation cascade).

SET_NULL on Job.delete() (handled explicitly before Job.delete()):
  Transaction.relatedJobPosting
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from decimal import Decimal


class Command(BaseCommand):
    help = (
        "Wipe all jobs and cascade-delete related data "
        "(applications, conversations, attendance, assignments, disputes, etc.). "
        "Resets all wallet balances to ₱0.00 and clears auto-withdraw settings. "
        "Does NOT delete accounts, profiles, skills, or certifications."
    )

    def handle(self, *args, **options):
        from accounts.models import (
            BackjobScheduleConfirmation,
            ClientProfile,
            DailyAttendance,
            DailyJobExtension,
            DailyRateChange,
            DailySkipDayRequest,
            DisputeEvidence,
            Job,
            JobApplication,
            JobDispute,
            JobEmployeeAssignment,
            JobLog,
            JobMaterial,
            JobPhoto,
            JobReview,
            JobSkillSlot,
            JobWorkerAssignment,
            Notification,
            PriceNegotiation,
            ReviewSkillTag,
            SavedJob,
            Transaction,
            Wallet,
            WorkerProfile,
        )  # local import to avoid circular refs
        from agency.models import AgencyEmployee
        from profiles.models import (
            Conversation,
            ConversationParticipant,
            Message,
            MessageAttachment,
        )

        job_reference_prefixes = (
            "ESCROW-",
            "INVITE-ESCROW-",
            "ESCROW-INC-",
            "ESCROW-DEC-",
            "FEE-",
            "DAILY-FEE-RET-",
            "CANCEL-FEE-",
            "REFUND-",
            "JOB-",
            "CANCEL-CLIENT-",
            "CANCEL-WORKER-",
            "DAILY-AUTO-REL-",
            "BACKFILL-JOB-",
        )

        self.stdout.write("Starting job wipe and wallet reset...")

        with transaction.atomic():
            job_ids = list(Job.objects.values_list("jobID", flat=True))

            # Delete job-origin transactions BEFORE deleting jobs.
            # Transaction.relatedJobPosting uses SET_NULL, so linked rows can become
            # orphaned. We also match known job transaction reference prefixes so
            # historical orphan records are removed as part of a job-data-clean wipe.
            job_txn_filter = Q(relatedJobPosting__isnull=False)
            for prefix in job_reference_prefixes:
                job_txn_filter |= Q(referenceNumber__istartswith=prefix)

            txn_count, _ = Transaction.objects.filter(job_txn_filter).delete()
            self.stdout.write(
                f"  Deleted {txn_count} job-origin transaction(s) "
                f"(linked + orphan reference-matched)."
            )

            notification_count = 0
            if job_ids:
                notification_count, _ = Notification.objects.filter(
                    relatedJobID__in=job_ids
                ).delete()
                self.stdout.write(
                    f"  Deleted {notification_count} job-linked notification(s)."
                )

            job_count, deleted_detail = Job.objects.all().delete()
            wallet_count = Wallet.objects.update(
                balance=Decimal("0.00"),
                reservedBalance=Decimal("0.00"),
                pendingEarnings=Decimal("0.00"),
                autoWithdrawEnabled=False,
                preferredPaymentMethodID=None,
                lastAutoWithdrawAt=None,
            )
            worker_profile_count = WorkerProfile.objects.update(
                totalEarningGross=Decimal("0.00"),
                workerRating=0,
            )
            client_profile_count = ClientProfile.objects.update(
                totalJobsPosted=0,
                activeJobsCount=0,
                clientRating=0,
            )
            agency_employee_count = AgencyEmployee.objects.update(
                totalJobsCompleted=0,
                totalEarnings=Decimal("0.00"),
                rating=None,
                employeeOfTheMonth=False,
                employeeOfTheMonthDate=None,
                employeeOfTheMonthReason="",
                lastRatingUpdate=None,
            )

        remaining_job_txn_filter = Q(relatedJobPosting__isnull=False)
        for prefix in job_reference_prefixes:
            remaining_job_txn_filter |= Q(referenceNumber__istartswith=prefix)

        verification_counts = {
            "jobs": Job.objects.count(),
            "job_photos": JobPhoto.objects.count(),
            "job_logs": JobLog.objects.count(),
            "job_applications": JobApplication.objects.count(),
            "saved_jobs": SavedJob.objects.count(),
            "price_negotiations": PriceNegotiation.objects.count(),
            "job_disputes": JobDispute.objects.count(),
            "backjob_schedule_confirmations": BackjobScheduleConfirmation.objects.count(),
            "dispute_evidence": DisputeEvidence.objects.count(),
            "job_reviews": JobReview.objects.count(),
            "review_skill_tags": ReviewSkillTag.objects.count(),
            "job_skill_slots": JobSkillSlot.objects.count(),
            "job_worker_assignments": JobWorkerAssignment.objects.count(),
            "job_employee_assignments": JobEmployeeAssignment.objects.count(),
            "daily_attendance": DailyAttendance.objects.count(),
            "daily_job_extensions": DailyJobExtension.objects.count(),
            "daily_rate_changes": DailyRateChange.objects.count(),
            "daily_skip_day_requests": DailySkipDayRequest.objects.count(),
            "job_materials": JobMaterial.objects.count(),
            "conversations": Conversation.objects.count(),
            "conversation_participants": ConversationParticipant.objects.count(),
            "messages": Message.objects.count(),
            "message_attachments": MessageAttachment.objects.count(),
            "job_origin_transactions_remaining": Transaction.objects.filter(
                remaining_job_txn_filter
            ).count(),
            "job_linked_notifications": Notification.objects.filter(
                relatedJobID__in=job_ids
            ).count()
            if job_ids
            else 0,
        }

        verification_lines = [
            f"  {name}: {count}" for name, count in sorted(verification_counts.items())
        ]
        verification_str = "\n".join(verification_lines)

        # Build a readable breakdown
        detail_lines = [
            f"  {model}: {count}" for model, count in sorted(deleted_detail.items())
        ]
        detail_str = "\n".join(detail_lines) if detail_lines else "  (none)"

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Done!\n"
                f"Deleted {job_count} total records:\n{detail_str}\n"
                f"Reset {wallet_count} wallet(s) to ₱0.00 "
                f"(balance, reservedBalance, pendingEarnings, "
                f"autoWithdrawEnabled, preferredPaymentMethodID, lastAutoWithdrawAt).\n"
                f"Reset {worker_profile_count} WorkerProfile(s) "
                f"(totalEarningGross, workerRating).\n"
                f"Reset {client_profile_count} ClientProfile(s) "
                f"(totalJobsPosted, activeJobsCount, clientRating).\n"
                f"Reset {agency_employee_count} AgencyEmployee(s) "
                f"(totalJobsCompleted, totalEarnings, rating, employeeOfTheMonth, "
                f"employeeOfTheMonthDate, employeeOfTheMonthReason, lastRatingUpdate).\n"
                f"Post-wipe verification counts:\n{verification_str}"
            )
        )
