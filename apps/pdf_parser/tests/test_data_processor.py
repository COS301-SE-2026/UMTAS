from parser.data_processor import process_events


def test_process_events_parses_valid_24_hour_time_ranges():
    [event] = process_events(
        [
            {
                "Module": "COS301",
                "Day": " monday ",
                "Time": "7:30 - 09:20",
                "Venue": "IT 2-26",
            }
        ]
    )

    assert event["Day"] == "Monday"
    assert event["start_time"] == "7:30"
    assert event["end_time"] == "09:20"
    assert event["summary"] == "COS301"
    assert event["isRecurring"] is False
    assert event["location"] == "IT 2-26"


def test_process_events_rejects_invalid_24_hour_times():
    [event] = process_events(
        [
            {
                "Module": "COS301",
                "Time": "25:99 - 30:00",
            }
        ]
    )

    assert "start_time" not in event
    assert "end_time" not in event


def test_process_events_defaults_single_start_time_to_three_hour_event():
    [event] = process_events(
        [
            {
                "Module": "COS301",
                "Start Time": "22:30",
            }
        ]
    )

    assert event["start_time"] == "22:30"
    assert event["end_time"] == "01:30"
