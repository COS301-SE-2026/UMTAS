#!/usr/bin/env bash
set -euo pipefail

base="${LIGHTHOUSE_BASE_URL:-https://capstone-vigil.dns.net.za}"
chrome="${CHROME_BIN:-google-chrome}"
out=docs/evidence/nfr
for pair in 'Builder:builder' 'calmanagement:calendar-management' 'courseMan:course-management' 'moduleman:module-management?tab=modules' 'roleman:role-management' 'schedules:schedules' 'event:module-management?tab=events'; do
  name="${pair%%:*}"
  route="${pair#*:}"
  pnpm dlx lighthouse@12.8.2 "${base}/${route}" --only-categories=accessibility \
    --output=html --output=json --output-path="${out}/${name}" \
    --chrome-flags="--headless ${LIGHTHOUSE_CHROME_FLAGS:-}"
  python3 - "${out}/${name}.report.json" "${base}/${route}" <<'PY'
import json, sys
report = json.load(open(sys.argv[1]))
assert report['finalUrl'].rstrip('/') == sys.argv[2].rstrip('/'), report['finalUrl']
assert report['categories']['accessibility']['score'] > 0.90
PY
  "$chrome" --headless --no-sandbox --disable-gpu \
    --print-to-pdf="$(pwd)/${out}/${name}.pdf" \
    "file://$(pwd)/${out}/${name}.report.html"
done
