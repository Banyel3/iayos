import re
from typing import Match

# Matches email-like strings even when users insert separators between characters,
# e.g. "j o h n @ g m a i l . c o m" or "john,@gmail,com".
EMAIL_OBFUSCATED_RE = re.compile(
    r"""(?ix)
    \b
    (?:[a-z0-9](?:[\s,./\\()_\-]*[a-z0-9]){1,63})
    \s*(?:@|\(at\)|\[at\]|\{at\})\s*
    (?:[a-z0-9](?:[\s,./\\()_\-]*[a-z0-9]){1,63})
    (?:\s*(?:\.|\(dot\)|\[dot\]|\{dot\})\s*(?:[a-z](?:[\s,./\\()_\-]*[a-z]){1,24})){1,3}
    \b
    """
)

# Generic phone candidate matcher with separators. We validate the digits shape
# before redacting to avoid false positives.
PHONE_CANDIDATE_RE = re.compile(r"(?<!\w)(?:\+?\d[\d\s,./\\()_\-]{7,24}\d)(?!\w)")


def _is_valid_mobile_number(candidate: str) -> bool:
    digits = re.sub(r"\D", "", candidate)

    # PH local format: 09XXXXXXXXX (11 digits)
    if len(digits) == 11 and digits.startswith("09"):
        return True

    # PH intl format: 639XXXXXXXXX (12 digits)
    if len(digits) == 12 and digits.startswith("639"):
        return True

    # PH w/o leading 0/country: 9XXXXXXXXX (10 digits)
    if len(digits) == 10 and digits.startswith("9"):
        return True

    return False


def _replace_phone_if_mobile(match: Match[str]) -> str:
    value = match.group(0)
    if _is_valid_mobile_number(value):
        return "[mobile number hidden]"
    return value


def censor_contact_info(text: str) -> str:
    if not text:
        return text

    sanitized = EMAIL_OBFUSCATED_RE.sub("[email hidden]", text)
    sanitized = PHONE_CANDIDATE_RE.sub(_replace_phone_if_mobile, sanitized)
    return sanitized
