from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import BackjobScheduleConfirmation, JobDispute, JobWorkerAssignment


class Command(BaseCommand):
    help = (
        "Normalize legacy/stuck backjob disputes so existing requests follow the "
        "current state machine semantics."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute",
            action="store_true",
            help="Apply updates. Without this flag, command runs in dry-run mode.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Optional max number of disputes to inspect.",
        )

    def _normalize_dispute(self, dispute: JobDispute):
        changed_fields = []
        notes = []

        if dispute.clientConfirmedBackjob:
            if not dispute.workerMarkedBackjobComplete:
                dispute.workerMarkedBackjobComplete = True
                if not dispute.workerMarkedBackjobCompleteAt:
                    dispute.workerMarkedBackjobCompleteAt = (
                        dispute.clientConfirmedBackjobAt or timezone.now()
                    )
                changed_fields.extend([
                    "workerMarkedBackjobComplete",
                    "workerMarkedBackjobCompleteAt",
                ])
                notes.append("filled workerMarkedBackjobComplete from clientConfirmedBackjob")

            if not dispute.backjobStarted:
                dispute.backjobStarted = True
                if not dispute.backjobStartedAt:
                    dispute.backjobStartedAt = (
                        dispute.workerMarkedBackjobCompleteAt
                        or dispute.clientConfirmedBackjobAt
                        or timezone.now()
                    )
                changed_fields.extend(["backjobStarted", "backjobStartedAt"])
                notes.append("filled backjobStarted from completed state")

            if dispute.status != JobDispute.DisputeStatus.RESOLVED:
                dispute.status = JobDispute.DisputeStatus.RESOLVED
                changed_fields.append("status")
                notes.append("status -> RESOLVED")

            if not dispute.resolvedDate:
                dispute.resolvedDate = dispute.clientConfirmedBackjobAt or timezone.now()
                changed_fields.append("resolvedDate")
                notes.append("filled resolvedDate")

            return changed_fields, notes

        if dispute.workerMarkedBackjobComplete:
            if not dispute.backjobStarted:
                dispute.backjobStarted = True
                if not dispute.backjobStartedAt:
                    dispute.backjobStartedAt = (
                        dispute.workerMarkedBackjobCompleteAt or timezone.now()
                    )
                changed_fields.extend(["backjobStarted", "backjobStartedAt"])
                notes.append("filled backjobStarted from worker completion")

            if dispute.status != JobDispute.DisputeStatus.UNDER_REVIEW:
                dispute.status = JobDispute.DisputeStatus.UNDER_REVIEW
                changed_fields.append("status")
                notes.append("status -> UNDER_REVIEW")

        elif dispute.backjobStarted:
            if dispute.status != JobDispute.DisputeStatus.UNDER_REVIEW:
                dispute.status = JobDispute.DisputeStatus.UNDER_REVIEW
                changed_fields.append("status")
                notes.append("status -> UNDER_REVIEW for started backjob")

        # Team legacy compatibility: infer schedule confirmation from existing
        # per-assignment confirmations if all active assignments confirmed.
        if (
            dispute.jobID
            and dispute.jobID.is_team_job
            and dispute.scheduled_date
            and not dispute.workerScheduleConfirmed
            and dispute.status in [
                JobDispute.DisputeStatus.IN_NEGOTIATION,
                JobDispute.DisputeStatus.UNDER_REVIEW,
            ]
        ):
            active_assignment_ids = list(
                JobWorkerAssignment.objects.filter(
                    jobID=dispute.jobID,
                    assignment_status__in=["ACTIVE", "COMPLETED"],
                ).values_list("assignmentID", flat=True)
            )

            if active_assignment_ids:
                confirmations = BackjobScheduleConfirmation.objects.filter(
                    disputeID=dispute,
                    assignmentID_id__in=active_assignment_ids,
                    confirmed=True,
                )
                confirmed_count = confirmations.count()
                total_count = len(active_assignment_ids)

                if confirmed_count >= total_count:
                    dispute.workerScheduleConfirmed = True
                    latest_confirmation = confirmations.order_by("-confirmedAt").first()
                    dispute.workerScheduleConfirmedAt = (
                        latest_confirmation.confirmedAt if latest_confirmation else timezone.now()
                    )
                    dispute.status = JobDispute.DisputeStatus.UNDER_REVIEW
                    changed_fields.extend(
                        [
                            "workerScheduleConfirmed",
                            "workerScheduleConfirmedAt",
                            "status",
                        ]
                    )
                    notes.append("inferred team schedule confirmation from assignment confirmations")

        if dispute.workerScheduleConfirmed and dispute.status != JobDispute.DisputeStatus.UNDER_REVIEW:
            dispute.status = JobDispute.DisputeStatus.UNDER_REVIEW
            changed_fields.append("status")
            notes.append("status -> UNDER_REVIEW for confirmed schedule")

        if (
            dispute.status == JobDispute.DisputeStatus.UNDER_REVIEW
            and not dispute.scheduled_date
            and not dispute.backjobStarted
            and not dispute.workerMarkedBackjobComplete
            and not dispute.clientConfirmedBackjob
        ):
            dispute.status = JobDispute.DisputeStatus.IN_NEGOTIATION
            changed_fields.append("status")
            notes.append("status -> IN_NEGOTIATION because schedule is missing")

        return changed_fields, notes

    def handle(self, *args, **options):
        execute = bool(options.get("execute"))
        limit = int(options.get("limit") or 0)

        qs = JobDispute.objects.filter(
            status__in=[
                JobDispute.DisputeStatus.OPEN,
                JobDispute.DisputeStatus.IN_NEGOTIATION,
                JobDispute.DisputeStatus.UNDER_REVIEW,
                JobDispute.DisputeStatus.RESOLVED,
            ]
        ).select_related("jobID").order_by("-openedDate")

        if limit > 0:
            qs = qs[:limit]

        inspected = 0
        updated = 0

        mode_label = "EXECUTE" if execute else "DRY-RUN"
        self.stdout.write(self.style.WARNING(f"Running backfill_backjob_state in {mode_label} mode"))

        for dispute in qs:
            inspected += 1
            changed_fields, notes = self._normalize_dispute(dispute)
            # Remove duplicates while preserving stable order for update_fields.
            changed_fields = list(dict.fromkeys(changed_fields))

            if not changed_fields:
                continue

            updated += 1
            note_summary = "; ".join(notes)
            self.stdout.write(
                f"Dispute #{dispute.disputeID} (job #{dispute.jobID_id}): {note_summary}"
            )

            if execute:
                if "updatedAt" not in changed_fields:
                    changed_fields.append("updatedAt")
                dispute.save(update_fields=changed_fields)

        self.stdout.write(
            self.style.SUCCESS(
                f"Backjob state backfill complete. inspected={inspected}, candidates={updated}, mode={mode_label}"
            )
        )
