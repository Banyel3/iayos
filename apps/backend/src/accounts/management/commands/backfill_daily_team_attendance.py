"""
Management command: backfill_daily_team_attendance

Creates missing DailyAttendance rows for today on IN_PROGRESS DAILY team jobs
where workers/employees already have client_confirmed_arrival=True but no
attendance row exists for today's date (the "Day 2+ multi-slot" bug).

Usage:
    # Dry run (default) — shows what would be created:
    python manage.py backfill_daily_team_attendance

    # Restrict to a single job:
    python manage.py backfill_daily_team_attendance --job-id 42

    # Actually write rows:
    python manage.py backfill_daily_team_attendance --apply

    # Single job, apply:
    python manage.py backfill_daily_team_attendance --job-id 42 --apply
"""

from decimal import Decimal
from zoneinfo import ZoneInfo

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import (
    DailyAttendance,
    Job,
    JobEmployeeAssignment,
    JobWorkerAssignment,
)

PH_TIMEZONE = ZoneInfo("Asia/Manila")


def _effective_date(job):
    """Manila-local date — mirrors _get_effective_work_date() in profiles/api.py."""
    return timezone.localtime(timezone.now(), PH_TIMEZONE).date()


class Command(BaseCommand):
    help = (
        "Backfill missing DailyAttendance rows for today on DAILY team jobs "
        "where client_confirmed_arrival is already True but no row exists for "
        "today (multi-slot Day 2+ attendance gap)."
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
            dest="job_id",
            help="Only process a single job ID.",
        )

    def handle(self, *args, **options):
        apply_changes = bool(options.get("apply", False))
        job_id_filter = options.get("job_id")
        now = timezone.now()

        mode = "APPLY" if apply_changes else "DRY RUN"
        self.stdout.write(self.style.WARNING(f"\n[{mode}] backfill_daily_team_attendance\n"))

        jobs_qs = Job.objects.filter(
            payment_model="DAILY",
            is_team_job=True,
            status="IN_PROGRESS",
        )
        if job_id_filter:
            jobs_qs = jobs_qs.filter(jobID=job_id_filter)

        jobs = list(jobs_qs)
        if not jobs:
            self.stdout.write(self.style.SUCCESS("No matching IN_PROGRESS DAILY team jobs found."))
            return

        self.stdout.write(f"Scanning {len(jobs)} job(s)...\n")

        total_created = 0
        total_skipped = 0

        for job in jobs:
            today = _effective_date(job)

            existing = list(DailyAttendance.objects.filter(jobID=job, date=today))
            existing_assignment_ids = {
                r.assignmentID_id for r in existing if r.assignmentID_id is not None
            }
            existing_employee_ids = {
                r.employeeID_id for r in existing if r.employeeID_id is not None
            }

            created_this_job = 0

            # ── Freelance worker slots ──────────────────────────────────────
            workers_missing = (
                JobWorkerAssignment.objects.filter(
                    jobID=job,
                    assignment_status="ACTIVE",
                    client_confirmed_arrival=True,
                )
                .exclude(assignmentID__in=existing_assignment_ids)
                .select_related("workerID__profileID")
            )

            for wa in workers_missing:
                rate = Decimal(str(
                    getattr(wa, "daily_rate_at_assignment", None)
                    or getattr(job, "daily_rate_agreed", None)
                    or 0
                ))
                profile = wa.workerID.profileID
                name = f"{profile.firstName or ''} {profile.lastName or ''}".strip() or "Worker"
                desc = (
                    f"  [WORKER] job={job.jobID} ({job.title!r}) "
                    f"assignment={wa.assignmentID} worker={wa.workerID_id} ({name}) "
                    f"date={today} rate={rate}"
                )

                if apply_changes:
                    _, created = DailyAttendance.objects.get_or_create(
                        assignmentID=wa,
                        date=today,
                        defaults={
                            "jobID": job,
                            "workerID": wa.workerID,
                            "status": "PENDING",
                            "worker_confirmed": True,
                            "worker_confirmed_at": now,
                            "time_in": now,
                            "amount_earned": rate,
                            "notes": "Backfill: missing DAILY team attendance row (multi-slot Day 2+)",
                        },
                    )
                    if created:
                        self.stdout.write(self.style.SUCCESS(f"  ✓ CREATED {desc}"))
                        created_this_job += 1
                        total_created += 1
                    else:
                        self.stdout.write(f"  – skipped (already exists): {desc}")
                        total_skipped += 1
                else:
                    self.stdout.write(self.style.WARNING(f"  [DRY RUN] would create: {desc}"))
                    created_this_job += 1
                    total_created += 1

            # ── Agency employee slots ───────────────────────────────────────
            employees_missing = (
                JobEmployeeAssignment.objects.filter(
                    job=job,
                    skill_slot__isnull=False,
                    status__in=["ASSIGNED", "IN_PROGRESS"],
                    clientConfirmedArrival=True,
                )
                .select_related("employee")
                .exclude(employee__employeeID__in=existing_employee_ids)
            )

            for ea in employees_missing:
                rate = Decimal(str(
                    getattr(ea.employee, "daily_rate", None)
                    or getattr(job, "daily_rate_agreed", None)
                    or 0
                ))
                desc = (
                    f"  [EMPLOYEE] job={job.jobID} ({job.title!r}) "
                    f"employee={ea.employee.employeeID} ({ea.employee.name or 'Employee'}) "
                    f"date={today} rate={rate}"
                )

                if apply_changes:
                    _, created = DailyAttendance.objects.get_or_create(
                        jobID=job,
                        employeeID=ea.employee,
                        date=today,
                        defaults={
                            "workerID": None,
                            "assignmentID": None,
                            "status": "PENDING",
                            "worker_confirmed": True,
                            "worker_confirmed_at": now,
                            "time_in": now,
                            "amount_earned": rate,
                            "notes": "Backfill: missing DAILY team attendance row (employee, Day 2+)",
                        },
                    )
                    if created:
                        self.stdout.write(self.style.SUCCESS(f"  ✓ CREATED {desc}"))
                        created_this_job += 1
                        total_created += 1
                    else:
                        self.stdout.write(f"  – skipped (already exists): {desc}")
                        total_skipped += 1
                else:
                    self.stdout.write(self.style.WARNING(f"  [DRY RUN] would create: {desc}"))
                    created_this_job += 1
                    total_created += 1

            if created_this_job == 0 and not existing_assignment_ids and not existing_employee_ids:
                self.stdout.write(
                    f"  Job {job.jobID} ({job.title!r}): no confirmed workers/employees without rows."
                )

        self.stdout.write("")
        summary = (
            f"{'Would create' if not apply_changes else 'Created'} {total_created} row(s)"
        )
        if apply_changes and total_skipped:
            summary += f", skipped {total_skipped} (already existed)"
        self.stdout.write(self.style.SUCCESS(summary))

        if not apply_changes and total_created > 0:
            self.stdout.write(
                self.style.WARNING("\nRe-run with --apply to persist changes.")
            )
