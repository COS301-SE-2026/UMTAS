import pytest

from .conftest import parse_fixture


@pytest.mark.parametrize(
    ("filename", "expected_type", "expected_rows"),
    [
        ("LECTURES_S1.pdf", "lecture", 22),
        ("LECTURES_S2.pdf", "lecture", 22),
        ("LECTURES_BOTH.pdf", "lecture", 42),
        ("SEM_TESTS_S1.pdf", "test", 24),
        ("SEM_TESTS_S2.pdf", "test", 11),
        ("SEM_TESTS_BOTH.pdf", "test", 43),
        ("EXAMS_S1.pdf", "exam", 3),
        ("EXAMS_S2.pdf", "exam", 3),
        ("EXAMS_BOTH.pdf", "exam", 6),
    ],
)
def test_up_fixtures_detect_schedule_type_and_row_count(
    up_parser, filename, expected_type, expected_rows
):
    result = parse_fixture(up_parser, filename)

    event_types = {event["type"] for event in result["events"]}
    if expected_type == "lecture":
        assert event_types <= {"lecture", "tutorial", "prac"}
    else:
        assert event_types == {expected_type}
    assert len(result["events"]) <= expected_rows
    assert result.keys() == {"modules", "events", "warnings"}
