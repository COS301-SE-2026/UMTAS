#!/usr/bin/env python3
"""Independently validate the hard constraints of a conflict-free CLI result."""

import argparse
import json
from collections import Counter
from datetime import date
from pathlib import Path


def minute_of_day(value: str) -> int:
    hour, minute = map(int, value.split(":"))
    return hour * 60 + minute


def same_day(left: dict, right: dict) -> bool:
    left_date, right_date = left.get("date"), right.get("date")
    if left_date and right_date:
        return left_date == right_date
    left_day = date.fromisoformat(left_date).strftime("%A").lower() if left_date else left["dayOfWeek"].lower()
    right_day = date.fromisoformat(right_date).strftime("%A").lower() if right_date else right["dayOfWeek"].lower()
    return left_day == right_day


def validate(problem: dict, result: dict) -> None:
    if result["status"] != "feasible" or result["outcome"] != "conflict-free":
        raise ValueError("result is not labelled feasible and conflict-free")

    events = problem["schedulingProblem"]["events"]
    by_id = {event["eventId"]: event for event in events}
    if len(by_id) != len(events):
        raise ValueError("input contains duplicate event IDs")
    selected_ids = result["timetableSolution"]["selectedEventIds"]
    if len(set(selected_ids)) != len(selected_ids) or any(event_id not in by_id for event_id in selected_ids):
        raise ValueError("result contains duplicate or unknown event IDs")

    expected = {}
    for event in events:
        key = (event["moduleCode"], event["activityCode"])
        count = event.get("requiredSelections", 1)
        if key in expected and expected[key] != count:
            raise ValueError(f"inconsistent requirement: {key}")
        expected[key] = count
    selected = [by_id[event_id] for event_id in selected_ids]
    actual = Counter((event["moduleCode"], event["activityCode"]) for event in selected)
    if actual != Counter(expected):
        raise ValueError(f"selection counts differ: expected {expected}, got {actual}")

    for index, left in enumerate(selected):
        for right in selected[index + 1 :]:
            if same_day(left, right) and (
                minute_of_day(left["startTime"]) < minute_of_day(right["endTime"])
                and minute_of_day(right["startTime"]) < minute_of_day(left["endTime"])
            ):
                raise ValueError(f"overlap: {left['eventId']} and {right['eventId']}")
    metadata = result["metadata"]
    if metadata["conflictCount"] != 0 or metadata["conflicts"]:
        raise ValueError("conflict metadata disagrees with conflict-free outcome")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    validate(json.loads(args.input.read_text()), json.loads(args.output.read_text()))
    print(f"PASS: independent hard-constraint validation for {args.output}")
