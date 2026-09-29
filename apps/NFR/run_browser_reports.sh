#!/usr/bin/env bash
set -euo pipefail

for browser in chromium firefox edge; do
  PLAYWRIGHT_HTML_OUTPUT_DIR="../../docs/evidence/nfr/records/playwright-${browser}" \
    pnpm --dir apps/e2e exec playwright test --project="${browser}" \
    --reporter=html
done
