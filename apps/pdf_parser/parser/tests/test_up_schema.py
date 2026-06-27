from types import SimpleNamespace

import pytest

from parser.adapters.up_parser import (
    SCHEDULE_COLUMNS,
    ScheduleType,
)
from parser.adapters.up_exams import EXAM_COLUMNS
from parser.adapters.up_lectures import LECTURE_COLUMNS, LectureRow, lecture_rows_to_events
from parser.adapters.up_tests import TEST_COLUMNS
from parser.adapters.up_tests import TestRow as UPTestRow
from parser.models import ParserError


class _FakePage:
    rect = SimpleNamespace(width=100)

    def __init__(self, tables, text):
        self._tables = tables
        self._text = text

    def find_tables(self):
        return SimpleNamespace(tables=self._tables)

    def get_text(self, _kind, clip=None):
        return self._text


class _FakeDoc:
    def __init__(self, page):
        self._page = page

    def __getitem__(self, index):
        assert index == 0
        return self._page


def _fake_doc_with_pre_table_text(text):
    table = SimpleNamespace(bbox=(0, 50, 100, 100))
    return _FakeDoc(_FakePage([table], text))


def test_up_schedule_types_have_exact_expected_columns():
    assert SCHEDULE_COLUMNS == {
        ScheduleType.EXAM: [
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
        ],
        ScheduleType.LECTURE: [
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
        ],
        ScheduleType.TEST: [
            "Module",
            "Test",
            "Day",
            "Date",
            "Time",
            "Campus",
            "Venue",
        ],
    }
    assert SCHEDULE_COLUMNS[ScheduleType.EXAM] is EXAM_COLUMNS
    assert SCHEDULE_COLUMNS[ScheduleType.LECTURE] is LECTURE_COLUMNS
    assert SCHEDULE_COLUMNS[ScheduleType.TEST] is TEST_COLUMNS


@pytest.mark.parametrize(
    ("title", "schedule_type"),
    [
        ("Lectures", ScheduleType.LECTURE),
        ("Semester Tests", ScheduleType.TEST),
        ("Exams", ScheduleType.EXAM),
    ],
)
def test_schedule_type_is_detected_from_text_before_first_table(up_parser, title, schedule_type):
    assert up_parser.find_schedule_type(_fake_doc_with_pre_table_text(title)) == schedule_type


def test_missing_first_table_fails_clearly(up_parser):
    with pytest.raises(ParserError) as exc_info:
        up_parser.find_schedule_type(_FakeDoc(_FakePage([], "Lectures")))

    assert exc_info.value.code == "UNRECOGNIZED_FORMAT"
    assert "table" in exc_info.value.message


def test_missing_pre_table_schedule_text_fails_clearly(up_parser):
    with pytest.raises(ParserError) as exc_info:
        up_parser.find_schedule_type(_fake_doc_with_pre_table_text(""))

    assert exc_info.value.code == "UNRECOGNIZED_FORMAT"
    assert "schedule text before the first table" in exc_info.value.message


def test_later_page_first_row_is_content_not_header(up_parser):
    rows = up_parser._parse_structured_rows(
        [
            [
                LECTURE_COLUMNS,
                ["COS 301", "S1", "G01", "E", "L1", "Monday", "07:30 - 08:20", "Room 1", "HATFIELD", ""],
            ],
            [
                ["", "", "", "", "L2", "Wednesday", "15:30 - 16:20", "Room 2", "", ""],
            ],
        ],
        ScheduleType.LECTURE,
        LectureRow,
    )

    assert len(rows) == 1
    assert rows[0].module == "COS 301"
    assert rows[0].lang == "E"
    assert rows[0].campus == "HATFIELD"
    assert rows[0].activity == "L1\nL2"
    assert rows[0].day == "Monday\nWednesday"
    assert rows[0].time == "07:30 - 08:20\n15:30 - 16:20"
    assert rows[0].venue == "Room 1\nRoom 2"

    split_rows = up_parser._split_structured_rows(rows)
    assert [row["Activity"] for row in split_rows] == ["L1", "L2"]
    assert split_rows[1]["Venue"] == "Room 2"


def test_lecture_multiline_row_produces_multiple_events(up_parser):
    events = lecture_rows_to_events(
        up_parser,
        [
            LectureRow(
                module="COS 301",
                offered="S1",
                group="G01",
                lang="E",
                activity="L1\nL2",
                day="Monday\nWednesday",
                time="07:30 - 08:20\n15:30 - 16:20",
                venue="Room 1\nRoom 2",
                campus="HATFIELD",
                study_prog="",
            )
        ]
    )

    assert [(event["sectionLabel"], event["day"], event["venues"]) for event in events] == [
        ("L1", "Monday", ["Room 1"]),
        ("L2", "Wednesday", ["Room 2"]),
    ]


def test_lecture_event_type_is_extracted_from_section_label(up_parser):
    events = lecture_rows_to_events(
        up_parser,
        [
            LectureRow(
                module="COS 301",
                offered="S1",
                group="G01",
                lang="E",
                activity="L1\nT1\nP1",
                day="Monday\nTuesday\nWednesday",
                time="07:30 - 08:20\n08:30 - 09:20\n09:30 - 10:20",
                venue="Room 1\nRoom 2\nRoom 3",
                campus="HATFIELD",
                study_prog="",
            )
        ],
    )

    assert [(event["sectionLabel"], event["type"]) for event in events] == [
        ("L1", "lecture"),
        ("T1", "tutorial"),
        ("P1", "prac"),
    ]


def test_first_table_header_mismatch_fails_with_expected_and_actual_columns(up_parser):
    actual_columns = LECTURE_COLUMNS.copy()
    actual_columns[3] = "Language"

    with pytest.raises(ParserError) as exc_info:
        up_parser._validate_columns(ScheduleType.LECTURE, LECTURE_COLUMNS, actual_columns)

    error = exc_info.value
    assert error.code == "UNEXPECTED_COLUMNS"
    assert error.details == {
        "scheduleType": "lecture",
        "expectedColumns": LECTURE_COLUMNS,
        "actualColumns": actual_columns,
    }


def test_continuation_row_carries_non_multiline_fields_from_previous_logical_row(up_parser):
    rows = up_parser._parse_structured_rows(
        [
            [
                TEST_COLUMNS,
                ["COS 333", "Test1", "Tuesday", "17 MAR 2026", "12:30 - 14:00", "HATFIELD", "Room 1"],
            ],
            [
                ["", "", "", "", "", "", "Room 2"],
            ],
        ],
        ScheduleType.TEST,
        UPTestRow,
    )

    assert len(rows) == 1
    assert rows[0] == UPTestRow(
        module="COS 333",
        test="Test1",
        day="Tuesday",
        date="17 MAR 2026",
        time="12:30 - 14:00",
        campus="HATFIELD",
        venue="Room 1\nRoom 2",
    )

    assert up_parser._split_structured_rows(rows) == [
        {
            "Module": "COS 333",
            "Test": "Test1",
            "Day": "Tuesday",
            "Date": "17 MAR 2026",
            "Time": "12:30 - 14:00",
            "Campus": "HATFIELD",
            "Venue": "Room 1",
        },
        {
            "Module": "COS 333",
            "Test": "Test1",
            "Day": "Tuesday",
            "Date": "17 MAR 2026",
            "Time": "12:30 - 14:00",
            "Campus": "HATFIELD",
            "Venue": "Room 2",
        },
    ]
