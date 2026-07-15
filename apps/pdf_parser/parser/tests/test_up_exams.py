from collections import Counter

from parser.adapters.up_exams import normalise_exam_row

from .conftest import parse_fixture


def test_exam_fixture_preserves_final_and_preliminary_rows(up_parser):
    events = parse_fixture(up_parser, "EXAMS_BOTH.pdf")["events"]

    assert Counter(event["metadata"]["status"] for event in events) == {"FINAL": 3, "PRELIM": 3}
    assert [event["moduleCode"] for event in events] == ["COS314", "COS332", "COS333", "COS341", "COS326", "COS330"]
    assert events[0]["venues"] == ["IT Building CBT Labs 1,2,3"]
    assert events[1]["venues"] == ["Large Chemistry hall"]
    assert events[2]["venues"] == ["Informatorium Brown lab"]
    assert all(event["venues"] == [] for event in events[3:])
    assert events[3]["warnings"] == [
        {
            "code": "VENUE_MISSING",
            "message": "Exam venue was not present in the PDF.",
            "details": {},
        }
    ]
    assert all(event["isRecurring"] is False for event in events)
    assert all(event["title"] == f"{event['moduleCode']} Paper 1" for event in events)


def test_processor_accepts_exam_header_with_double_spaced_start_time(up_parser):
    event = normalise_exam_row(
        up_parser,
        {
            "Module": "COS 314",
            "Paper": "1",
            "Activity": "Exam Written",
            "Date": "05 JUN 2026",
            "Start  Time": "11:15",
            "Venue": "IT Building CBT Labs 1,2,3",
        }
    )

    assert event["startTime"] == "11:15"
    assert event["endTime"] == "14:15"
