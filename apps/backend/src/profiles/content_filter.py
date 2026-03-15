import re

# Strict patterns for direct (non-obfuscated) matches
EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PH_PHONE_RE = re.compile(r"\b(\+63|63|0)?9\d{9}\b")

# Phone normalisation: strip whitespace, hyphens, parentheses, dots (common
# in number formatting) so e.g. "0912-345-6789" → "09123456789".
_PHONE_SEP_RE = re.compile(r"[\s.\-_()/]+")

# Email normalisation: strip only whitespace so that characters inserted
# between letters ("j o h n @ g m a i l . c o m") are removed while
# the structurally significant dot and @ characters are preserved.
_EMAIL_SPACE_RE = re.compile(r"\s+")

# Patterns applied to normalised text
_PH_PHONE_NORM_RE = re.compile(r"(?:\+?63|0)?9\d{9}")
_EMAIL_NORM_RE = re.compile(
    r"[A-Za-z0-9._%+-]+"
    r"@"
    r"[A-Za-z0-9.-]+"
    r"\.[A-Za-z]{2,}"
)


def _normalise_phone(text: str) -> str:
    """Strip separators commonly used to format/obfuscate phone numbers."""
    return _PHONE_SEP_RE.sub("", text)


def _normalise_email(text: str) -> str:
    """Strip whitespace inserted between characters to obfuscate emails."""
    return _EMAIL_SPACE_RE.sub("", text)


def contains_contact_info(text: str) -> bool:
    if not text:
        return False

    # Fast path: check original text first
    if EMAIL_RE.search(text) or PH_PHONE_RE.search(text):
        return True

    # Normalised path: catch obfuscated patterns such as
    #   "j o h n @ g m a i l . c o m" or "0912 345 6789" or "0912-345-6789"
    if _PH_PHONE_NORM_RE.search(_normalise_phone(text)):
        return True
    if _EMAIL_NORM_RE.search(_normalise_email(text)):
        return True

    return False


def censor_contact_info(text: str) -> str:
    """Compatibility helper retained for non-chat call sites."""
    if not text:
        return text

    sanitized = EMAIL_RE.sub("[email hidden]", text)
    sanitized = PH_PHONE_RE.sub("[mobile number hidden]", sanitized)
    return sanitized
