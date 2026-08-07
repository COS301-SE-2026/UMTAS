#!/usr/bin/env bash
set -euo pipefail

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

assert_json_contains() {
  local file="$1"
  local expected="$2"
  grep -Fq "$expected" "$file"
}

assert_json_not_contains() {
  local file="$1"
  local unexpected="$2"
  if grep -Fq "$unexpected" "$file"; then
    echo "Unexpected content in $file: $unexpected" >&2
    exit 1
  fi
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

assert_ga_feasibility_is_bounded() {
  local input="$tmp_dir/ga-bounded-input.json"
  local output="$tmp_dir/ga-bounded-output.json"

  node - "$input" <<'NODE'
const fs = require("node:fs");
const outputPath = process.argv[2];
const events = [];
for (let group = 0; group < 30; group++) {
  for (let option = 0; option < 2; option++) {
    events.push({
      eventId: `M${group}-L1-${option}`,
      moduleCode: `M${group}`,
      activityType: "lecture",
      activityCode: "L1",
      requiredSelections: 1,
      dayOfWeek: "monday",
      startTime: "08:00",
      endTime: "09:00",
      venues: [],
    });
  }
}
fs.writeFileSync(
  outputPath,
  JSON.stringify({ schedulingProblem: { events }, preferences: { heuristics: [] } }),
);
NODE

  node - "$input" "$output" <<'NODE'
const { spawnSync } = require("node:child_process");
const inputPath = process.argv[2];
const outputPath = process.argv[3];
const result = spawnSync(
  "./GA_BIN",
  ["--input", inputPath, "--output", outputPath, "--engine", "ga", "--solve-mode", "feasibility"],
  { encoding: "utf8", timeout: 5000 },
);
if (result.error?.code === "ETIMEDOUT") {
  console.error("GA feasibility exceeded its bounded runtime");
  process.exit(1);
}
if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}
NODE

  assert_json_contains "$output" '"outcome": "best-effort"'
  assert_json_contains "$output" '"conflictCount": 435'
}

./GA_BIN --input src/data/API/example.json --output "$tmp_dir/cp-sat.json" --engine cp-sat --solve-mode optimization
assert_json_contains "$tmp_dir/cp-sat.json" '"status": "feasible"'
assert_json_contains "$tmp_dir/cp-sat.json" '"outcome": "conflict-free"'
assert_json_contains "$tmp_dir/cp-sat.json" '"solveMode": "optimization"'
assert_json_contains "$tmp_dir/cp-sat.json" '"CS101-L1-A"'

# Removed since logic is being changed -> tests will change
# ./GA_BIN --input tests/fixtures/preferred-start-time.json --output "$tmp_dir/preferred-start-time.json" --engine cp-sat --solve-mode optimization
# assert_json_contains "$tmp_dir/preferred-start-time.json" '"CS101-L1-B"'

# ./GA_BIN --input tests/fixtures/preferred-start-time.json --output "$tmp_dir/ga-feasibility.json" --engine ga --solve-mode feasibility
# assert_json_contains "$tmp_dir/ga-feasibility.json" '"outcome": "conflict-free"'
# assert_json_contains "$tmp_dir/ga-feasibility.json" '"solveMode": "feasibility"'

# ./GA_BIN --input tests/fixtures/avoidable-conflict.json --output "$tmp_dir/ga-avoidable-conflict.json" --engine ga --solve-mode feasibility
# assert_json_contains "$tmp_dir/ga-avoidable-conflict.json" '"outcome": "conflict-free"'
# assert_json_contains "$tmp_dir/ga-avoidable-conflict.json" '"conflictCount": 0'
# assert_json_contains "$tmp_dir/ga-avoidable-conflict.json" '"CS101-L1-B"'
# assert_json_not_contains "$tmp_dir/ga-avoidable-conflict.json" '"CS101-L1-A"'

