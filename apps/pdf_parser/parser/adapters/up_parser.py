from __future__ import annotations

from dataclasses import asdict, fields
from enum import Enum

import pymupdf as fitz
import pymupdf

from ..base_parser import BasePDFParser
from ..models import ActivityType, EventCandidate, ModuleCandidate, ParseAnnotation, ParserDetails, ParserError, ParserOutput
from .up_exams import EXAM_COLUMNS, parse_exams
from .up_lectures import LECTURE_COLUMNS, parse_lectures
from .up_tests import TEST_COLUMNS, parse_tests
from .up_values import clean_cell, clean_lines


MAX_PAGES = 20


class ScheduleType(Enum):
    LECTURE = "lecture"
    TEST = "test"
    EXAM = "exam"


SCHEDULE_COLUMNS = {
    ScheduleType.EXAM: EXAM_COLUMNS,
    ScheduleType.LECTURE: LECTURE_COLUMNS,
    ScheduleType.TEST: TEST_COLUMNS,
}


def clean_multiline_cell(value) -> str:
    return "\n".join(clean_lines(value))


class UPPDFParser(BasePDFParser):
    def parse(self, file_path: str) -> ParserOutput:
        try:
            doc = pymupdf.open(file_path)
        except Exception as exc:
            raise ParserError("INVALID_PDF", "The uploaded file could not be opened as a PDF.", {}) from exc

        try:
            self._validate_document(doc)
            schedule_type = self.find_schedule_type(doc)
            if schedule_type == ScheduleType.LECTURE:
                events = parse_lectures(self, doc, ScheduleType.LECTURE)
            elif schedule_type == ScheduleType.TEST:
                events = parse_tests(self, doc, ScheduleType.TEST)
            elif schedule_type == ScheduleType.EXAM:
                events = parse_exams(self, doc, ScheduleType.EXAM)
            else:
                raise ParserError("UNRECOGNIZED_FORMAT", "The UP timetable type is not supported.", {})

            modules = self.build_modules(events)
            return self.validate_result({"modules": modules, "events": events, "warnings": []})
        finally:
            doc.close()

    def _validate_document(self, doc: pymupdf.Document) -> None:
        if len(doc) == 0:
            raise ParserError("UNRECOGNIZED_FORMAT", "The uploaded PDF file has no pages.", {})
        if len(doc) > MAX_PAGES:
            raise ParserError(
                "UNRECOGNIZED_FORMAT",
                "The uploaded PDF has more pages than the supported UP timetable limit.",
                {"maxPages": MAX_PAGES, "actualPages": len(doc)},
            )

    def find_schedule_type(self, doc: pymupdf.Document) -> ScheduleType:
        table = self._first_table(doc)
        first_page = doc[0]
        pre_table_rect = pymupdf.Rect(
            0, 0, first_page.rect.width, table.bbox[1]
        )
        title = clean_cell(first_page.get_text("text", clip=pre_table_rect))
        if not title:
            raise ParserError(
                "UNRECOGNIZED_FORMAT",
                "The first UP timetable page did not contain schedule text before the first table.",
                {},
            )
        if title == "Lectures":
            return ScheduleType.LECTURE
        if title == "Semester Tests":
            return ScheduleType.TEST
        if title == "Exams":
            return ScheduleType.EXAM
        raise ParserError(
            "UNRECOGNIZED_FORMAT",
            "The uploaded PDF does not match a supported UP timetable format.",
            {"scheduleText": title},
        )

    def build_modules(self, events: list[EventCandidate]) -> list[ModuleCandidate]:
        events_by_module: dict[str, list[EventCandidate]] = {}
        for event in events:
            code = event["moduleCode"]
            events_by_module.setdefault(code, []).append(event)

        modules: list[ModuleCandidate] = []
        for code, module_events in events_by_module.items():
            campus = next(
                (
                    clean_cell(event.get("metadata", {}).get("campus") or event.get("metadata", {}).get("examCampus") or "")
                    for event in module_events
                    if clean_cell(event.get("metadata", {}).get("campus") or event.get("metadata", {}).get("examCampus") or "")
                ),
                "",
            )
            semester = self._module_semester(module_events)
            metadata: ParserDetails = {}
            if campus:
                metadata["campus"] = campus
            if semester:
                metadata["semester"] = semester
            modules.append(
                {
                    "code": code,
                    "name": None,
                    "metadata": metadata,
                    "warnings": [],
                }
            )
        return modules

    def _module_semester(self, events: list[EventCandidate]) -> str | None:
        offered = {
            clean_cell(event.get("metadata", {}).get("semester") or "").upper()
            for event in events
        }
        offered.discard("")

        if not offered:
            return None
        if offered & {"Y", "YEAR", "YEAR-LONG"} or offered >= {"S1", "S2"}:
            return "YEAR"
        if offered == {"S1"}:
            return "SEMESTER_1"
        if offered == {"S2"}:
            return "SEMESTER_2"
        return "YEAR"

    def _first_table(self, doc: fitz.Document):
        tables = doc[0].find_tables().tables
        if not tables:
            raise ParserError("UNRECOGNIZED_FORMAT", "The first UP timetable page did not contain a table.", {})
        return tables[0]

    def _extract_table_rows(
        self, doc: pymupdf.Document, schedule_type: ScheduleType
    ) -> list[list[list[str]]]:
        expected_columns = SCHEDULE_COLUMNS[schedule_type]
        pages: list[list[list[str]]] = []
        for page_index, page in enumerate(doc):
            page_rows: list[list[str]] = []
            for table_index, table in enumerate(page.find_tables().tables):
                for row_index, row in enumerate(table.rows):
                    is_header = page_index == 0 and table_index == 0 and row_index == 0
                    values = self._read_table_row(page, row.cells, schedule_type, is_header=is_header)
                    if is_header:
                        self._validate_columns(schedule_type, expected_columns, values)
                    else:
                        if len(values) != len(expected_columns):
                            raise ParserError(
                                "UNRECOGNIZED_FORMAT",
                                "A UP timetable row did not match the expected column count.",
                                {
                                    "scheduleType": schedule_type.value,
                                    "expectedColumnCount": len(expected_columns),
                                    "actualColumnCount": len(values),
                                },
                            )
                        page_rows.append(values)
            if page_rows:
                pages.append(page_rows)
        return pages

    def _read_table_row(
        self,
        page: pymupdf.Page,
        cells: list,
        schedule_type: ScheduleType,
        *,
        is_header: bool,
    ) -> list[str]:
        values = []
        for index, cell in enumerate(cells):
            if cell is None:
                values.append("")
                continue
            rect = pymupdf.Rect(cell)
            if not is_header and schedule_type == ScheduleType.LECTURE and index == LECTURE_COLUMNS.index("Lang"):
                rect.x1 -= 20
            text = page.get_text("text", clip=rect)
            values.append(clean_cell(text) if is_header else clean_multiline_cell(text))
        return values

    def _validate_columns(
        self, schedule_type: ScheduleType, expected_columns: list[str], actual_columns: list[str]
    ) -> None:
        actual = [clean_cell(column) for column in actual_columns]
        expected = list(expected_columns)
        if actual != expected:
            raise ParserError(
                "UNEXPECTED_COLUMNS",
                "The first table header did not match the expected UP timetable schema.",
                {
                    "scheduleType": schedule_type.value,
                    "expectedColumns": expected,
                    "actualColumns": actual,
                },
            )

    def _parse_structured_rows(
        self,
        pages: list[list[list[str]]],
        schedule_type: ScheduleType,
        row_type,
    ) -> list:
        expected_columns = SCHEDULE_COLUMNS[schedule_type]
        logical_rows = []
        for page_index, page_rows in enumerate(pages):
            for row_index, raw_row in enumerate(page_rows):
                values = [clean_multiline_cell(value) for value in raw_row]
                if page_index == 0 and row_index == 0 and values == expected_columns:
                    continue
                if len(values) != len(expected_columns):
                    raise ParserError(
                        "UNRECOGNIZED_FORMAT",
                        "A UP timetable row did not match the expected column count.",
                        {"scheduleType": schedule_type.value},
                    )
                row = row_type(*values)
                if not clean_cell(row.module):
                    if not logical_rows:
                        raise ParserError(
                            "UNRECOGNIZED_FORMAT",
                            "A UP timetable continuation row appeared before any module row.",
                            {"scheduleType": schedule_type.value},
                        )
                    self._append_continuation(logical_rows[-1], row)
                else:
                    logical_rows.append(row)
        return logical_rows

    def _append_continuation(self, previous, continuation) -> None:
        for field in fields(previous):
            value = clean_multiline_cell(getattr(continuation, field.name))
            if not value:
                continue
            existing = clean_multiline_cell(getattr(previous, field.name))
            setattr(previous, field.name, f"{existing}\n{value}" if existing else value)

    def _split_structured_rows(self, rows: list) -> list[dict[str, str]]:
        split_rows: list[dict[str, str]] = []
        for row in rows:
            multiline_fields = getattr(row, "MULTILINE_FIELDS", [])
            if multiline_fields:
                split_rows.extend(self._split_row(row, multiline_fields))
            else:
                split_rows.append(self._row_to_column_dict(row))
        return split_rows

    def _split_row(self, row, multiline_fields: list[str]) -> list[dict[str, str]]:
        base = asdict(row)
        field_columns = getattr(row, "FIELD_COLUMNS", [])
        split_values = {name: clean_lines(base[name]) for name in multiline_fields}
        count = max((len(values) for values in split_values.values()), default=1)
        rows = []
        for index in range(count):
            candidate = {}
            for name, value in base.items():
                if name in split_values:
                    values = split_values[name]
                    candidate[name] = values[index] if index < len(values) else ""
                else:
                    candidate[name] = clean_cell(value)
            rows.append(self._field_dict_to_column_dict(candidate, field_columns))
        return rows

    def _row_to_column_dict(self, row) -> dict[str, str]:
        return self._field_dict_to_column_dict(asdict(row), getattr(row, "FIELD_COLUMNS", []))

    def _field_dict_to_column_dict(
        self, values: dict[str, str], field_columns: list[tuple[str, str]]
    ) -> dict[str, str]:
        return {column: values.get(field, "") for field, column in field_columns}

    def _event(
        self,
        *,
        module_code_value: str,
        activity_type: ActivityType,
        activity_code: str,
        title: str,
        day: str | None,
        date: str | None,
        start_time: str,
        end_time: str,
        venues: list[str],
        is_recurring: bool,
        metadata: ParserDetails,
        warnings: list[ParseAnnotation] | None = None,
    ) -> EventCandidate:
        return {
            "moduleCode": module_code_value,
            "activityType": activity_type,
            "activityCode": activity_code,
            "title": title,
            "day": day,
            "date": date,
            "startTime": start_time,
            "endTime": end_time,
            "venues": venues,
            "isRecurring": is_recurring,
            "metadata": metadata,
            "warnings": warnings or [],
        }

    def _append_unique(self, values: list[str], value: str) -> None:
        cleaned = clean_cell(value)
        if cleaned and cleaned not in values:
            values.append(cleaned)
