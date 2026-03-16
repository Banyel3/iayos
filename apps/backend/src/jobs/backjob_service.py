from __future__ import annotations

from typing import Any

from django.conf import settings
from django.utils import timezone


def _all_assigned_agency_employees_dispatched_for_cycle(job, dispute) -> bool:
    """Require assigned agency employees to be dispatched for this backjob cycle."""
    from accounts.models import JobEmployeeAssignment

    assignments = JobEmployeeAssignment.objects.filter(
        job=job,
        status__in=["ASSIGNED", "IN_PROGRESS"],
    )

    if not assignments.exists():
        return True

    backjob_cycle_start = getattr(dispute, "workerScheduleConfirmedAt", None)

    for assignment in assignments:
        is_dispatched = bool(getattr(assignment, "dispatched", False))
        if not is_dispatched:
            return False

        if not backjob_cycle_start:
            continue

        dispatched_at = getattr(assignment, "dispatchedAt", None)
        if dispatched_at and dispatched_at >= backjob_cycle_start:
            continue

        has_legacy_progress_signal = (
            getattr(assignment, "status", None) == "IN_PROGRESS"
            or bool(getattr(assignment, "clientConfirmedArrival", False))
        )
        if not has_legacy_progress_signal:
            return False

    return True


def get_business_local_date() -> Any:
    """Return business-local date used for backjob schedule checks."""
    from zoneinfo import ZoneInfo

    business_tz_name = getattr(settings, "BUSINESS_TIME_ZONE", "Asia/Manila")
    return timezone.now().astimezone(ZoneInfo(business_tz_name)).date()


def auto_start_agency_backjob_if_ready(job, dispute, reason: str = "") -> bool:
    """
    Backward-compatible self-heal for active agency backjobs.

    When schedule is confirmed and the scheduled date has arrived, agency
    backjobs should be execution-ready without requiring a separate
    client "confirm started" action.
    """
    if not job or not dispute:
        return False

    if not getattr(job, "assignedAgencyFK", None):
        return False

    if getattr(dispute, "backjobStarted", False):
        return False

    if not getattr(dispute, "workerScheduleConfirmed", False):
        return False

    scheduled_date = getattr(dispute, "scheduled_date", None)
    if not scheduled_date:
        return False

    business_today = get_business_local_date()
    if business_today < scheduled_date:
        return False

    if not _all_assigned_agency_employees_dispatched_for_cycle(job, dispute):
        return False

    dispute.backjobStarted = True
    if not getattr(dispute, "backjobStartedAt", None):
        dispute.backjobStartedAt = timezone.now()
    dispute.save(update_fields=["backjobStarted", "backjobStartedAt", "updatedAt"])

    if reason:
        print(
            f"[backjob-self-heal] Auto-started agency backjob dispute={dispute.disputeID} "
            f"job={job.jobID} reason={reason}"
        )

    return True
