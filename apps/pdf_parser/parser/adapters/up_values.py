from __future__ import annotations

from datetime import datetime, timedelta
import re

from ..models import ParserError


def clean_cell(value) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def clean_lines(value) -> list[str]:
    return [line for line in (clean_cell(line) for line in re.split(r"\r?\n", str(value or ""))) if line]


def module_code(value: str) -> str:
    return re.sub(r"\s+", "", value or "").upper()


def parse_pdf_date(value: str) -> str:
    try:
        return datetime.strptime(clean_cell(value).upper(), "%d %b %Y").strftime("%Y-%m-%d")
    except ValueError as exc:
        raise ParserError("UNRECOGNIZED_FORMAT", "UP timetable date did not match DD MMM YYYY.", {"date": value}) from exc


def parse_time(value: str) -> str:
    try:
        return datetime.strptime(value, "%H:%M").strftime("%H:%M")
    except ValueError as exc:
        raise ParserError("UNRECOGNIZED_FORMAT", "UP timetable time did not match HH:mm.", {"time": value}) from exc


def parse_time_range(value: str, *, default_hours: int | None = None) -> tuple[str, str]:
    parts = [part.strip() for part in clean_cell(value).split(" - ")]
    if len(parts) == 2:
        return parse_time(parts[0]), parse_time(parts[1])
    if len(parts) == 1 and default_hours is not None:
        start = parse_time(parts[0])
        end = (datetime.strptime(start, "%H:%M") + timedelta(hours=default_hours)).strftime("%H:%M")
        return start, end
    raise ParserError("UNRECOGNIZED_FORMAT", "UP timetable time did not match the expected format.", {"time": value})
