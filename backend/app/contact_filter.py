"""
Enforces "keep communication in-platform" by rejecting listing text and
messages that look like they contain a phone number or a link/mention of an
external messaging app (WhatsApp, Telegram, etc).

This is a heuristic, not a guarantee — a determined user could still spell
out digits ("oh five three three...") or split characters to dodge it. That
kind of adversarial evasion is a real, unsolved cat-and-mouse problem on
every platform with this policy; this catches the overwhelmingly common
case (someone just pastes their number) without trying to be perfect.
"""
import re

# Real North Cyprus/Turkish phone numbers run 10 digits locally (0533 xxx xx xx)
# or 12-13 with a country code. Rent price mentions in listing text (e.g. a
# Turkish-Lira figure with dot thousands-separators like "18.000.000") can
# reach 8-9 digits, so the threshold is set at 10 to leave headroom above
# realistic price text while still catching real phone numbers.
MIN_PHONE_DIGITS = 10

# Matches runs of digits allowing spaces/dashes/dots/parens as separators —
# e.g. "0533 123 45 67", "+90-533-123-4567", "(0533) 1234567".
_CANDIDATE_RE = re.compile(r"[\d][\d\-.\s()]{5,}\d")

_KEYWORDS = ["whatsapp", "wa.me", "telegram", "t.me/", "viber", "imo.im"]


def _count_digits(s: str) -> int:
    return sum(ch.isdigit() for ch in s)


def find_external_contact_info(text: str) -> str | None:
    """Returns a human-readable reason string if text looks like it contains
    external contact info, or None if it looks clean."""
    if not text:
        return None

    lowered = text.lower()
    for kw in _KEYWORDS:
        if kw in lowered:
            return f"references an external messaging app ('{kw}')"

    for match in _CANDIDATE_RE.finditer(text):
        if _count_digits(match.group()) >= MIN_PHONE_DIGITS:
            return "looks like it contains a phone number"

    return None
