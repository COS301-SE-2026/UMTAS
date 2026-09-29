#!/usr/bin/env bash
set -euo pipefail

: "${SIMULATION_API_KEY:?Set the production simulation API key}"
export PROFILES_PATH="${PROFILES_PATH:-$(pwd)/apps/simulation-service/adapters/UMTAS/profiles.json}"
export PDF_DIR="${PDF_DIR:-$(pwd)/apps/simulation-service/adapters/UMTAS/pdfs}"
mkdir -p docs/evidence/nfr/records
locust -f apps/simulation-service/adapters/UMTAS/locust_user.py \
  --headless --host https://capstone-vigil.dns.net.za \
  --users 100 --spawn-rate 1 --run-time 1h \
  --html docs/evidence/nfr/records/soak-report.html \
  --csv docs/evidence/nfr/records/soak-stats --csv-full-history
