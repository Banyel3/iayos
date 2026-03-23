from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Job, JobEmployeeAssignment, JobWorkerAssignment


class Command(BaseCommand):
    help = (
        "Reset stale TEAM DAILY cycle flags for jobs that were already in-progress "
        "before QA skip-day reset fixes. Defaults to dry-run; pass --execute to apply."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute",
            action="store_true",
            help="Apply updates. Without this flag, command runs in dry-run mode.",
        )
        parser.add_argument(
            "--job-id",
            type=int,
            action="append",
            default=[],
            help="Optional job id filter. Can be supplied multiple times.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Optional max number of jobs to inspect.",
        )
        parser.add_argument(
            "--reached-duration-only",
            action="store_true",
            help=(
                "Only include jobs where effective days have reached configured duration "
                "(useful for stale jobs already at 100% progress)."
            ),
        )
        parser.add_argument(
            "--preserve-qa-offset",
            action="store_true",
            help=(
                "Do not reset qa_day_offset to 0. By default this command rewinds "
                "stale QA-shifted jobs back to day 1 for clean retesting."
            ),
        )

    @staticmethod
    def _effective_days(job: Job) -> int:
        configured_days = int(getattr(job, "duration_days", 0) or 0)
        actual_days = int(getattr(job, "total_days_worked", 0) or 0)
        qa_offset = max(0, int(getattr(job, "qa_day_offset", 0) or 0))
        effective_days = actual_days + qa_offset
        if configured_days > 0:
            effective_days = min(configured_days, effective_days)
        return max(0, effective_days)

    def handle(self, *args, **options):
        execute = bool(options.get("execute"))
        job_ids = list(options.get("job_id") or [])
        limit = int(options.get("limit") or 0)
        reached_duration_only = bool(options.get("reached_duration_only"))
        reset_qa_offset = not bool(options.get("preserve_qa_offset"))
        mode_label = "EXECUTE" if execute else "DRY-RUN"

        self.stdout.write(
            self.style.WARNING(
                f"Running backfill_qa_skip_cycle_state in {mode_label} mode"
            )
        )

        jobs_qs = Job.objects.filter(
            payment_model="DAILY",
            is_team_job=True,
            status="IN_PROGRESS",
            clientMarkedComplete=False,
        ).order_by("jobID")

        if job_ids:
            jobs_qs = jobs_qs.filter(jobID__in=job_ids)

        if limit > 0:
            jobs_qs = jobs_qs[:limit]

        inspected_jobs = 0
        candidate_jobs = 0
        updated_jobs = 0

        total_worker_rows = 0
        total_worker_completion_rows = 0
        total_worker_status_rows = 0

        total_employee_rows = 0
        total_job_completion_rows = 0
        total_jobs_qa_offset_reset = 0

        for job in jobs_qs:
            inspected_jobs += 1

            configured_days = int(getattr(job, "duration_days", 0) or 0)
            effective_days = self._effective_days(job)

            if reached_duration_only and configured_days > 0 and effective_days < configured_days:
                continue

            worker_scope = JobWorkerAssignment.objects.filter(
                jobID=job,
                assignment_status__in=["ACTIVE", "COMPLETED"],
                early_completed=False,
            )
            worker_arrival_count = worker_scope.filter(
                client_confirmed_arrival=True
            ).count()
            worker_completion_count = worker_scope.filter(
                worker_marked_complete=True
            ).count()
            worker_completed_status_count = worker_scope.filter(
                assignment_status="COMPLETED"
            ).count()

            employee_scope = JobEmployeeAssignment.objects.filter(
                job=job,
                skill_slot__isnull=False,
                status__in=["IN_PROGRESS", "COMPLETED"],
                early_completed=False,
            )
            employee_reset_count = employee_scope.count()

            job_completion_flag_count = int(bool(getattr(job, "workerMarkedComplete", False)))
            qa_offset_reset_needed = reset_qa_offset and int(
                getattr(job, "qa_day_offset", 0) or 0
            ) > 0

            has_changes = any(
                [
                    worker_arrival_count,
                    worker_completion_count,
                    worker_completed_status_count,
                    employee_reset_count,
                    job_completion_flag_count,
                    qa_offset_reset_needed,
                ]
            )

            if not has_changes:
                continue

            candidate_jobs += 1

            if not execute:
                self.stdout.write(
                    (
                        f"job#{job.jobID} would-reset: "
                        f"worker_arrival={worker_arrival_count}, "
                        f"worker_completion={worker_completion_count}, "
                        f"worker_status_completed={worker_completed_status_count}, "
                        f"employee_rows={employee_reset_count}, "
                        f"job_workerMarkedComplete={job_completion_flag_count}, "
                        f"qa_offset_reset_needed={int(qa_offset_reset_needed)}, "
                        f"effective_days={effective_days}/{configured_days or '?'}"
                    )
                )
                continue

            with transaction.atomic():
                total_worker_rows += worker_scope.filter(
                    client_confirmed_arrival=True
                ).update(
                    client_confirmed_arrival=False,
                    client_confirmed_arrival_at=None,
                )

                total_worker_completion_rows += worker_scope.filter(
                    worker_marked_complete=True
                ).update(
                    worker_marked_complete=False,
                    worker_marked_complete_at=None,
                )

                total_worker_status_rows += worker_scope.filter(
                    assignment_status="COMPLETED"
                ).update(assignment_status="ACTIVE")

                total_employee_rows += employee_scope.update(
                    status="ASSIGNED",
                    dispatched=False,
                    dispatchedAt=None,
                    clientConfirmedArrival=False,
                    clientConfirmedArrivalAt=None,
                    agencyMarkedComplete=False,
                    agencyMarkedCompleteAt=None,
                    employeeMarkedComplete=False,
                    employeeMarkedCompleteAt=None,
                    clientApproved=False,
                    clientApprovedAt=None,
                )

                if job_completion_flag_count:
                    job.workerMarkedComplete = False
                    job.workerMarkedCompleteAt = None
                    job.save(
                        update_fields=[
                            "workerMarkedComplete",
                            "workerMarkedCompleteAt",
                            "updatedAt",
                        ]
                    )
                    total_job_completion_rows += 1

                if qa_offset_reset_needed:
                    job.qa_day_offset = 0
                    job.save(update_fields=["qa_day_offset", "updatedAt"])
                    total_jobs_qa_offset_reset += 1

            updated_jobs += 1

        self.stdout.write(
            self.style.SUCCESS(
                "QA skip cycle backfill complete. "
                f"inspected_jobs={inspected_jobs}, candidate_jobs={candidate_jobs}, "
                f"updated_jobs={updated_jobs}, worker_arrival_rows_reset={total_worker_rows}, "
                f"worker_completion_rows_reset={total_worker_completion_rows}, "
                f"worker_status_rows_reset={total_worker_status_rows}, "
                f"employee_rows_reset={total_employee_rows}, "
                f"job_completion_flags_reset={total_job_completion_rows}, "
                f"jobs_qa_offset_reset={total_jobs_qa_offset_reset}, "
                f"mode={mode_label}"
            )
        )
