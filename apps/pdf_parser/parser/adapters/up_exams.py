from __future__ import annotations

from dataclasses import dataclass
from typing import ClassVar

from .up_values import clean_cell, module_code, parse_pdf_date, parse_time_range


EXAM_COLUMNS = [
    "Status",
    "Module",
    "Paper",
    "Activity",
    "Date",
    "Start Time",
    "Module Campus",
    "Exam Campus",
    "Venue",
    "Exam Comments",
]


@dataclass
class ExamRow:
    FIELD_COLUMNS: ClassVar[list[tuple[str, str]]] = [
        ("status", "Status"),
        ("module", "Module"),
        ("paper", "Paper"),
        ("activity", "Activity"),
        ("date", "Date"),
        ("start_time", "Start Time"),
        ("module_campus", "Module Campus"),
        ("exam_campus", "Exam Campus"),
        ("venue", "Venue"),
        ("exam_comments", "Exam Comments"),
    ]
    MULTILINE_FIELDS: ClassVar[list[str]] = []

    status: str
    module: str
    paper: str
    activity: str
    date: str
    start_time: str
    module_campus: str
    exam_campus: str
    venue: str
    exam_comments: str


def extract_exam_rows(parser, doc, schedule_type) -> list[ExamRow]:
    table_rows = parser._extract_table_rows(doc, schedule_type)
    return parser._parse_structured_rows(table_rows, schedule_type, ExamRow)


def parse_exams(parser, doc, schedule_type) -> list[dict]:
    rows = extract_exam_rows(parser, doc, schedule_type)
    return exam_rows_to_events(parser, rows)


def exam_rows_to_events(parser, rows: list[ExamRow]) -> list[dict]:
    events = []
    for row in rows:
        events.append(
            normalise_exam_row(
                parser,
                {
                    "Status": row.status,
                    "Module": row.module,
                    "Paper": row.paper,
                    "Activity": row.activity,
                    "Date": row.date,
                    "Start Time": row.start_time,
                    "Module Campus": row.module_campus,
                    "Exam Campus": row.exam_campus,
                    "Venue": row.venue,
                    "Exam Comments": row.exam_comments,
                },
            )
        )
    return events


def normalise_exam_row(parser, row: dict[str, str]) -> dict:
    module = module_code(row.get("Module", ""))
    paper = clean_cell(row.get("Paper", "")) or "1"
    section_label = f"Paper {paper}"
    date = parse_pdf_date(row.get("Date", ""))
    start_value = row.get("Start Time") or row.get("Start  Time") or ""
    start_time, end_time = parse_time_range(start_value, default_hours=3)
    venue = clean_cell(row.get("Venue", ""))
    warnings = []
    if not venue:
        warnings.append(
            {
                "code": "VENUE_MISSING",
                "message": "Exam venue was not present in the PDF.",
                "details": {},
            }
        )
    return parser._event(
        module_code_value=module,
        event_type="exam",
        section_label=section_label,
        title=f"{module} {section_label}",
        day=None,
        date=date,
        start_time=start_time,
        end_time=end_time,
        venues=[venue] if venue else [],
        is_recurring=False,
        metadata={
            "status": clean_cell(row.get("Status", "")),
            "moduleCampus": clean_cell(row.get("Module Campus", "")),
            "examCampus": clean_cell(row.get("Exam Campus", "")),
        },
        warnings=warnings,
    )