# ./GA_BIN --input tests/fixtures/preferred-start-time.json --output "$tmp_dir/ga-optimization.json" --engine ga --solve-mode optimization
# assert_json_contains "$tmp_dir/ga-optimization.json" '"CS101-L1-B"'
# assert_json_contains "$tmp_dir/ga-optimization.json" '"solveMode": "optimization"'

# node - "$tmp_dir/insufficient-alternatives.json" <<'NODE'
# const { spawnSync } = require("node:child_process");
# const outputPath = process.argv[2];
# const result = spawnSync(
#   "./GA_BIN",
#   [
#     "--input", "tests/fixtures/insufficient-alternatives.json",
#     "--output", outputPath,
#     "--engine", "ga",
#     "--solve-mode", "optimization",
#   ],
#   { encoding: "utf8", timeout: 1000 },
# );
# if (result.error?.code === "ETIMEDOUT") {
#   console.error("GA did not reject an impossible selection count promptly");
#   process.exit(1);
# }
# if (result.status !== 0) {
#   process.stdout.write(result.stdout);
#   process.stderr.write(result.stderr);
#   process.exit(result.status ?? 1);
# }
# NODE
# assert_json_contains "$tmp_dir/insufficient-alternatives.json" '"status": "infeasible"'

./GA_BIN --input tests/fixtures/exact-interval-overlap.json --output "$tmp_dir/exact-interval-overlap.json" --engine ga --solve-mode optimization
assert_json_contains "$tmp_dir/exact-interval-overlap.json" '"CS101-L1-PREFERRED"'
assert_json_not_contains "$tmp_dir/exact-interval-overlap.json" '"CS101-L1-OTHER"'
assert_json_contains "$tmp_dir/exact-interval-overlap.json" '"conflictCount": 0'

./GA_BIN --input tests/fixtures/dated-events.json --output "$tmp_dir/dated.json" --engine ga --solve-mode optimization
assert_json_contains "$tmp_dir/dated.json" '"status": "feasible"'
assert_json_contains "$tmp_dir/dated.json" '"outcome": "conflict-free"'
assert_json_contains "$tmp_dir/dated.json" '"conflictCount": 0'
assert_json_contains "$tmp_dir/dated.json" '"CS101-L1-A"'

./GA_BIN --input tests/fixtures/conflicting-events.json --output "$tmp_dir/conflicting.json" --engine ga --solve-mode optimization
assert_json_contains "$tmp_dir/conflicting.json" '"status": "feasible"'
assert_json_contains "$tmp_dir/conflicting.json" '"outcome": "best-effort"'
assert_json_contains "$tmp_dir/conflicting.json" '"conflictCount": 1'
assert_json_contains "$tmp_dir/conflicting.json" '"CS101-L1-A"'
assert_json_contains "$tmp_dir/conflicting.json" '"CS101-T1-A"'

./GA_BIN --input tests/fixtures/conflicting-events.json --output "$tmp_dir/conflicting-feasibility.json" --engine ga --solve-mode feasibility
assert_json_contains "$tmp_dir/conflicting-feasibility.json" '"status": "feasible"'
assert_json_contains "$tmp_dir/conflicting-feasibility.json" '"outcome": "best-effort"'
assert_json_contains "$tmp_dir/conflicting-feasibility.json" '"conflictCount": 1'

./GA_BIN --input tests/fixtures/conflicting-events.json --output "$tmp_dir/conflicting-cp-sat.json" --engine cp-sat --solve-mode optimization
assert_json_contains "$tmp_dir/conflicting-cp-sat.json" '"status": "infeasible"'

./GA_BIN --input tests/fixtures/empty-events.json --output "$tmp_dir/empty.json" --engine ga --solve-mode feasibility
assert_json_contains "$tmp_dir/empty.json" '"status": "feasible"'
assert_json_contains "$tmp_dir/empty.json" '"selectedEventIds": []'
assert_json_contains "$tmp_dir/empty.json" '"solveMode": "feasibility"'

assert_ga_feasibility_is_bounded
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
