import re
from datetime import datetime
from typing import Optional, Tuple


def normalise_module_code(value: Optional[str]) -> str:
    return "".join((value or "").split()).upper()


def normalise_header(value: Optional[str]) -> str:
    return " ".join((value or "").split())


def parse_time_range(value: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    if not value:
        return None, None

    hour = r"(?:[01]?\d|2[0-3])"
    minute = r"[0-5]\d"
    time = rf"{hour}:{minute}"
    time_boundary = r"(?<!\d)"
    time_end_boundary = r"(?!\d)"
    time_range = rf"{time_boundary}({time})\s*-\s*({time}){time_end_boundary}"
    single_time = rf"{time_boundary}({time}){time_end_boundary}"

    match = re.search(time_range, value)
    if match:
        return match.group(1), match.group(2)

    match = re.search(single_time, value)
    if not match:
        return None, None

    start = match.group(1)
    hour, minute = map(int, start.split(":"))
    return start, f"{(hour + 3) % 24:02d}:{minute:02d}"


def parse_academic_date(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    cleaned = normalise_header(value).title()
    for fmt in ("%d %b %Y", "%d %B %Y"):
        try:
            return datetime.strptime(cleaned, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return None


def compact_source_part(value: Optional[str]) -> str:
    return "".join((value or "").split()).lower()
