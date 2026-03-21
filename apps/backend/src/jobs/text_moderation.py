import re
from typing import Any


LEET_MAP = {
    "a": "a4@",
    "b": "b8",
    "e": "e3",
    "g": "g9",
    "i": "i1!|",
    "l": "l1|",
    "o": "o0",
    "s": "s5$",
    "t": "t7+",
    "u": "u",
    "z": "z2",
}

BAD_WORDS = [
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "bastard",
    "putangina",
    "gago",
    "tanga",
    "ulol",
    "tarantado",
    "bobo",
    "hindot",
]


def _build_obfuscated_pattern(word: str) -> re.Pattern[str]:
    pieces = []
    for ch in word.lower():
        chars = LEET_MAP.get(ch, ch)
        pieces.append(f"[{re.escape(chars)}]")
    separator = r"(?:[\s\W_]{0,3})"
    pattern = r"(?<![A-Za-z0-9])" + separator.join(pieces) + r"(?![A-Za-z0-9])"
    return re.compile(pattern, re.IGNORECASE)


BAD_WORD_PATTERNS = {word: _build_obfuscated_pattern(word) for word in BAD_WORDS}


def _scan_text(text: str) -> list[dict[str, Any]]:
    if not text:
        return []

    matches: list[dict[str, Any]] = []
    seen_spans: set[tuple[int, int]] = set()

    for pattern in BAD_WORD_PATTERNS.values():
        for match in pattern.finditer(text):
            span = (match.start(), match.end())
            if span in seen_spans:
                continue
            seen_spans.add(span)
            matches.append({"start": match.start(), "end": match.end()})

    matches.sort(key=lambda item: (item["start"], item["end"]))
    return matches


def validate_job_post_content(
    title: str,
    description: str,
    location: str,
    skill_slots: list[Any] | None = None,
) -> dict[str, dict[str, Any]]:
    field_errors: dict[str, dict[str, Any]] = {}

    title_matches = _scan_text(title)
    if title_matches:
        field_errors["title"] = {
            "message": "Title contains inappropriate language. Please revise.",
            "matches": title_matches,
        }

    description_matches = _scan_text(description)
    if description_matches:
        field_errors["description"] = {
            "message": "Description contains inappropriate language. Please revise.",
            "matches": description_matches,
        }

    location_matches = _scan_text(location)
    if location_matches:
        field_errors["location"] = {
            "message": "Location contains inappropriate language. Please revise.",
            "matches": location_matches,
        }

    for index, slot in enumerate(skill_slots or []):
        note = ""
        if isinstance(slot, dict):
            note = str(slot.get("notes") or "")
        else:
            note = str(getattr(slot, "notes", "") or "")

        note_matches = _scan_text(note)
        if note_matches:
            field_key = f"skill_slots[{index}].notes"
            field_errors[field_key] = {
                "message": "Skill slot note contains inappropriate language. Please revise.",
                "matches": note_matches,
            }

    return field_errors
