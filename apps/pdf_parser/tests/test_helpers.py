from parser.helpers import (
    compact_source_part,
    normalise_header,
    normalise_module_code,
    parse_academic_date,
    parse_time_range,
)


def test_normalise_module_code_removes_all_whitespace_and_uppercases():
    assert normalise_module_code(" cos 301\n") == "COS301"
    assert normalise_module_code(None) == ""


def test_normalise_header_collapses_internal_whitespace():
    assert normalise_header(" Start   Time\n") == "Start Time"
    assert normalise_header(None) == ""


def test_parse_time_range_validates_24_hour_times():
    assert parse_time_range("7:30 - 09:20") == ("7:30", "09:20")
    assert parse_time_range("22:30") == ("22:30", "01:30")
    assert parse_time_range("25:99 - 30:00") == (None, None)


def test_parse_academic_date_normalises_short_and_long_month_names():
    assert parse_academic_date("05 JUN 2026") == "2026-06-05"
    assert parse_academic_date("05 June 2026") == "2026-06-05"
    assert parse_academic_date("not a date") is None


def test_compact_source_part_removes_whitespace_and_lowercases():
    assert compact_source_part(" Paper 1\n") == "paper1"
    assert compact_source_part(None) == ""
