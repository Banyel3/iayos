from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import DailyAttendance
from jobs.daily_payment_service import DailyPaymentService


class Command(BaseCommand):
    help = (
        "Backfill team DAILY attendance rows for the simplified flow where "
        "worker completion can be settled without legacy checkout/confirm-client gating. "
        "Defaults to dry-run; pass --execute to apply changes."
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
            default=0,
            help="Optional single job ID to scope the backfill.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Optional max number of attendance rows to inspect.",
        )

    @staticmethod
    def _resolve_daily_rate(attendance: DailyAttendance) -> Decimal:
        if (
            attendance.assignmentID
            and attendance.assignmentID.daily_rate_at_assignment is not None
        ):
            return attendance.assignmentID.daily_rate_at_assignment

        if attendance.employeeID and attendance.employeeID.daily_rate is not None:
            return attendance.employeeID.daily_rate

        if attendance.jobID and attendance.jobID.daily_rate_agreed is not None:
            return attendance.jobID.daily_rate_agreed

        return Decimal("0.00")

    def handle(self, *args, **options):
        execute = bool(options.get("execute"))
        job_id = int(options.get("job_id") or 0)
        limit = int(options.get("limit") or 0)

        mode_label = "EXECUTE" if execute else "DRY-RUN"
        self.stdout.write(
            self.style.WARNING(
                f"Running backfill_team_daily_flow_alignment in {mode_label} mode"
            )
        )

        rows = DailyAttendance.objects.filter(
            jobID__is_team_job=True,
            jobID__payment_model="DAILY",
            jobID__status__in=["ACTIVE", "IN_PROGRESS"],
            worker_confirmed=True,
            worker_marked_complete=True,
            payment_processed=False,
        ).select_related(
            "jobID",
            "jobID__clientID__profileID__accountFK",
            "assignmentID",
            "employeeID",
        )

        if job_id > 0:
            rows = rows.filter(jobID_id=job_id)

        rows = rows.order_by("jobID_id", "date", "attendanceID")
        if limit > 0:
            rows = rows[:limit]

        inspected = 0
        candidates = 0
        healed = 0
        settled = 0
        failed = 0

        now = timezone.now()

        for attendance in rows:
            inspected += 1

            needs_timeout = attendance.time_out is None
            needs_status_normalize = attendance.status in ["PENDING", "DISPATCHED"]
            needs_client_confirm = not attendance.client_confirmed
            needs_amount = (
                needs_status_normalize
                and (attendance.amount_earned is None or attendance.amount_earned <= 0)
            )

            if (
                needs_timeout
                or needs_status_normalize
                or needs_client_confirm
                or needs_amount
            ):
                candidates += 1

            if not execute:
                self.stdout.write(
                    (
                        f"attendance#{attendance.attendanceID} job#{attendance.jobID_id} "
                        f"status={attendance.status} needs_timeout={needs_timeout} "
                        f"needs_client_confirm={needs_client_confirm}"
                    )
                )
                continue

            try:
                with transaction.atomic():
                    update_fields = []

                    if needs_timeout:
                        attendance.time_out = (
                            attendance.worker_marked_complete_at
                            or attendance.worker_confirmed_at
                            or now
                        )
                        update_fields.append("time_out")

                    if needs_status_normalize:
                        attendance.status = "PRESENT"
                        update_fields.append("status")

                    if needs_amount:
                        attendance.amount_earned = self._resolve_daily_rate(attendance)
                        update_fields.append("amount_earned")

                    if needs_client_confirm:
                        attendance.client_confirmed = True
                        attendance.client_confirmed_at = now
                        update_fields.extend(["client_confirmed", "client_confirmed_at"])

                    if update_fields:
                        update_fields.append("updatedAt")
                        attendance.save(update_fields=list(dict.fromkeys(update_fields)))
                        healed += 1

                    result = DailyPaymentService.process_day_payment(
                        attendance,
                        payment_method="WALLET",
                    )
                    if result.get("success"):
                        settled += 1
                    else:
                        failed += 1
                        self.stdout.write(
                            self.style.ERROR(
                                (
                                    f"attendance#{attendance.attendanceID} job#{attendance.jobID_id} "
                                    f"payment_failed={result.get('error', 'unknown error')}"
                                )
                            )
                        )
            except Exception as exc:
                failed += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"attendance#{attendance.attendanceID} job#{attendance.jobID_id} exception={exc}"
                    )
                )

        if execute:
            self.stdout.write(
                self.style.SUCCESS(
                    "Team DAILY flow alignment backfill complete. "
                    f"inspected={inspected}, candidates={candidates}, healed={healed}, "
                    f"settled={settled}, failed={failed}, mode={mode_label}"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    "Team DAILY flow alignment dry-run complete. "
                    f"inspected={inspected}, candidates={candidates}, mode={mode_label}"
                )
            )
