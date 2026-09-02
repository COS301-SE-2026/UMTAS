import json
from pathlib import Path

import pytest

from parser import UPPDFParser


ROOT = Path(__file__).resolve().parents[2]
FIXTURE_DIR = ROOT / "up_test_pdfs"
GROUND_TRUTH_PATH = Path(__file__).parent / "ground_truth" / "up_supported_fixtures.json"
SUPPORTED_FIXTURES = (
    "LECTURES_S1.pdf",
    "LECTURES_S2.pdf",
    "LECTURES_BOTH.pdf",
    "SEM_TESTS_S1.pdf",
    "SEM_TESTS_S2.pdf",
    "SEM_TESTS_BOTH.pdf",
    "EXAMS_S1.pdf",
    "EXAMS_S2.pdf",
    "EXAMS_BOTH.pdf",
)


@pytest.fixture(scope="module")
def up_parser():
    return UPPDFParser()


def parse_fixture(parser, filename):
    return parser.parse(str(FIXTURE_DIR / filename))


def load_ground_truth():
    return json.loads(GROUND_TRUTH_PATH.read_text(encoding="utf-8"))


def find_event(events, module_code, activity_code):
    for event in events:
        if event["moduleCode"] == module_code and event["activityCode"] == activity_code:
            return event
    raise AssertionError(f"Could not find event {module_code} {activity_code}")
