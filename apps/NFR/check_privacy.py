#!/usr/bin/env python3
"""Check captured administrator views against synthetic student identities."""

import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture", required=True, type=Path,
                        help="JSON array of synthetic records with studentId, email and timetableId")
    parser.add_argument("--admin-response", required=True, type=Path,
                        help="JSON with individualScheduleStatus and analytics response")
    parser.add_argument("--export", required=True, type=Path)
    parser.add_argument("--aggregate", required=True, type=Path)
    parser.add_argument("--api-log", required=True, type=Path)
    args = parser.parse_args()
    identities = json.loads(args.fixture.read_text())
    paths = [args.admin_response, args.export, args.aggregate, args.api_log]
    if not identities:
        raise SystemExit("Synthetic identities are required")
    admin_response = json.loads(args.admin_response.read_text())
    access_status = admin_response["individualScheduleStatus"]
    if access_status not in (401, 403, 404):
        raise SystemExit(f"Individual schedule access returned {access_status}")
    captured = "\n".join(path.read_text() for path in paths)
    found = []
    for record in identities:
        for field in ("studentId", "email", "timetableId", "scheduleSignature"):
            value = record[field]
            if value and value in captured:
                found.append((field, value))
    print(f"Synthetic identities: {len(identities)}")
    print(f"Captured boundary files: {len(paths)}")
    print(f"Individual schedule access status: {access_status}")
    print(f"Linkable identifiers: {len(found)}")
    print(f"Reconstructed identities: {len({value for _, value in found})}")
    if found:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
