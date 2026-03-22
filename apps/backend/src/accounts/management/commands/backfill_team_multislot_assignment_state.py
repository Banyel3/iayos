from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Job, JobWorkerAssignment


class Command(BaseCommand):
    help = (
        "Normalize team multi-slot worker assignment state so arrival/completion "
        "flags are unified per worker within each job."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Persist changes (default is dry-run).",
        )
        parser.add_argument(
            "--job-id",
            type=int,
            help="Only process one team job ID.",
        )

    def handle(self, *args, **options):
        apply_changes = bool(options.get("apply", False))
        job_id_filter = options.get("job_id")

        mode_text = "APPLY" if apply_changes else "DRY RUN"
        self.stdout.write(self.style.WARNING(f"\n[{mode_text}] team multi-slot backfill\n"))

        jobs_qs = Job.objects.filter(is_team_job=True, status__in=["ACTIVE", "IN_PROGRESS"])
        if job_id_filter:
            jobs_qs = jobs_qs.filter(jobID=job_id_filter)

        jobs = list(jobs_qs)
        if not jobs:
            self.stdout.write(self.style.SUCCESS("No matching team jobs found."))
            return

        scanned_groups = 0
        normalized_groups = 0
        normalized_rows = 0

        for job in jobs:
            assignments = list(
                JobWorkerAssignment.objects.filter(
                    jobID=job,
                    assignment_status="ACTIVE",
                ).select_related("workerID__profileID")
            )

            groups = {}
            for row in assignments:
                key = row.workerID_id
                groups.setdefault(key, []).append(row)

            for worker_id, rows in groups.items():
                if len(rows) <= 1:
                    continue

                scanned_groups += 1

                arrival_true_rows = [r for r in rows if bool(r.client_confirmed_arrival)]
                complete_true_rows = [r for r in rows if bool(r.worker_marked_complete)]

                needs_arrival_backfill = bool(arrival_true_rows) and any(
                    not r.client_confirmed_arrival for r in rows
                )
                needs_complete_backfill = bool(complete_true_rows) and any(
                    not r.worker_marked_complete for r in rows
                )

                if not needs_arrival_backfill and not needs_complete_backfill:
                    continue

                normalized_groups += 1

                arrival_timestamps = [
                    r.client_confirmed_arrival_at
                    for r in arrival_true_rows
                    if r.client_confirmed_arrival_at is not None
                ]
                complete_timestamps = [
                    r.worker_marked_complete_at
                    for r in complete_true_rows
                    if r.worker_marked_complete_at is not None
                ]

                unified_arrival_at = min(arrival_timestamps) if arrival_timestamps else None
                unified_complete_at = min(complete_timestamps) if complete_timestamps else None

                worker_name = "Unknown"
                if rows and rows[0].workerID and rows[0].workerID.profileID:
                    profile = rows[0].workerID.profileID
                    worker_name = f"{profile.firstName} {profile.lastName}".strip()

                self.stdout.write(
                    f"Job #{job.jobID} | Worker #{worker_id} ({worker_name}) | "
                    f"assignments={len(rows)} | arrival_fix={needs_arrival_backfill} | "
                    f"complete_fix={needs_complete_backfill}"
                )

                if not apply_changes:
                    continue

                with transaction.atomic():
                    for row in rows:
                        update_fields = []

                        if needs_arrival_backfill and not row.client_confirmed_arrival:
                            row.client_confirmed_arrival = True
                            row.client_confirmed_arrival_at = unified_arrival_at
                            update_fields.extend(
                                [
                                    "client_confirmed_arrival",
                                    "client_confirmed_arrival_at",
                                ]
                            )

                        if needs_complete_backfill and not row.worker_marked_complete:
                            row.worker_marked_complete = True
                            row.worker_marked_complete_at = unified_complete_at
                            update_fields.extend(
                                [
                                    "worker_marked_complete",
                                    "worker_marked_complete_at",
                                ]
                            )

                        if update_fields:
                            update_fields.append("updatedAt")
                            row.save(update_fields=update_fields)
                            normalized_rows += 1

        self.stdout.write("\n=== Summary ===")
        self.stdout.write(f"Team jobs scanned: {len(jobs)}")
        self.stdout.write(f"Multi-slot worker groups scanned: {scanned_groups}")
        self.stdout.write(f"Groups needing normalization: {normalized_groups}")
        self.stdout.write(f"Rows normalized: {normalized_rows if apply_changes else 0}")

        if not apply_changes:
            self.stdout.write(
                self.style.WARNING("Dry-run only. Re-run with --apply to persist changes.")
            )
        else:
            self.stdout.write(self.style.SUCCESS("Backfill applied successfully."))
