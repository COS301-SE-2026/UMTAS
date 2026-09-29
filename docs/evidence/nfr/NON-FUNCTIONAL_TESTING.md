# Non-Functional Requirement Testing

## 3.3.1 Quality Requirement Verification

Each measure is evaluated with its linked report. The production deployment is `https://capstone-vigil.dns.net.za`. The release test environment is the repository at the release commit, run from the repository root. The load profile follows the SRS and exercises student journeys through the public endpoint.

## 3.3.2 Load and Performance Test Evidence

The [Locust report](LOCUST_REPORT.html) contains endpoint statistics, percentiles, throughput and failures. The raw CSV files use the `records/locust-stats` prefix. The production profile uses 100 users, one new user per second and a steady period exceeding five minutes. Install its pinned Python dependencies with `python3 -m pip install -r apps/NFR/requirements.txt`, then set `SIMULATION_API_KEY` in the environment. The soak command uses the same profile with `--run-time 1h` and writes an independent session check report.

## 3.3.3 NFR Traceability Matrix

| ID | Requirement measure | Strategy | Tool and environment | Evidence | Status |
|---|---|---|---|---|---|
| NFR-Corr-1 | 100% field precision and recall, with zero omitted or invented values | Canonical parser contract and reviewed UP fixtures | pytest, release test environment | [Result](records/parser-suite.txt) | Pass |
| NFR-Corr-2 | 100% of conflict-free results pass independent validation, with zero overlaps | Two solver engines and independent hard constraint validation | Solver regression suite, release test environment | [Result](records/solver-regression.txt) | Pass |
| NFR-Sec-1 | A university administrator cannot retrieve another user's individual timetable; timetable reads are scoped to the authenticated session user and the service rejects a timetable the caller does not own | Owner scoped timetable access and role permission tables | Jest unit tests, release test environment | [Result](records/privacy-boundary-unit-tests.txt) | Pass |
| NFR-Scale-1 | 20,000 users per day design scale; 100 concurrent users for at least five minutes, 99% success for well-formed submission and status requests and p95 at most 2 s | Persisted jobs, BullMQ queues and separate workers | Locust, production | [Result](LOCUST_REPORT.html) | Pass |
| NFR-Perf-1 | Submission and status p95 at most 2 s, with at least 99% success | Asynchronous acceptance and status polling | Locust, production | [Result](LOCUST_REPORT.html) | Pass |
| NFR-Perf-2 | Every student read p95 at most 1 s, mean at most 500 ms and 100% success | Scoped indexed reads | Locust, production | [Result](LOCUST_REPORT.html) | Pass |
| NFR-Cap-1 | At least 50 requests/s for five minutes, 99% success and aggregate p95 below 1 s | Stateless API and connection pooling | Locust, production | [Result](LOCUST_REPORT.html) | Pass |
| NFR-Eff-1 | Solver p95 at most 500 ms per event and parser p95 at most 300 ms per KB | Worker processing duration instrumentation | Worker timing logs, production | [Result](records/worker-timings.txt) | Pass |
| NFR-Eff-2 | Job acceptance p95 at most 1 s, with 100% valid submissions accepted | Persist then enqueue before HTTP 202 | Locust, production | [Result](LOCUST_REPORT.html) | Pass |
| NFR-Rely-1 | Session canary success at least 99% throughout the sustained soak | Dedicated session canary under sustained load | Locust, production | [Result](records/soak-report.html) | Pass |
| NFR-Rely-2 | 100% sign-in completion and p95 at most 1 s per step | Three step account and session establishment | Locust, production | [Result](LOCUST_REPORT.html) | Pass |
| NFR-Avail-1 | At least 99.5% public uptime across the 30 day release window | Public health monitoring | UptimeRobot, production | [Status screenshot](records/uptime-status.png) | Pass |
| NFR-Sec-2 | Zero High ZAP alerts in baseline and authenticated scans | CSP, clickjacking protection and authenticated scanning | OWASP ZAP, production | [Result](ZAP_REPORT.pdf) | Pass |
| NFR-Sec-3 | Zero moderate or higher production dependency findings | Dependency audit gate | pnpm audit, release test environment | [Result](records/dependency-audit.txt) | Pass |
| NFR-Por-1 | Zero failures across Chromium, Firefox and Microsoft Edge | Playwright browser projects | Playwright, release test environment | [Chromium](records/playwright-chromium/index.html), [Firefox](records/playwright-firefox/index.html), [Edge](records/playwright-edge/index.html) | Pass |
| NFR-Acc-1 | Accessibility score above 90 on each audited page | Page by page Lighthouse audit | Lighthouse, production | [Result](Lighthouse.md) | Pass |
| NFR-Maint-1 | University-specific parsing is confined to adapter modules behind one contract and registry; the canonical models and command line interface contain no university-specific logic | Adapter contract, registry and canonical models | pytest, release test environment | [Case study](API_ADAPTER_CASE_STUDY.md), [parser suite](records/parser-suite.txt) | Pass |

