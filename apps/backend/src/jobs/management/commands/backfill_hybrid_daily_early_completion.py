from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Job
from jobs.team_job_services import autoheal_hybrid_daily_all_early_completed


class Command(BaseCommand):
    help = (
        "Backfill mixed/team DAILY jobs that are fully early-completed but still "
        "not finalized to COMPLETED lifecycle state."
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
            help="Optional max number of jobs to inspect.",
        )

    def handle(self, *args, **options):
        execute = bool(options.get("execute"))
        limit = int(options.get("limit") or 0)

        mode_label = "EXECUTE" if execute else "DRY-RUN"
        self.stdout.write(
            self.style.WARNING(
                f"Running backfill_hybrid_daily_early_completion in {mode_label} mode"
            )
        )

        qs = Job.objects.filter(
            is_team_job=True,
            payment_model="DAILY",
            status__in=["ACTIVE", "IN_PROGRESS"],
        ).order_by("-updatedAt")

        if limit > 0:
            qs = qs[:limit]

        inspected = 0
        candidates = 0
        healed = 0

        for job in qs:
            inspected += 1

            if execute:
                with transaction.atomic():
                    result = autoheal_hybrid_daily_all_early_completed(job)
                if result.get("success") and result.get("healed"):
                    healed += 1
            else:
                result = autoheal_hybrid_daily_all_early_completed(job)
                if result.get("success") and (
                    result.get("healed") or result.get("already_done")
                ):
                    candidates += 1
                self.stdout.write(
                    f"job#{job.jobID} status={job.status} -> {result.get('reason') or ('healed' if result.get('healed') else 'unchanged')}"
                )

        if execute:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Backfill complete. inspected={inspected}, healed={healed}, mode={mode_label}"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Dry-run complete. inspected={inspected}, candidates={candidates}, mode={mode_label}"
                )
            )
