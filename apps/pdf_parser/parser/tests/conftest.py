from pathlib import Path

import pytest

from parser import UPPDFParser


ROOT = Path(__file__).resolve().parents[2]
FIXTURE_DIR = ROOT / "up_test_pdfs"


@pytest.fixture(scope="module")
def up_parser():
    return UPPDFParser()


def parse_fixture(parser, filename):
    return parser.parse(str(FIXTURE_DIR / filename))


def find_event(events, module_code, activity_code):
    for event in events:
        if event["moduleCode"] == module_code and event["activityCode"] == activity_code:
            return event
    raise AssertionError(f"Could not find event {module_code} {activity_code}")
