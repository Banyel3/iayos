from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Optional
from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone


CHAT_LOCKED_UNTIL_START_DATE = "CHAT_LOCKED_UNTIL_START_DATE"


@dataclass(frozen=True)
class ChatLockState:
    can_send_message: bool
    can_send_reason: Optional[str]
    chat_locked: bool
    chat_locked_until: Optional[date]
    error_code: Optional[str]


def get_business_local_date() -> date:
    business_tz_name = getattr(settings, "BUSINESS_TIME_ZONE", "Asia/Manila")
    return timezone.now().astimezone(ZoneInfo(business_tz_name)).date()


def get_start_date_chat_lock_state(job) -> ChatLockState:
    if not job:
        return ChatLockState(True, None, False, None, None)

    preferred_start = getattr(job, "preferredStartDate", None)
    if not preferred_start:
        return ChatLockState(True, None, False, None, None)

    business_today = get_business_local_date()
    if business_today >= preferred_start:
        return ChatLockState(True, None, False, preferred_start, None)

    reason = (
        f"Chat is locked until {preferred_start.isoformat()} (Asia/Manila). "
        "Messaging will unlock automatically on the job start date."
    )
    return ChatLockState(
        False,
        reason,
        True,
        preferred_start,
        CHAT_LOCKED_UNTIL_START_DATE,
    )


def ensure_start_date_lock_system_messages(conversation, job=None) -> None:
    from .models import Message

    job_ref = job or getattr(conversation, "relatedJobPosting", None)
    if not job_ref:
        return

    preferred_start = getattr(job_ref, "preferredStartDate", None)
    if not preferred_start:
        return

    lock_state = get_start_date_chat_lock_state(job_ref)
    has_lock_message = Message.objects.filter(
        conversationID=conversation,
        messageType=Message.MessageType.SYSTEM,
        messageText__startswith="Chat is locked until",
    ).exists()

    if lock_state.chat_locked:
        if not has_lock_message:
            Message.create_system_message(
                conversation,
                (
                    "Chat is locked until "
                    f"{preferred_start.isoformat()} (Asia/Manila). "
                    "Messaging will unlock automatically on the job start date."
                ),
            )
        return

    has_unlock_message = Message.objects.filter(
        conversationID=conversation,
        messageType=Message.MessageType.SYSTEM,
        messageText__startswith="Chat is now unlocked as of",
    ).exists()

    if has_lock_message and not has_unlock_message:
        Message.create_system_message(
            conversation,
            (
                "Chat is now unlocked as of "
                f"{preferred_start.isoformat()} (Asia/Manila). "
                "You can now coordinate work here."
            ),
        )
