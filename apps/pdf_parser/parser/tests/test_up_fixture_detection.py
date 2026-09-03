from .conftest import parse_fixture


ACTUAL_UP_FIXTURES = [
    {"filename": "LECTURES_S1.pdf", "expected_type": "lecture", "expected_events": 15},
    {"filename": "LECTURES_S2.pdf", "expected_type": "lecture", "expected_events": 16},
    {"filename": "LECTURES_BOTH.pdf", "expected_type": "lecture", "expected_events": 29},
    {"filename": "SEM_TESTS_S1.pdf", "expected_type": "test", "expected_events": 6},
    {"filename": "SEM_TESTS_S2.pdf", "expected_type": "test", "expected_events": 5},
    {"filename": "SEM_TESTS_BOTH.pdf", "expected_type": "test", "expected_events": 13},
    {"filename": "EXAMS_S1.pdf", "expected_type": "exam", "expected_events": 3},
    {"filename": "EXAMS_S2.pdf", "expected_type": "exam", "expected_events": 3},
    {"filename": "EXAMS_BOTH.pdf", "expected_type": "exam", "expected_events": 6},
]


def test_up_fixtures_detect_schedule_type_and_event_count(up_parser):
    for fixture in ACTUAL_UP_FIXTURES:
        result = parse_fixture(up_parser, fixture["filename"])
        event_types = set()
        for event in result["events"]:
            event_types.add(event["activityType"])

        if fixture["expected_type"] == "lecture":
            assert event_types <= {"lecture", "tutorial", "prac"}
        else:
            assert event_types == {fixture["expected_type"]}

        assert len(result["events"]) == fixture["expected_events"]
        assert result.keys() == {"modules", "events", "warnings"}


def test_actual_up_pdf_fixtures_parse_to_non_empty_contract(up_parser):
    for fixture in ACTUAL_UP_FIXTURES:
        result = parse_fixture(up_parser, fixture["filename"])

        assert result["modules"]
        assert result["events"]
        assert result["warnings"] == []
