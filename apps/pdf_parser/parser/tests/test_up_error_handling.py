import pytest

from parser.adapters.up_lectures import LectureRow, lecture_rows_to_events
from parser.adapters.up_exams import ExamRow
from parser.adapters.up_parser import LECTURE_COLUMNS, MAX_PAGES, ScheduleType
from parser.adapters.up_tests import TestRow as SemesterTestRow
from parser.adapters.up_tests import test_rows_to_events as semester_test_rows_to_events
from parser.adapters.up_values import parse_pdf_date, parse_time, parse_time_range
from parser.models import ParserError, validate_parser_result

from .conftest import parse_fixture


class FakeDocument:
    def __init__(self, page_count):
        self.page_count = page_count

    def __len__(self):
        return self.page_count


class FakeTable:
    bbox = (0, 50, 100, 100)


class FakeRect:
    width = 100


class FakePageWithTitle:
    rect = FakeRect()

    def __init__(self, title):
        self.title = title

    def find_tables(self):
        return FakeTables([FakeTable()])

    def get_text(self, kind, clip=None):
        return self.title


class FakeTables:
    def __init__(self, tables):
        self.tables = tables


def assert_parser_error(error, code):
    assert error.value.code == code


def assert_pdf_fails_with(up_parser, filename, code, message_part):
    with pytest.raises(ParserError) as error:
        parse_fixture(up_parser, filename)

    assert_parser_error(error, code)
    assert message_part in error.value.message


def test_parser_rejects_file_that_is_not_a_pdf(up_parser):
    with pytest.raises(ParserError) as error:
        up_parser.parse("missing-file.pdf")

    assert_parser_error(error, "INVALID_PDF")


def test_parser_rejects_empty_pdf(up_parser):
    document = FakeDocument(0)

    with pytest.raises(ParserError) as error:
        up_parser._validate_document(document)

    assert_parser_error(error, "UNRECOGNIZED_FORMAT")
    assert "no pages" in error.value.message


def test_parser_rejects_pdf_with_too_many_pages(up_parser):
    document = FakeDocument(MAX_PAGES + 1)

    with pytest.raises(ParserError) as error:
        up_parser._validate_document(document)

    assert_parser_error(error, "UNRECOGNIZED_FORMAT")
    assert error.value.details["maxPages"] == MAX_PAGES
    assert error.value.details["actualPages"] == MAX_PAGES + 1


def test_unknown_schedule_title_is_rejected(up_parser):
    fake_page = FakePageWithTitle("Random Report")
    fake_doc = [fake_page]

    with pytest.raises(ParserError) as error:
        up_parser.find_schedule_type(fake_doc)

    assert_parser_error(error, "UNRECOGNIZED_FORMAT")
    assert error.value.details["scheduleText"] == "Random Report"


def test_row_with_wrong_column_count_is_rejected(up_parser):
    rows = [
        [
            LECTURE_COLUMNS,
            ["COS 301", "S1"],
        ]
    ]

    with pytest.raises(ParserError) as error:
        up_parser._parse_structured_rows(rows, ScheduleType.LECTURE, LectureRow)

    assert_parser_error(error, "UNRECOGNIZED_FORMAT")


def test_continuation_row_before_module_is_rejected(up_parser):
    rows = [
        [
            LECTURE_COLUMNS,
            ["", "", "", "", "L1", "Monday", "07:30 - 08:20", "Room 1", "", ""],
        ]
    ]

    with pytest.raises(ParserError) as error:
        up_parser._parse_structured_rows(rows, ScheduleType.LECTURE, LectureRow)

    assert_parser_error(error, "UNRECOGNIZED_FORMAT")
    assert "continuation row" in error.value.message


def test_lecture_row_without_activity_is_rejected(up_parser):
    row = LectureRow(
        module="COS 301",
        offered="S1",
        group="G01",
        lang="E",
        activity="",
        day="Monday",
        time="07:30 - 08:20",
        venue="Room 1",
        campus="HATFIELD",
        study_prog="",
    )

    with pytest.raises(ParserError) as error:
        lecture_rows_to_events(up_parser, [row])

    assert_parser_error(error, "UNRECOGNIZED_FORMAT")
    assert "activity" in error.value.message


def test_lecture_row_with_mismatched_multiline_values_is_rejected(up_parser):
    row = LectureRow(
        module="COS 301",
        offered="S1",
        group="G01",
        lang="E",
        activity="L1\nL2",
        day="Monday",
        time="07:30 - 08:20\n08:30 - 09:20",
        venue="Room 1\nRoom 2",
        campus="HATFIELD",
        study_prog="",
    )

    with pytest.raises(ParserError) as error:
        lecture_rows_to_events(up_parser, [row])

    assert_parser_error(error, "UNRECOGNIZED_FORMAT")
    assert "matching line counts" in error.value.message


def test_invalid_date_and_time_values_are_rejected():
    with pytest.raises(ParserError) as date_error:
        parse_pdf_date("17/03/2026")

    with pytest.raises(ParserError) as time_error:
        parse_time("25:99")

    with pytest.raises(ParserError) as range_error:
        parse_time_range("07:30 until 08:20")

    assert_parser_error(date_error, "UNRECOGNIZED_FORMAT")
    assert_parser_error(time_error, "UNRECOGNIZED_FORMAT")
    assert_parser_error(range_error, "UNRECOGNIZED_FORMAT")


def test_test_rows_use_each_venue_once(up_parser):
    row = SemesterTestRow(
        module="COS 333",
        test="Test1",
        day="Tuesday",
        date="17 MAR 2026",
        time="12:30 - 14:00",
        campus="HATFIELD",
        venue="Room 1\nRoom 1\nRoom 2",
    )

    events = semester_test_rows_to_events(up_parser, [row])

    assert events[0]["venues"] == ["Room 1", "Room 2"]


