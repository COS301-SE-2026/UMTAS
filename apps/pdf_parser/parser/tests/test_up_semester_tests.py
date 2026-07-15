from collections import Counter

from .conftest import find_event, parse_fixture


def test_semester_test_fixture_preserves_venue_alternatives(up_parser):
    events = parse_fixture(up_parser, "SEM_TESTS_BOTH.pdf")["events"]

    assert Counter(event["activityCode"] for event in events) == {"Test1": 8, "Test2": 5}

    cos333_test1 = find_event(events, "COS333", "Test1")
    assert cos333_test1["venues"] == [
        "IT Open Bronze Lab",
        "IT Open Copper Lab",
        "IT Open Gold Lab",
        "IT Open Silver Lab",
        "Informatorium Brown Lab",
        "Informatorium Grey Lab",
        "Informatorium Maroon Lab",
    ]
    assert cos333_test1["startTime"] == "12:30"
    assert cos333_test1["endTime"] == "14:00"
    assert cos333_test1["isRecurring"] is False
    assert cos333_test1["title"] == "COS333 Semester Test 1"


def test_semester_test_titles_are_numbered_per_module(up_parser):
    events = parse_fixture(up_parser, "SEM_TESTS_BOTH.pdf")["events"]
    cos333_titles = [event["title"] for event in events if event["moduleCode"] == "COS333"]

    assert cos333_titles == ["COS333 Semester Test 1", "COS333 Semester Test 2"]
