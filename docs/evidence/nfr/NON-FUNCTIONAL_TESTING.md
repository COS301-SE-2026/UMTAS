## 3.3 Non-Functional Requirement (NFR) Testing

### 3.3.1 Quality Requirement Mapping Verification

??? note "NFR-Corr-1 - Supported Timetable PDF Extraction Correctness"

    The nine supported UP lecture, semester-test, and exam fixtures pass complete comparisons against the [manually reviewed ground-truth manifest](https://github.com/COS301-SE-2026/UMTAS/blob/main/apps/pdf_parser/parser/tests/ground_truth/up_supported_fixtures.json). The acceptance test calculates 100% field-level precision and recall for each fixture, reports zero omitted and zero invented records or fields, and checks exact canonical-result equality. The Python parser suite is an active CI gate; see the [NFR test matrix](NON-FUNCTIONAL_TESTING.md#333-nfr-traceability-matrix) for the recorded result.

??? note "NFR-Corr-2 - Conflict-Free Schedule Correctness"

    For an input whose hard constraints admit no conflict-free schedule, the system returns a clearly labelled `best-effort` result and identifies every remaining overlap. This is functional behaviour and does not weaken the conflict-free acceptance measure above.

??? note "NFR-Scale-1 - University-Scale Scheduling Workload"

    The client scale is 20,000 users per day, not 20,000 simultaneous users. That is about 13.9 new users per minute if uniformly distributed. The reference run ramped at 60 new virtual users per minute for 100 seconds and held 100 concurrent users for 8 minutes 25 seconds. This tests a burst above the average daily arrival rate; it does not observe 20,000 distinct users over 24 hours. The synchronous latency target applies to job submission and status retrieval, not to worker completion.

??? note "NFR-Maint-1 - University Adapter Modifiability"

    The University API Adapter architecture isolates university-specific API communication and data transformation behind a stable internal contract. The adapter pattern, abstraction, and dependency inversion ensure that adding support for a new university requires modifications only within the adapter boundary. The [case study](API_ADAPTER_CASE_STUDY.md) provides detailed verification that existing non-adapter components remain unchanged when a new university integration is introduced.

??? note "NFR-Perf-1, NFR-Perf-2, NFR-Cap-1, NFR-Eff-2, NFR-Rely-1, NFR-Rely-2 - Load-tested requirements"

    These six requirements share one measurement environment, the reference load run in section 3.3.2. Separating them keeps distinct budgets from being averaged into a single number: interactive reads (NFR-Perf-2) carry a tighter latency budget than asynchronous job handling (NFR-Perf-1), throughput capacity (NFR-Cap-1) is a property of the deployment rather than any endpoint, job acceptance (NFR-Eff-2) is deliberately measured apart from worker-side processing (NFR-Eff-1), and reliability is split between a sustained canary (NFR-Rely-1) and the arrival-burst sign-in sequence (NFR-Rely-2).

### 3.3.2 Load and Performance Test Evidence

Full interactive report: **[Locust load-test report](LOCUST_REPORT.html)** - per-endpoint statistics, response-time percentile distributions, requests-per-second and failures-per-second charts, and the recorded failure list.

#### Test configuration

| **Property** | **Value** |
|---|---|
| Tool | Locust (headless, HTML report) |
| Locustfile | `apps/simulation-service/adapters/UMTAS/locust_user.py` |
| Target host | `https://staging.capstone-vigil.dns.net.za` |
| Environment | Staging, production-equivalent configuration |
| Start / end | 2026-09-03 21:52:42Z / 22:02:54Z |
| Total duration | 10 min 12 s |
| Ramp-up | 0 to 100 virtual users at 1 user/second (100 s) |
| Steady state | 100 concurrent virtual users, 8 min 25 s (21:54:24Z to 22:02:49Z) |
| Think time | `between(0.5, 1)` seconds |
| User class | `DomainUser`, 19 weighted tasks |
| PDF fixtures | 12 UP timetable PDFs, 3 KB to 15 KB |
| Distinct named endpoints | 23 |

Each virtual user provisions an account, signs in, selects a university, and then loops over the weighted task mix: browsing and enrolling in modules, listing events, creating and extending a personal timetable, marking and updating attendance, uploading a timetable PDF and polling for its result, and submitting a solve job, polling its status, and applying the returned selection.

#### Aggregate results

| **Metric** | **Value** |
|---|---|
| Total requests | **40,513** |
| Total failures | **335** |
| Overall success rate | **99.17%** |
| Success rate excluding malformed load-script payloads | **99.998%** (40,512 of 40,513) |
| Throughput, whole run | **66.19 requests/second** |
| Throughput, steady state (mean) | **72.02 requests/second** |
| Throughput, steady state (min / peak) | **62.8 / 79.6 requests/second** |
| Mean response time | **314.25 ms** |
| Median response time | **280 ms** |
| p95 response time | **640 ms** |
| p99 response time | **860 ms** |
| Fastest / slowest observation | **20 ms / 1,448 ms** |
| Endpoints with a 100% success rate | **22 of 23** |

#### Per-endpoint results

Ordered by request volume. All times in milliseconds.

| **Method** | **Endpoint** | **Requests** | **Failures** | **Success** | **Mean** | **Median** | **p95** | **p99** | **Max** | **req/s** |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| GET | `/api/modules?universityId=[id]` | 5,680 | 0 | 100% | 335.6 | 310 | 640 | 830 | 1,413 | 9.28 |
| GET | `/api/events?moduleId=[id]` | 5,380 | 0 | 100% | 320.8 | 290 | 650 | 870 | 1,319 | 8.79 |
| GET | `/api/builder` | 3,725 | 0 | 100% | 343.8 | 310 | 690 | 920 | 1,425 | 6.09 |
| GET | `/api/timetables` | 3,707 | 0 | 100% | 270.2 | 250 | 560 | 760 | 1,294 | 6.06 |
| POST | `/api/attendance` | 3,184 | 0 | 100% | 343.4 | 310 | 700 | 960 | 1,369 | 5.20 |
| POST | `/api/timetables` | 2,074 | 0 | 100% | 355.3 | 320 | 720 | 980 | 1,407 | 3.39 |
| GET | `/api/attendance` | 1,880 | 0 | 100% | 294.7 | 270 | 600 | 820 | 1,001 | 3.07 |
| GET | `/api/events` | 1,876 | 0 | 100% | 394.8 | 370 | 760 | 1,000 | 1,308 | 3.07 |
| GET | `/api/auth/get-session` | 1,870 | 0 | 100% | 199.1 | 180 | 410 | 580 | 1,052 | 3.06 |
| GET | `/api/attendance?eventID=[id]&AlsoFilterByUser=true` | 1,675 | 0 | 100% | 306.3 | 280 | 600 | 830 | 1,391 | 2.74 |
| PATCH | `/api/attendance/[id]` | 1,588 | 0 | 100% | 306.4 | 280 | 610 | 840 | 1,448 | 2.59 |
| GET | `/api/pdf-parser/jobs/[id]` | 1,584 | 0 | 100% | 270.1 | 240 | 560 | 750 | 1,407 | 2.59 |
| PATCH | `/api/timetables/[id]` | 1,438 | 0 | 100% | 296.6 | 270 | 590 | 780 | 1,285 | 2.35 |
| POST | `/api/solver/jobs` | 1,176 | 335 | 71.51% | 344.8 | 310 | 710 | 940 | 1,176 | 1.92 |
| GET | `/api/modules/enroll/[moduleId]` | 1,000 | 0 | 100% | 280.4 | 250 | 610 | 770 | 1,062 | 1.63 |
| GET | `/api/solver/jobs/[id]/result` | 755 | 0 | 100% | 291.1 | 270 | 600 | 830 | 1,400 | 1.23 |
| GET | `/api/solver/jobs/[id]` | 604 | 0 | 100% | 274.8 | 240 | 570 | 820 | 1,011 | 0.99 |
| GET | `/api/timetables/[id]` | 601 | 0 | 100% | 272.2 | 250 | 520 | 700 | 867 | 0.98 |
| POST | `/api/pdf-parser/jobs/upload` | 255 | 0 | 100% | 295.8 | 250 | 670 | 790 | 815 | 0.42 |
| GET | `/api/pdf-parser/jobs/[id]/result` | 161 | 0 | 100% | 296.9 | 270 | 610 | 740 | 768 | 0.26 |
| POST | `/api/auth/admin/create-mock-user` | 100 | 0 | 100% | 540.8 | 480 | 900 | 1,300 | 1,285 | 0.16 |
| POST | `/api/auth/select-university` | 100 | 0 | 100% | 92.6 | 57 | 310 | 450 | 445 | 0.16 |
| POST | `/api/auth/sign-in/email` | 100 | 0 | 100% | 434.5 | 380 | 900 | 1,100 | 1,099 | 0.16 |
| | **Aggregated** | **40,513** | **335** | **99.17%** | **314.3** | **280** | **640** | **860** | **1,448** | **66.19** |

Grouped by verb: the 14 `GET` endpoints served **30,498 requests with 0 failures**; the 9 `POST`/`PATCH` endpoints served **10,015 requests with 335 failures**, all of them on a single endpoint.

#### Solver submission failures

All 335 failures occurred on `POST /api/solver/jobs`. The load script generated 334 malformed
preferences payloads, which received HTTP 400 responses. Excluding those requests is useful for
diagnosing the script, but it does not change the overall run result of 99.17% success. The
remaining failure was an HTTP 502 on a well-formed solver submission. Among the 842 well-formed
solver submissions, 841 were accepted. This is why NFR-Eff-2 does not satisfy its 100% acceptance
measure. The [Locust report](LOCUST_REPORT.html) contains the request and failure details.

#### Stability over the steady-state window

| **Metric** | **Value** |
|---|---|
| Steady-state duration | 8 min 25 s at 100 virtual users (102 samples) |
| Sampled throughput | mean 72.02 req/s, range 62.8 to 79.6 req/s |
| Sampled p95 | mean 616.8 ms, range 350 to 1,000 ms |
| Sampled median | mean 300.0 ms, range 200 to 510 ms |
| Sampled failure rate | mean 0.62 failures/s, max 1.3 failures/s (334 malformed solver payloads and one HTTP 502) |
| First 60 s vs last 60 s throughput | 71.53 req/s vs 71.85 req/s |

Throughput and the instantaneous median were flat across the window, showing no degradation, queue build-up, or connection exhaustion. The cumulative mean response time rises from 215 ms to 314 ms over the window; this is an artefact of a running average accumulating over the ramp-up samples, not a latency trend, as the instantaneous percentiles confirm.

#### Limitations of this run

- Peak concurrency was **100 virtual users**, used as a burst proxy for a 20,000-users-per-day population. The test did not run for a full day or establish peak arrival patterns across that day.
- The run lasted **10 min 12 s**, which is not a soak. NFR-Rely-1 targets an extended duration.
- Locust measures the client-observed round trip only. This branch adds per-job **processing** duration logs to the PDF and solver workers, but the reference load run predates that instrumentation. NFR-Eff-1 remains unmeasured pending a concurrent run and p95 calculation.
- Host-side resource use (CPU, memory, database connections, queue depth) was not collected alongside the run.
- The target was **staging**, not the client-provided production host.

### 3.3.3 NFR Traceability Matrix

Results from the 3 September staging run are historical reference results. A historical pass does
not establish that the assessed Demo 4 release passes the same requirement. Retain the same raw
report and run metadata for a current release run before changing those rows to a current pass.

| **ID** | **Requirement Measure** | **Strategy / Implementation** | **Tool / Environment** | **Target / Actual** | **Status** |
| --- | --- | --- | --- | --- | --- |
| **NFR-Corr-1** | 100% field-level precision and recall on all supported UP fixtures; 0 omitted, 0 invented | Canonical parser contract with a manually reviewed ground-truth manifest | [Parser suite output](records/parser-suite-2026-09-28.txt) | 100% / 100% (9 fixtures, 69 tests) | Branch pass; Demo 4 CI result pending |
| **NFR-Corr-2** | 100% of conflict-free options pass independent hard-constraint validation; 0 overlapping pairs | CP-SAT and GA solvers with independent post-validation | [Fresh local diagnostic](records/solver-diagnostic-2026-09-28-current.txt) | CP-SAT passed two independently validated fixtures; GA local regression crashes during process exit | Pending full solver regression and assessed-release validation |
| **NFR-Sec-1** | 0 linkable student identifiers beyond the privacy boundary; 0 re-identifications | Aggregate-only analytics boundary | Documented re-identification test | 0 / TBD | Pending |
| **NFR-Scale-1** | 20,000 users/day design scale; burst proxy of 100 concurrent users for ≥5 min with ≥99% valid submission/status success and p95 ≤ 2 s | Asynchronous job queue, back-pressure, horizontal workers | [Locust](LOCUST_REPORT.html) on staging | **100 concurrent users for 8 min 25 s**; valid submission/status subset **99.97% success and 710 ms worst endpoint p95**; full run **99.17% success and 640 ms aggregate p95**. | Burst proxy met on historical staging run; current release and full-day workload unverified |
| **NFR-Perf-1** | p95 ≤ 2 s for submission and status endpoints; ≥99% overall success | Asynchronous job acceptance, indexed reads | [Locust](LOCUST_REPORT.html) on staging | ≤2,000 ms / **720 ms worst submission p95**; ≥99% / **99.17%** | Historical pass; Demo 4 pending |
| **NFR-Perf-2** | p95 ≤ 1 s and mean ≤ 500 ms for every student-facing read endpoint; 100% success | Indexed queries, scoped read paths | [Locust](LOCUST_REPORT.html) on staging | ≤1,000 ms / **760 ms worst p95**; ≤500 ms / **394.8 ms worst mean**; 100% / **100% (30,498 reads, 0 failures)** | Historical pass; Demo 4 pending |
| **NFR-Cap-1** | ≥50 req/s sustained for ≥5 min with ≥99% success and aggregate p95 < 1 s | Connection pooling, stateless API instances | [Locust](LOCUST_REPORT.html) on staging | ≥50 req/s / **72.02 req/s over 8 min 25 s**; p95 **640 ms** | Historical pass; Demo 4 pending |
| **NFR-Eff-1** | p95 solver ≤ 500 ms per event; p95 PDF parsing ≤ 300 ms per KB | Worker-side processing budgets | Per-job worker timing logs on this branch | Targets set / **not measured** | Pending concurrent run and p95 calculation |
| **NFR-Eff-2** | p95 job-acceptance latency ≤ 1 s; 100% of well-formed submissions accepted | HTTP 202 on enqueue, job record persisted before response | [Locust](LOCUST_REPORT.html) on staging | ≤1,000 ms / **670 ms (PDF)**, **710 ms (solver)**; 100% / **255/255 PDF, 841/842 solver** | Not met - one well-formed solver submission returned 502 |
| **NFR-Rely-1** | Canary success rate ≥99% for the full soak duration | Dedicated low-cost session check alongside load | [Locust](LOCUST_REPORT.html) on staging | ≥99% / **100% (1,870 requests, 0 failures)** over 10 min | Partial - full soak outstanding |
| **NFR-Rely-2** | 100% of sign-in sequences complete; p95 ≤ 1 s per step | Fail-fast three-step session establishment | [Locust](LOCUST_REPORT.html) on staging | 100% / **300/300 requests, 0 failures**; ≤1,000 ms / **900 ms worst p95** | Historical pass; Demo 4 pending |
| **NFR-Avail-1** | ≥99.5% uptime over a stated 30-day window including the Demo 4 release | Automated health checks / process supervisors | [Captured UptimeRobot monitor](Availability.md) | ≥99.5% / **99.965% rolling 30 days** on 2026-09-28; exact release window and dated export outstanding | Pending - release window not recorded |
| **NFR-Sec-2** | 0 alerts of medium severity or above | Input validation / authorisation middleware | [OWASP ZAP](Owasp.md) | 0 alerts / **2 Medium alerts** in the archived production scan; anti-clickjacking headers are on this branch, CSP remains open | Pending safe CSP and staging rescan |
| **NFR-Sec-3** | 0 `pnpm audit` findings of moderate or higher severity on `main` | Strict dependency management | [Local audit output](records/dependency-audit-2026-09-28.txt) and `pnpm audit` CI gate | 0 findings on the updated local branch; exit code 0 | Branch pass; `main` CI result pending |
| **NFR-Por-1** | 0 test failures for repeated tests across all provided browsers | Automated cross-browser E2E testing targeting Chromium, Edge, and Firefox | Playwright in CI/CD pipeline | 0 failures / **no recorded three-browser result**; the Edge project now uses `msedge` and the runner installs it | Pending |
| **NFR-Acc-1** | Lighthouse Accessibility score exceeds 90 out of 100 | Accessibility audits across key frontend application pages | [Lighthouse](Lighthouse.md) | >90 / **91-96 on six pages**; the Event PDF has no numeric score and records the Builder URL | Partial - Event page report required |
| **NFR-Maint-1** | 0 existing production components outside the University API Adapter layer modified when adding a new university API | Adapter pattern, abstraction, dependency inversion | Code review / [Case Study](API_ADAPTER_CASE_STUDY.md) | 0 non-adapter components / **not measured in a controlled change set** | Pending |

The NFR-Corr-1 acceptance test uses `apps/pdf_parser/parser/tests/ground_truth/up_supported_fixtures.json`, which records the review method, date, canonical normalisation rules, and complete expected output for all nine fixtures. The test compares complete records, counts leaf-field matches to calculate precision and recall, rejects omitted or invented records and values, and finally requires exact result equality. A fresh run on 2026-09-28 [passed 69 tests](records/parser-suite-2026-09-28.txt) with five non-failing dependency deprecation warnings.

### 3.3.4 Repeatable evidence register

The Demo 4 instructions require an executable, repeatable test and retained output or screenshots for every quality requirement. The linked reports are historical observations. Their presence does not turn an incomplete acceptance measure into a passing result.

| Requirement | Repeatable test or evidence source | Current evidence and next action |
|---|---|---|
| NFR-Corr-1 | `PYTHONDONTWRITEBYTECODE=1 pytest -q -p no:cacheprovider apps/pdf_parser/parser/tests` | [Output: 69 passed](records/parser-suite-2026-09-28.txt) on the named branch revision. Retain a CI log after the assessed release is merged. |
| NFR-Corr-2 | `make -C apps/preference-solver test`, with `tests/validate-hard-constraints.py` for conflict-free outputs | The [fresh local diagnostic](records/solver-diagnostic-2026-09-28-current.txt) passes two CP-SAT fixtures and does not reproduce the older preferred-start-time failure. GA crashes locally during process exit; complete the full regression and assessed-release validation. |
| NFR-Sec-1 | Synthetic identity dataset, role-scoped API requests and a re-identification script | No completed test output is recorded. Capture responses, exports, logs and reconstruction attempts. |
| NFR-Scale-1 | `apps/NFR/` Locust harness, burst-load report and production host metrics | The [reference report](LOCUST_REPORT.html) covers the 100-concurrent-user burst proxy for 8 min 25 s. Rerun on the assessed revision and record host/queue metrics. A 20,000-distinct-user day was not observed. |
| NFR-Perf-1 | [Locust report](LOCUST_REPORT.html), submission and status endpoint statistics | Reference run recorded; rerun against the assessed release and retain the raw report. |
| NFR-Perf-2 | [Locust report](LOCUST_REPORT.html), student-facing read statistics | Reference run recorded; rerun against the assessed release and retain the raw report. |
| NFR-Cap-1 | [Locust report](LOCUST_REPORT.html), steady-state throughput chart | Reference run recorded; rerun against the assessed release and retain the raw report. |
| NFR-Eff-1 | Worker-side `SOLVER_PROCESSING_DURATION` and `PDF_PARSER_PROCESSING_DURATION` logs | Collect logs under concurrent load and report p95 milliseconds per event and per KB. HTTP latency is insufficient. |
| NFR-Eff-2 | [Locust report](LOCUST_REPORT.html), PDF and solver submission rows | The PDF path passed, but one well-formed solver request returned 502. Rerun after investigation. |
| NFR-Rely-1 | [Locust report](LOCUST_REPORT.html), session canary over the full soak | Ten-minute result recorded; full soak remains outstanding. |
| NFR-Rely-2 | [Locust report](LOCUST_REPORT.html), three-step sign-in sequence | Reference run recorded; rerun against the assessed release. |
| NFR-Avail-1 | [Captured public UptimeRobot monitor](Availability.md) | Two dated screenshots show the endpoint and rolling figure. Retain an export with the exact 30-day window and deployed revision covering the assessed release. |
| NFR-Sec-2 | [ZAP report](Owasp.md), then a repeat baseline and authenticated scan | The archived scan has two Medium alerts. Record remediation and a passing rescan. |
| NFR-Sec-3 | `pnpm audit --audit-level=moderate --prod` | [Local output](records/dependency-audit-2026-09-28.txt) records exit code 0 after updating vulnerable dependencies. Retain the `main` CI output on the assessed revision. |
| NFR-Por-1 | `pnpm test:e2e` with Chromium, Firefox and a real Edge project | The three projects are configured; record each browser's report on the assessed revision. |
| NFR-Acc-1 | [Lighthouse reports](Lighthouse.md) for each named page | Six numeric scores exceed 90. Run and retain an audit for the actual Event page. |
| NFR-Maint-1 | [Adapter case study](API_ADAPTER_CASE_STUDY.md) with a controlled diff and regression suite | The case study is available. Retain the exact change set and test output for the assessed revision. |