def test_exam_row_without_multiline_fields_is_split_once(up_parser):
    row = ExamRow(
        status="FINAL",
        module="COS 314",
        paper="1",
        activity="Exam Written",
        date="05 JUN 2026",
        start_time="11:15",
        module_campus="HATFIELD",
        exam_campus="HATFIELD",
        venue="IT Building CBT Labs 1,2,3",
        exam_comments="",
    )

    rows = up_parser._split_structured_rows([row])

    assert rows == [
        {
            "Status": "FINAL",
            "Module": "COS 314",
            "Paper": "1",
            "Activity": "Exam Written",
            "Date": "05 JUN 2026",
            "Start Time": "11:15",
            "Module Campus": "HATFIELD",
            "Exam Campus": "HATFIELD",
            "Venue": "IT Building CBT Labs 1,2,3",
            "Exam Comments": "",
        }
    ]


def test_parser_result_must_only_have_expected_top_level_keys():
    result = {
        "modules": [],
        "events": [],
        "warnings": [],
        "extra": [],
    }

    with pytest.raises(ParserError) as error:
        validate_parser_result(result)

    assert_parser_error(error, "INVALID_PARSER_RESULT")
    assert error.value.details["keys"] == ["events", "extra", "modules", "warnings"]


def test_parser_result_rejects_missing_module_fields():
    result = {
        "modules": [{"code": "COS301"}],
        "events": [],
        "warnings": [],
    }

    with pytest.raises(ParserError) as error:
        validate_parser_result(result)

    assert_parser_error(error, "INVALID_PARSER_RESULT")
    assert error.value.details["missing"] == ["metadata", "warnings"]


def test_parser_result_rejects_bad_event_fields():
    test_cases = [
        {"expected_code": "INVALID_EVENT_TYPE", "changes": {"activityType": "wrong"}},
        {"expected_code": "INVALID_TIME", "changes": {"startTime": "7:30"}},
        {
            "expected_code": "INVALID_DATE",
            "changes": {"activityType": "test", "date": "17 MAR 2026"},
        },
        {
            "expected_code": "INVALID_RECURRING_EVENT",
            "changes": {"isRecurring": True, "day": None},
        },
        {
            "expected_code": "INVALID_VENUES",
            "changes": {"venues": "Room 1"},
        },
    ]

    for test_case in test_cases:
        event = {
            "moduleCode": "COS301",
            "activityType": "lecture",
            "activityCode": "L1",
            "title": "COS301 L1",
                "day": None,
                "date": "2026-03-17",
            "startTime": "07:30",
            "endTime": "08:20",
            "venues": [],
            "isRecurring": False,
            "metadata": {},
            "warnings": [],
        }
        event.update(test_case["changes"])
        result = {"modules": [], "events": [event], "warnings": []}

        with pytest.raises(ParserError) as error:
            validate_parser_result(result)

        assert_parser_error(error, test_case["expected_code"])


def test_pdf_with_empty_lecture_header_column_is_rejected(up_parser):
    assert_pdf_fails_with(
        up_parser,
        "MALFORMED_UP_LECTURES_EMPTY_HEADER_COLUMN.pdf",
        "UNEXPECTED_COLUMNS",
        "first table header",
    )


def test_pdf_with_missing_lecture_header_column_is_rejected(up_parser):
    assert_pdf_fails_with(
        up_parser,
        "MALFORMED_UP_LECTURES_MISSING_HEADER_COLUMN.pdf",
        "UNEXPECTED_COLUMNS",
        "first table header",
    )


def test_pdf_with_wrong_lecture_row_column_count_is_rejected(up_parser):
    assert_pdf_fails_with(
        up_parser,
        "MALFORMED_UP_LECTURES_WRONG_ROW_COLUMN_COUNT.pdf",
        "UNRECOGNIZED_FORMAT",
        "expected column count",
    )


def test_pdf_with_continuation_row_before_module_is_rejected(up_parser):
    assert_pdf_fails_with(
        up_parser,
        "MALFORMED_UP_LECTURES_CONTINUATION_BEFORE_MODULE.pdf",
        "UNRECOGNIZED_FORMAT",
        "continuation row",
    )


def test_pdf_with_empty_lecture_activity_is_rejected(up_parser):
    assert_pdf_fails_with(
        up_parser,
        "MALFORMED_UP_LECTURES_EMPTY_ACTIVITY.pdf",
        "UNRECOGNIZED_FORMAT",
        "activity",
    )


def test_pdf_with_mismatched_lecture_multiline_fields_is_rejected(up_parser):
    assert_pdf_fails_with(
        up_parser,
        "MALFORMED_UP_LECTURES_MISMATCHED_MULTILINE.pdf",
        "UNRECOGNIZED_FORMAT",
        "matching line counts",
    )


def test_pdf_with_invalid_semester_test_date_is_rejected(up_parser):
    assert_pdf_fails_with(
        up_parser,
        "MALFORMED_UP_SEM_TESTS_INVALID_DATE.pdf",
        "UNRECOGNIZED_FORMAT",
        "date did not match",
    )


def test_pdf_with_invalid_semester_test_time_is_rejected(up_parser):
    assert_pdf_fails_with(
        up_parser,
        "MALFORMED_UP_SEM_TESTS_INVALID_TIME.pdf",
        "UNRECOGNIZED_FORMAT",
        "time did not match",
    )


def test_pdf_with_invalid_exam_start_time_is_rejected(up_parser):
    assert_pdf_fails_with(
        up_parser,
        "MALFORMED_UP_EXAMS_INVALID_START_TIME.pdf",
        "UNRECOGNIZED_FORMAT",
        "time did not match",
    )
