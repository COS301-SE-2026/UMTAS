from __future__ import annotations

from dataclasses import dataclass
from typing import ClassVar

from .up_values import clean_cell, clean_lines, module_code, parse_pdf_date, parse_time_range


TEST_COLUMNS = [
    "Module",
    "Test",
    "Day",
    "Date",
    "Time",
    "Campus",
    "Venue",
]


@dataclass
class TestRow:
    FIELD_COLUMNS: ClassVar[list[tuple[str, str]]] = [
        ("module", "Module"),
        ("test", "Test"),
        ("day", "Day"),
        ("date", "Date"),
        ("time", "Time"),
        ("campus", "Campus"),
        ("venue", "Venue"),
    ]
    MULTILINE_FIELDS: ClassVar[list[str]] = ["venue"]

    module: str
    test: str
    day: str
    date: str
    time: str
    campus: str
    venue: str


def extract_test_rows(parser, doc, schedule_type) -> list[TestRow]:
    table_rows = parser._extract_table_rows(doc, schedule_type)
    return parser._parse_structured_rows(table_rows, schedule_type, TestRow)


def parse_tests(parser, doc, schedule_type) -> list[dict]:
    rows = extract_test_rows(parser, doc, schedule_type)
    return test_rows_to_events(parser, rows)


def test_rows_to_events(parser, rows: list[TestRow]) -> list[dict]:
    grouped: dict[tuple[str, str, str, str, str], dict] = {}
    for row in rows:
        module = module_code(row.module)
        date = parse_pdf_date(row.date)
        start_time, end_time = parse_time_range(row.time)
        section_label = clean_cell(row.test)
        key = (module, section_label, date, start_time, end_time)
        if key not in grouped:
            grouped[key] = parser._event(
                module_code_value=module,
                event_type="test",
                section_label=section_label,
                title=f"{module} {section_label}",
                day=clean_cell(row.day),
                date=date,
                start_time=start_time,
                end_time=end_time,
                venues=[],
                is_recurring=False,
                metadata={"campus": clean_cell(row.campus)},
            )
        for venue in clean_lines(row.venue):
            parser._append_unique(grouped[key]["venues"], venue)
    return list(grouped.values())
