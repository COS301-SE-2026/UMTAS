from collections import Counter
import json

import pytest

from .conftest import (
    FIXTURE_DIR,
    SUPPORTED_FIXTURES,
    load_ground_truth,
    parse_fixture,
)


def canonical_record(record):
    return json.dumps(record, sort_keys=True, separators=(",", ":"))


def record_facts(result):
    return Counter(
        (collection, canonical_record(record))
        for collection in ("modules", "events", "warnings")
        for record in result[collection]
    )


def leaf_facts(value, path=()):
    if isinstance(value, dict):
        for key, child in value.items():
            yield from leaf_facts(child, (*path, key))
    elif isinstance(value, list):
        if not value:
            yield (*path, "[]"), "[]"
        for index, child in enumerate(value):
            yield from leaf_facts(child, (*path, str(index)))
    else:
        yield path, canonical_record(value)


def field_metrics(expected, actual):
    expected_fields = Counter(leaf_facts(expected))
    actual_fields = Counter(leaf_facts(actual))
    matched = sum((expected_fields & actual_fields).values())
    precision = matched / sum(actual_fields.values())
    recall = matched / sum(expected_fields.values())
    return precision, recall, expected_fields - actual_fields, actual_fields - expected_fields


def test_ground_truth_covers_every_supported_acceptance_fixture():
    ground_truth = load_ground_truth()

    assert ground_truth["schemaVersion"] == 1
    assert ground_truth["review"]["requirement"] == "NFR-Corr-1"
    assert ground_truth["review"]["reviewedOn"]
    assert set(ground_truth["fixtures"]) == set(SUPPORTED_FIXTURES)
    assert all((FIXTURE_DIR / filename).is_file() for filename in SUPPORTED_FIXTURES)


@pytest.mark.parametrize("filename", SUPPORTED_FIXTURES)
def test_supported_fixture_has_perfect_field_precision_and_recall(up_parser, filename):
    expected = load_ground_truth()["fixtures"][filename]
    actual = parse_fixture(up_parser, filename)

    expected_records = record_facts(expected)
    actual_records = record_facts(actual)
    omitted_records = expected_records - actual_records
    invented_records = actual_records - expected_records
    precision, recall, omitted_fields, invented_fields = field_metrics(expected, actual)

    assert not omitted_records, f"{filename} omitted records: {list(omitted_records.elements())}"
    assert not invented_records, f"{filename} invented records: {list(invented_records.elements())}"
    assert not omitted_fields, f"{filename} omitted or changed fields: {omitted_fields}"
    assert not invented_fields, f"{filename} invented or changed fields: {invented_fields}"
    assert precision == 1.0, f"{filename} field precision was {precision:.6f}"
    assert recall == 1.0, f"{filename} field recall was {recall:.6f}"
    assert actual == expected
