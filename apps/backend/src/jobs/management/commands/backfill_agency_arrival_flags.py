from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import DailyAttendance, JobEmployeeAssignment


class Command(BaseCommand):
    help = (
        "Backfill agency assignment dispatch/arrival flags from attendance signals. "
        "Defaults to dry-run; pass --execute to apply changes."
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
            help="Optional max number of assignments to inspect.",
        )

    def handle(self, *args, **options):
        execute = bool(options.get("execute"))
        limit = int(options.get("limit") or 0)
        mode_label = "EXECUTE" if execute else "DRY-RUN"

        self.stdout.write(
            self.style.WARNING(
                f"Running backfill_agency_arrival_flags in {mode_label} mode"
            )
        )

        qs = (
            JobEmployeeAssignment.objects.select_related("job", "employee")
            .filter(status__in=["ASSIGNED", "IN_PROGRESS", "COMPLETED"])
            .order_by("assignmentID")
        )
        if limit > 0:
            qs = qs[:limit]

        inspected = 0
        candidates = 0
        healed_dispatch = 0
        healed_arrival = 0
        touched_rows = 0

        for assignment in qs:
            inspected += 1
            attendance = (
                DailyAttendance.objects.filter(
                    jobID=assignment.job,
                    employeeID=assignment.employee,
                )
                .order_by("-date", "-attendanceID")
                .first()
            )

            if not attendance:
                continue

            attendance_status = str(getattr(attendance, "status", "") or "")
            dispatch_signal = bool(
                getattr(attendance, "worker_confirmed", False)
                or getattr(attendance, "worker_confirmed_at", None)
                or getattr(attendance, "time_in", None)
                or getattr(attendance, "time_out", None)
                or getattr(attendance, "client_confirmed", False)
                or attendance_status in ["DISPATCHED", "PENDING", "PRESENT", "HALF_DAY"]
            )
            arrival_signal = bool(
                getattr(attendance, "client_confirmed", False)
                or getattr(attendance, "client_confirmed_at", None)
                or getattr(attendance, "time_in", None)
                or getattr(attendance, "time_out", None)
            )

            update_fields = []

            if dispatch_signal and not bool(getattr(assignment, "dispatched", False)):
                assignment.dispatched = True
                assignment.dispatchedAt = (
                    assignment.dispatchedAt
                    or getattr(attendance, "worker_confirmed_at", None)
                    or getattr(attendance, "time_in", None)
                )
                update_fields.extend(["dispatched", "dispatchedAt"])

            if arrival_signal and not bool(getattr(assignment, "clientConfirmedArrival", False)):
                assignment.clientConfirmedArrival = True
                assignment.clientConfirmedArrivalAt = (
                    assignment.clientConfirmedArrivalAt
                    or getattr(attendance, "client_confirmed_at", None)
                    or getattr(attendance, "time_in", None)
                    or getattr(attendance, "time_out", None)
                )
                update_fields.extend(["clientConfirmedArrival", "clientConfirmedArrivalAt"])
                if assignment.status == "ASSIGNED":
                    assignment.status = "IN_PROGRESS"
                    update_fields.append("status")

            if not update_fields:
                continue

            candidates += 1
            healed_dispatch += int("dispatched" in update_fields)
            healed_arrival += int("clientConfirmedArrival" in update_fields)

            if execute:
                with transaction.atomic():
                    if "updatedAt" not in update_fields:
                        update_fields.append("updatedAt")
                    assignment.save(update_fields=list(dict.fromkeys(update_fields)))
                    touched_rows += 1
            else:
                self.stdout.write(
                    (
                        f"assignment#{assignment.assignmentID} job#{assignment.job_id} "
                        f"employee#{assignment.employee_id} would-heal={','.join(update_fields)}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                "Agency arrival flag backfill complete. "
                f"inspected={inspected}, candidates={candidates}, "
                f"healed_dispatch={healed_dispatch}, healed_arrival={healed_arrival}, "
                f"updated_rows={touched_rows}, mode={mode_label}"
            )
        )
