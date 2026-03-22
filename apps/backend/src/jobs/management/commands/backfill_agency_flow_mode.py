from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Job


class Command(BaseCommand):
    help = "Backfill Job.agency_flow_mode for legacy agency jobs."

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute",
            action="store_true",
            help="Apply updates. Without this flag, runs in dry-run mode.",
        )
        parser.add_argument(
            "--job-id",
            type=int,
            default=0,
            help="Optional single job ID to process.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Optional max number of rows to inspect.",
        )

    def handle(self, *args, **options):
        execute = bool(options.get("execute"))
        job_id = int(options.get("job_id") or 0)
        limit = int(options.get("limit") or 0)

        mode_label = "EXECUTE" if execute else "DRY-RUN"
        self.stdout.write(
            self.style.WARNING(
                f"Running backfill_agency_flow_mode in {mode_label} mode"
            )
        )

        qs = (
            Job.objects.filter(assignedAgencyFK__isnull=False)
            .select_related("assignedAgencyFK")
            .prefetch_related("skill_slots", "worker_assignments", "employee_assignments")
            .order_by("jobID")
        )
        if job_id > 0:
            qs = qs.filter(jobID=job_id)
        if limit > 0:
            qs = qs[:limit]

        inspected = 0
        updated = 0
        direct_count = 0
        team_slot_count = 0

        for job in qs:
            inspected += 1
            inferred = job.infer_agency_flow_mode()
            current = (job.agency_flow_mode or "").upper().strip() or None

            if inferred == Job.AgencyFlowMode.DIRECT:
                direct_count += 1
            elif inferred == Job.AgencyFlowMode.TEAM_SLOT:
                team_slot_count += 1

            if current == inferred:
                continue

            self.stdout.write(
                f"job#{job.jobID}: {current or 'NULL'} -> {inferred or 'NULL'}"
            )

            if execute:
                with transaction.atomic():
                    job.agency_flow_mode = inferred
                    job.save(update_fields=["agency_flow_mode", "updatedAt"])
                    updated += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Agency flow mode backfill complete. "
                f"inspected={inspected}, updates={updated}, "
                f"direct={direct_count}, team_slot={team_slot_count}, mode={mode_label}"
            )
        )
