from __future__ import annotations

from dataclasses import dataclass
from typing import ClassVar

from ..models import ParserError
from .up_values import clean_cell, clean_lines, module_code, parse_time_range


LECTURE_COLUMNS = [
    "Module",
    "Offered",
    "Group",
    "Lang",
    "Activity",
    "Day",
    "Time",
    "Venue",
    "Campus",
    "Study Prog",
]


@dataclass
class LectureRow:
    FIELD_COLUMNS: ClassVar[list[tuple[str, str]]] = [
        ("module", "Module"),
        ("offered", "Offered"),
        ("group", "Group"),
        ("lang", "Lang"),
        ("activity", "Activity"),
        ("day", "Day"),
        ("time", "Time"),
        ("venue", "Venue"),
        ("campus", "Campus"),
        ("study_prog", "Study Prog"),
    ]
    MULTILINE_FIELDS: ClassVar[list[str]] = ["activity", "day", "time", "venue"]

    module: str
    offered: str
    group: str
    lang: str
    activity: str
    day: str
    time: str
    venue: str
    campus: str
    study_prog: str


def extract_lecture_rows(parser, doc, schedule_type) -> list[LectureRow]:
    table_rows = parser._extract_table_rows(doc, schedule_type)
    return parser._parse_structured_rows(table_rows, schedule_type, LectureRow)


def parse_lectures(parser, doc, schedule_type) -> list[dict]:
    rows = extract_lecture_rows(parser, doc, schedule_type)
    return lecture_rows_to_events(parser, rows)


def lecture_rows_to_events(parser, rows: list[LectureRow]) -> list[dict]:
    grouped: dict[tuple, dict] = {}
    for row in rows:
        module = module_code(row.module)
        activities = clean_lines(row.activity)
        days = clean_lines(row.day)
        times = clean_lines(row.time)
        venues = clean_lines(row.venue)
        if not activities:
            raise ParserError("UNRECOGNIZED_FORMAT", "Lecture row did not contain an activity.", {"module": row.module})
        if not (len(activities) == len(days) == len(times) == len(venues)):
            raise ParserError(
                "UNRECOGNIZED_FORMAT",
                "Lecture multiline fields did not have matching line counts.",
                {"module": row.module},
            )

        for index, activity in enumerate(activities):
            start_time, end_time = parse_time_range(times[index])
            event_type = lecture_type(activity)
            section_label = activity
            metadata = {
                "group": clean_cell(row.group),
                "semester": clean_cell(row.offered),
                "language": clean_cell(row.lang),
                "campus": clean_cell(row.campus),
            }
            key = (
                module,
                event_type,
                section_label,
                days[index],
                start_time,
                end_time,
                tuple(metadata.items()),
            )
            if key not in grouped:
                grouped[key] = parser._event(
                    module_code_value=module,
                    event_type=event_type,
                    section_label=section_label,
                    title=f"{module} {section_label}",
                    day=days[index],
                    date=None,
                    start_time=start_time,
                    end_time=end_time,
                    venues=[],
                    is_recurring=True,
                    metadata=metadata,
                )
            parser._append_unique(grouped[key]["venues"], venues[index])
    return list(grouped.values())

def lecture_type(activity: str) -> str:
    first = clean_cell(activity)[:1].upper()
    if first == "T":
        return "tutorial"
    if first == "P":
        return "prac"
    return "lecture"
