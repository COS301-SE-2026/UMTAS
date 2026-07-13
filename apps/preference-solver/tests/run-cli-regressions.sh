#!/usr/bin/env bash
set -euo pipefail

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

assert_json_contains() {
  local file="$1"
  local expected="$2"
  grep -Fq "$expected" "$file"
}

assert_ga_honors_sigterm() {
  local input="$tmp_dir/ga-sigterm-input.json"

  node - "$input" <<'NODE'
const fs = require("node:fs");
const outputPath = process.argv[2];
const events = Array.from({ length: 5000 }, (_, index) => ({
  eventId: `SIGTERM-${index}`,
  moduleCode: "CS101",
  activityType: "lecture",
  activityCode: "L1",
  requiredSelections: 1,
  dayOfWeek: "monday",
  startTime: "08:00",
  endTime: "09:30",
  venues: [],
}));
fs.writeFileSync(
  outputPath,
  JSON.stringify({ schedulingProblem: { events }, preferences: { heuristics: [] } }),
);
NODE

  ./GA_BIN --input "$input" --output "$tmp_dir/ga-sigterm.json" --engine ga \
    >"$tmp_dir/ga-sigterm.log" 2>&1 &
  local solver_pid=$!
  sleep 0.1
  if ! kill -TERM "$solver_pid" 2>/dev/null; then
    echo "GA completed before SIGTERM could be delivered" >&2
    exit 1
  fi
  if wait "$solver_pid"; then
    echo "GA ignored SIGTERM and completed normally" >&2
    exit 1
  fi
}

./GA_BIN --input src/data/API/example.json --output "$tmp_dir/cp-sat.json" --engine cp-sat
assert_json_contains "$tmp_dir/cp-sat.json" '"status": "feasible"'
assert_json_contains "$tmp_dir/cp-sat.json" '"CS101-L1-A"'

./GA_BIN --input tests/fixtures/preferred-start-time.json --output "$tmp_dir/preferred-start-time.json" --engine cp-sat
assert_json_contains "$tmp_dir/preferred-start-time.json" '"CS101-L1-B"'

./GA_BIN --input tests/fixtures/dated-events.json --output "$tmp_dir/dated.json" --engine ga
assert_json_contains "$tmp_dir/dated.json" '"status": "feasible"'
assert_json_contains "$tmp_dir/dated.json" '"CS101-L1-A"'

./GA_BIN --input tests/fixtures/conflicting-events.json --output "$tmp_dir/conflicting.json" --engine ga
assert_json_contains "$tmp_dir/conflicting.json" '"status": "feasible"'

./GA_BIN --input tests/fixtures/conflicting-events.json --output "$tmp_dir/conflicting-cp-sat.json" --engine cp-sat
assert_json_contains "$tmp_dir/conflicting-cp-sat.json" '"status": "infeasible"'

./GA_BIN --input tests/fixtures/empty-events.json --output "$tmp_dir/empty.json" --engine ga
assert_json_contains "$tmp_dir/empty.json" '"status": "feasible"'
assert_json_contains "$tmp_dir/empty.json" '"selectedEventIds": []'

assert_ga_honors_sigterm

assert_cli_fails() {
  local input="$1"
  local expected="$2"
  if ./GA_BIN --input "$input" --output "$tmp_dir/error.json" --engine ga >"$tmp_dir/error.log" 2>&1; then
    echo "Expected solver to reject $input" >&2
    exit 1
  fi
  assert_json_contains "$tmp_dir/error.log" "$expected"
}

assert_cli_fails tests/fixtures/invalid-time.json 'Time must use HH:MM format'
assert_cli_fails tests/fixtures/invalid-time-range.json 'Time must be between 00:00 and 23:59'
assert_cli_fails tests/fixtures/non-positive-duration.json 'endTime must be after startTime'
assert_cli_fails tests/fixtures/inconsistent-requirements.json 'Inconsistent requiredSelections'