## 3.3.4 Repeatable Evidence Register

Commands run from the repository root. Each command writes to the report path shown in the matrix.

The privacy boundary is evidenced by backend unit tests covering the role permission tables, the roles guard, owner scoped timetable retrieval and owner scoped event retrieval.

| Requirement | Command or procedure | Output |
|---|---|---|
| NFR-Corr-1 | `python3 apps/NFR/record_command.py docs/evidence/nfr/records/parser-suite.txt -- pytest -q -p no:cacheprovider apps/pdf_parser/parser/tests` | [records/parser-suite.txt](records/parser-suite.txt) |
| NFR-Corr-2 | `python3 apps/NFR/record_command.py docs/evidence/nfr/records/solver-regression.txt -- make -C apps/preference-solver test` | [records/solver-regression.txt](records/solver-regression.txt) |
| NFR-Sec-1 | `python3 apps/NFR/record_command.py docs/evidence/nfr/records/privacy-boundary-unit-tests.txt -- bash -c "cd apps/backend && npx jest src/Timetable/timetable.service.spec.ts src/auth/permissions.spec.ts src/auth/roles.guard.spec.ts src/Events/event.service.spec.ts"` | [records/privacy-boundary-unit-tests.txt](records/privacy-boundary-unit-tests.txt) |
| NFR-Scale-1 | `bash apps/NFR/run_production_load.sh` | [LOCUST_REPORT.html](LOCUST_REPORT.html) |
| NFR-Perf-1 | `bash apps/NFR/run_production_load.sh` | [LOCUST_REPORT.html](LOCUST_REPORT.html) |
| NFR-Perf-2 | `bash apps/NFR/run_production_load.sh` | [LOCUST_REPORT.html](LOCUST_REPORT.html) |
| NFR-Cap-1 | `bash apps/NFR/run_production_load.sh` | [LOCUST_REPORT.html](LOCUST_REPORT.html) |
| NFR-Eff-1 | `python3 apps/NFR/record_command.py docs/evidence/nfr/records/worker-timings.txt -- python3 apps/NFR/summarise_worker_timings.py docs/evidence/nfr/records/solver-worker.jsonl docs/evidence/nfr/records/parser-worker.jsonl` | [records/worker-timings.txt](records/worker-timings.txt) |
| NFR-Eff-2 | `bash apps/NFR/run_production_load.sh` | [LOCUST_REPORT.html](LOCUST_REPORT.html) |
| NFR-Rely-1 | `bash apps/NFR/run_soak.sh` | [records/soak-report.html](records/soak-report.html) |
| NFR-Rely-2 | `bash apps/NFR/run_production_load.sh` | [LOCUST_REPORT.html](LOCUST_REPORT.html) |
| NFR-Avail-1 | In UptimeRobot, select monitor 803621896 and capture the 30 day release-window summary. The status, monitor and metrics screenshots are [records/uptime-status.png](records/uptime-status.png), [records/uptime-monitor.jpg](records/uptime-monitor.jpg) and [records/uptime-metrics.jpg](records/uptime-metrics.jpg). | [records/uptime-status.png](records/uptime-status.png) |
| NFR-Sec-2 | `ZAP_CONTEXT_FILE=/absolute/path/context.context ZAP_USER=student bash apps/NFR/run_zap.sh` | [ZAP_REPORT.pdf](ZAP_REPORT.pdf) |
| NFR-Sec-3 | `python3 apps/NFR/record_command.py docs/evidence/nfr/records/dependency-audit.txt -- pnpm audit --audit-level=moderate --prod` | [records/dependency-audit.txt](records/dependency-audit.txt) |
| NFR-Por-1 | `bash apps/NFR/run_browser_reports.sh` | [Chromium](records/playwright-chromium/index.html), [Firefox](records/playwright-firefox/index.html), [Edge](records/playwright-edge/index.html) |
| NFR-Acc-1 | `bash apps/NFR/run_lighthouse.sh` | [Seven page reports](Lighthouse.md) |
| NFR-Maint-1 | `python3 apps/NFR/record_command.py docs/evidence/nfr/records/parser-suite.txt -- pytest -q -p no:cacheprovider apps/pdf_parser/parser/tests` | [Case study](API_ADAPTER_CASE_STUDY.md), [records/parser-suite.txt](records/parser-suite.txt) |
