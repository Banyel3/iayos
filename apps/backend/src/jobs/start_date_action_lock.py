from typing import Optional, Dict, Any

from jobs.backjob_service import get_business_local_date


ACTIONS_LOCKED_UNTIL_START_DATE = "ACTIONS_LOCKED_UNTIL_START_DATE"


def get_start_date_action_lock_payload(job) -> Optional[Dict[str, Any]]:
    if not job:
        return None

    preferred_start = getattr(job, "preferredStartDate", None)
    if not preferred_start:
        return None

    business_today = get_business_local_date()
    if business_today >= preferred_start:
        return None

    reason = (
        f"Actions are locked until {preferred_start.isoformat()} (Asia/Manila). "
        "Arrival and attendance actions unlock automatically on the job start date."
    )

    return {
        "error": reason,
        "error_code": ACTIONS_LOCKED_UNTIL_START_DATE,
        "can_perform_actions": False,
        "action_lock_reason": reason,
        "action_locked_until": preferred_start.isoformat(),
        "timezone": "Asia/Manila",
    }
