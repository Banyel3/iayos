import re


EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PH_PHONE_RE = re.compile(r"\b(\+63|63|0)?9\d{9}\b")


def contains_contact_info(text: str) -> bool:
    if not text:
        return False

    return bool(EMAIL_RE.search(text) or PH_PHONE_RE.search(text))


def censor_contact_info(text: str) -> str:
    """Compatibility helper retained for non-chat call sites."""
    if not text:
        return text

    sanitized = EMAIL_RE.sub("[email hidden]", text)
    sanitized = PH_PHONE_RE.sub("[mobile number hidden]", sanitized)
    return sanitized
