#!/usr/bin/env bash
set -euo pipefail

target=https://capstone-vigil.dns.net.za
out="$(pwd)/docs/evidence/nfr"
chrome="${CHROME_BIN:-google-chrome}"
docker run --rm -v "${out}:/zap/wrk:rw" ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t "${target}" -r ZAP_BASELINE.html -I

# Authenticated scanning uses a ZAP context file supplied by the operator.
# The context contains a dedicated synthetic test account and excludes destructive routes.
test -n "${ZAP_CONTEXT_FILE:-}"
test -n "${ZAP_USER:-}"
docker run --rm -v "${out}:/zap/wrk:rw" \
  -v "${ZAP_CONTEXT_FILE}:/zap/wrk/context.context:ro" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t "${target}" -n /zap/wrk/context.context \
  -U "${ZAP_USER}" -r ZAP_AUTHENTICATED.html -I
"$chrome" --headless --no-sandbox --disable-gpu \
  --print-to-pdf="${out}/ZAP_REPORT.pdf" \
  "file://${out}/ZAP_AUTHENTICATED.html"
