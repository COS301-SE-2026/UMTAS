import json
import subprocess
import sys

import pytest

from .conftest import FIXTURE_DIR, ROOT


def run_cli(*args):
    return subprocess.run(
        [sys.executable, "-m", "parser_cli", *args],
        cwd=ROOT,
        text=True,
        capture_output=True,
        timeout=30,
    )


def parse_stdout_json(result):
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        pytest.fail(
            f"stdout was not exactly one JSON object: {result.stdout!r}; {exc}"
        )


def test_parser_cli_emits_normalised_lecture_candidates():
    result = run_cli("--adapter", "up", "--file", str(FIXTURE_DIR / "LECTURES_BOTH.pdf"))

    assert result.returncode == 0, result.stderr
    payload = parse_stdout_json(result)
    assert payload.keys() == {"modules", "events", "warnings"}
    assert payload["warnings"] == []

    module_codes = {module["code"] for module in payload["modules"]}
    assert module_codes == {
        "COS301",
        "COS314",
        "COS326",
        "COS330",
        "COS332",
        "COS333",
        "COS341",
        "STK353",
    }
    assert all(module["name"] is None for module in payload["modules"])
    assert all(module["metadata"]["campus"] == "HATFIELD" for module in payload["modules"])
    assert all(module["warnings"] == [] for module in payload["modules"])
    modules_by_code = {module["code"]: module for module in payload["modules"]}
    assert modules_by_code["COS314"]["metadata"]["semester"] == "SEMESTER_1"
    assert modules_by_code["COS326"]["metadata"]["semester"] == "SEMESTER_2"
    assert modules_by_code["COS301"]["metadata"]["semester"] == "YEAR"

    cos301_p2 = next(
        event
        for event in payload["events"]
        if event["moduleCode"] == "COS301"
        and event["activityType"] == "prac"
        and event["activityCode"] == "P2"
        and event["day"] == "Friday"
        and event["startTime"] == "07:30"
    )
    assert cos301_p2 == {
        "moduleCode": "COS301",
        "activityType": "prac",
        "activityCode": "P2",
        "title": "COS301 P2",
        "day": "Friday",
        "date": None,
        "startTime": "07:30",
        "endTime": "08:20",
        "venues": ["Informatorium Blue Lab 1", "Informatorium Blue Lab 2"],
        "isRecurring": True,
        "metadata": {
            "group": "G01",
            "semester": "S1",
            "language": "E",
            "campus": "HATFIELD",
        },
        "warnings": [],
    }


def test_parser_cli_emits_normalised_semester_test_candidates():
    result = run_cli("--adapter", "up", "--file", str(FIXTURE_DIR / "SEM_TESTS_BOTH.pdf"))

    assert result.returncode == 0, result.stderr
    payload = parse_stdout_json(result)
    assert payload.keys() == {"modules", "events", "warnings"}

    cos333_test1 = next(
        event
        for event in payload["events"]
        if event["moduleCode"] == "COS333" and event["activityCode"] == "Test1"
    )
    assert cos333_test1["activityType"] == "test"
    assert cos333_test1["day"] is None
    assert cos333_test1["date"] == "2026-03-17"
    assert cos333_test1["startTime"] == "12:30"
    assert cos333_test1["endTime"] == "14:00"
    assert cos333_test1["title"] == "COS333 Semester Test 1"
    assert cos333_test1["isRecurring"] is False
    assert cos333_test1["venues"] == [
        "IT Open Bronze Lab",
        "IT Open Copper Lab",
        "IT Open Gold Lab",
        "IT Open Silver Lab",
        "Informatorium Brown Lab",
        "Informatorium Grey Lab",
        "Informatorium Maroon Lab",
    ]


def test_parser_cli_emits_exam_times_and_missing_venue_warnings():
    result = run_cli("--adapter", "up", "--file", str(FIXTURE_DIR / "EXAMS_BOTH.pdf"))

    assert result.returncode == 0, result.stderr
    payload = parse_stdout_json(result)
    assert payload.keys() == {"modules", "events", "warnings"}

    cos314 = next(event for event in payload["events"] if event["moduleCode"] == "COS314")
    assert cos314["activityType"] == "exam"
    assert cos314["activityCode"] == "Paper 1"
    assert cos314["title"] == "COS314 Paper 1"
    assert cos314["date"] == "2026-06-05"
    assert cos314["startTime"] == "11:15"
    assert cos314["endTime"] == "14:15"
    assert cos314["venues"] == ["IT Building CBT Labs 1,2,3"]
    assert cos314["metadata"]["status"] == "FINAL"

    cos341 = next(event for event in payload["events"] if event["moduleCode"] == "COS341")
    assert cos341["venues"] == []
    assert cos341["warnings"] == [
        {
            "code": "VENUE_MISSING",
            "message": "Exam venue was not present in the PDF.",
            "details": {},
        }
    ]


def test_parser_cli_rejects_unknown_adapter_with_structured_error():
    result = run_cli("--adapter", "unknown", "--file", str(FIXTURE_DIR / "LECTURES_BOTH.pdf"))

    assert result.returncode != 0
    payload = json.loads(result.stdout or result.stderr)
    assert payload == {
        "code": "UNKNOWN_ADAPTER",
        "message": "No parser adapter is registered for 'unknown'.",
        "details": {"adapterKey": "unknown"},
    }
