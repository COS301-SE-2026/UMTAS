#!/usr/bin/env python3
"""Summarise structured worker timing logs from one or more JSON line files."""

import argparse
import json
import math
import re
from pathlib import Path


def percentile(values):
    values = sorted(values)
    if not values:
        raise SystemExit("No timing samples found")
    return values[math.ceil(0.95 * len(values)) - 1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("logs", nargs="+", type=Path)
    args = parser.parse_args()
    samples = {"SOLVER_PROCESSING_DURATION": [], "PDF_PARSER_PROCESSING_DURATION": []}
    for path in args.logs:
        content = path.read_text()
        for line in content.splitlines():
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            message = entry.get("message") or entry.get("msg")
            if message not in samples:
                continue
            key = "msPerEvent" if message.startswith("SOLVER") else "msPerKb"
            value = entry.get(key)
            if value is None and isinstance(entry.get("context"), dict):
                value = entry["context"].get(key)
            if isinstance(value, (int, float)) and math.isfinite(value):
                samples[message].append(value)
        for message in samples:
            key = "msPerEvent" if message.startswith("SOLVER") else "msPerKb"
            for match in re.finditer(rf"{message}\s*\{{([^}}]*)\}}", content, re.S):
                value = re.search(rf"\b{key}:\s*([0-9]+(?:\.[0-9]+)?)", match.group(1))
                if value:
                    samples[message].append(float(value.group(1)))
    for message, values in samples.items():
        unit = "ms per event" if message.startswith("SOLVER") else "ms per KB"
        print(f"{message}: samples={len(values)} p95={percentile(values):.3f} {unit}")


if __name__ == "__main__":
    main()
