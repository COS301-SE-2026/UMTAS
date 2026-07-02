from collections import Counter

from parser.adapters.up_lectures import activity_code

from .conftest import parse_fixture


def test_lecture_fixture_preserves_multiline_rows_and_metadata(up_parser):
    result = parse_fixture(up_parser, "LECTURES_BOTH.pdf")
    events = result["events"]

    assert Counter(module["code"] for module in result["modules"]) == {
        "COS301": 1,
        "COS314": 1,
        "COS326": 1,
        "COS330": 1,
        "COS332": 1,
        "COS333": 1,
        "COS341": 1,
        "STK353": 1,
    }

    cos301_p2 = [
        event
        for event in events
        if event["moduleCode"] == "COS301"
        and event["sectionLabel"] == "P2"
        and event["day"] == "Friday"
        and event["startTime"] == "07:30"
    ]
    assert len(cos301_p2) == 1
    assert cos301_p2[0]["venues"] == ["Informatorium Blue Lab 1", "Informatorium Blue Lab 2"]
    assert cos301_p2[0]["metadata"] == {"group": "G01", "semester": "S1", "language": "E", "campus": "HATFIELD"}


def test_lecture_processing_normalises_times_days_recurrence_and_locations(up_parser):
    events = parse_fixture(up_parser, "LECTURES_BOTH.pdf")["events"]

    first = events[0]
    assert first["moduleCode"] == "COS301"
    assert first["sectionLabel"] == "P1"
    assert first["title"] == "COS301 P1"
    assert first["startTime"] == "07:30"
    assert first["endTime"] == "09:20"
    assert first["venues"] == ["Informatorium Brown Lab"]

    assert all(event["day"] in {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"} for event in events)
    assert all(event["isRecurring"] is True for event in events)
    assert all(event["startTime"] < event["endTime"] for event in events)


def test_lecture_title_uses_activity_code(up_parser):
    assert activity_code("P2 Practical") == "P2"
