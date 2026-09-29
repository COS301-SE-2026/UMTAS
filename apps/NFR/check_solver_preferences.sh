#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$repo_root"

pnpm --filter shared-types build >/dev/null

# Extract the pure generator so the check does not require a Locust installation.
python3 - <<'PY' | node --input-type=module -e '
import { readFileSync } from "node:fs";
import { SolverPreferencesSchema } from "./packages/shared-types/dist/src/solver.js";
const samples = JSON.parse(readFileSync(0, "utf8"));
for (const sample of samples) SolverPreferencesSchema.parse(sample);
console.log(`${samples.length} generated solver preferences passed shared contract`);
'
import ast
import json
import random
from pathlib import Path

source = Path("apps/simulation-service/adapters/UMTAS/locust_user.py").read_text()
module = ast.parse(source)
function = next(
    node for node in module.body
    if isinstance(node, ast.FunctionDef) and node.name == "solver_preferences"
)
namespace = {"random": random}
exec(compile(ast.Module(body=[function], type_ignores=[]), "<solver_preferences>", "exec"), namespace)
random.seed(20260929)
print(json.dumps([namespace["solver_preferences"]() for _ in range(200)]))
PY
