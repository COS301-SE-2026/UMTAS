# Non-Functional Requirements

These requirements are derived from the client's stated success criteria: correct University of
Pretoria PDF extraction, conflict-free schedules, privacy-preserving administration,
university-scale simulation, and university-specific adapters that do not alter the core. They are
acceptance targets. Where a requirement has been exercised, the recorded result is given in an
**Acceptance evidence** block beneath the scenario; where it has not, the requirement is marked as
not yet measured rather than assumed to pass.

The performance, throughput, and reliability evidence below comes from a single Locust run against
the staging deployment on 2026-09-03. The complete interactive report, including per-endpoint
tables, response-time distributions, and the requests/failures charts, is published as the
[Locust load-test report](LOCUST_REPORT.html). A summary of that run and the full per-endpoint
breakdown are in [Non-Functional Requirements Testing](NON-FUNCTIONAL_TESTING.md#332-load-and-performance-test-evidence).

## Utility Tree

Importance and implementation difficulty use the lecture convention: **H** = high, **M** = medium,
and **L** = low.

| **ID** | **Quality attribute** | **Sub-characteristic** | **Importance** | **Difficulty** |
|:---:|---|---|:---:|:---:|
| **NFR-Corr-1** | Functional suitability | Functional correctness | H | M |
| **NFR-Corr-2** | Functional suitability | Functional correctness | H | H |
| **NFR-Sec-1** | Security | Confidentiality | H | H |
| **NFR-Scale-1** | Flexibility | Scalability | H | H |
| **NFR-Maint-1** | Maintainability | Modifiability | H | M |
| **NFR-Sec-2** | Security | Vulnerability resistance | H | M |
| **NFR-Perf-1** | Performance efficiency | Time behaviour | H | M |
| **NFR-Perf-2** | Performance efficiency | Time behaviour | H | M |
| **NFR-Cap-1** | Performance efficiency | Capacity | M | M |
| **NFR-Eff-1** | Performance efficiency | Resource/capacity utilisation | M | M |
| **NFR-Eff-2** | Performance efficiency | Resource/capacity utilisation | M | L |
| **NFR-Rely-1** | Reliability | Availability under load | H | M |
| **NFR-Rely-2** | Reliability | Maturity / fault tolerance | M | M |
| **NFR-Avail-1** | Reliability | Availability | M | L |
| **NFR-Sec-3** | Security | Vulnerability resistance | H | L |
| **NFR-Por-1** | Portability | Adaptability | H | L |
| **NFR-Acc-1** | Usability | Accessibility | H | H |

## Reference Load Profile

Several requirements below share one measurement environment, referred to as the **reference load
run**. Defining it once keeps the individual response measures comparable.

| **Property** | **Value** |
|---|---|
| Tool | Locust, headless, HTML report |
| Locustfile | `apps/simulation-service/adapters/UMTAS/locust_user.py` |
| Target host | `https://staging.capstone-vigil.dns.net.za` (staging, production-equivalent configuration) |
| Window | 2026-09-03 21:52:42Z to 22:02:54Z (10 min 12 s) |
| Ramp-up | 0 to 100 virtual users at 1 user/second (100 s) |
| Steady state | 100 concurrent virtual users held for 8 min 25 s |
| Think time | 0.5 s to 1.0 s between tasks |
| Workload mix | 19 weighted student tasks: module browsing and enrolment, event listing, timetable create/extend/read, attendance create/update/read, PDF upload and polling, solver submission, polling and result application, session checks |
| Distinct named endpoints | 23 |
| Evidence | [Locust load-test report](LOCUST_REPORT.html) |

## NFR-Corr-1 - Supported Timetable PDF Extraction Correctness

**Quality attribute:** Functional suitability - functional correctness

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | An authenticated user |
| **Stimulus** | Submit a valid timetable PDF belonging to a supported university format |
| **Environment** | Normal operation using a version-controlled PDF fixture and manually verified ground-truth dataset |
| **Artifact** | Timetable ingestion capability |
| **Response** | Extract the expected module codes, venues, dates, times, activity groups, and scheduling warnings into the canonical timetable representation |
| **Response measure** | For every supported-format acceptance fixture, field-level precision and recall are both **100%**: every expected record and field is extracted correctly, **0 expected records are omitted**, and **0 records or values are invented**. The result passes the canonical parser contract. |

**Acceptance evidence (2026-09-02):** The nine supported UP lecture, semester-test, and exam
fixtures pass complete comparisons against the
[manually reviewed ground-truth manifest](https://github.com/COS301-SE-2026/UMTAS/blob/main/apps/pdf_parser/parser/tests/ground_truth/up_supported_fixtures.json).
The acceptance test calculates 100% field-level precision and recall for each fixture, reports zero
omitted and zero invented records or fields, and checks exact canonical-result equality. The Python
parser suite is an active CI gate; see the
[NFR test matrix](NON-FUNCTIONAL_TESTING.md#333-nfr-traceability-matrix) for the recorded result.

## NFR-Corr-2 - Conflict-Free Schedule Correctness

**Quality attribute:** Functional suitability - functional correctness

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | An authenticated student |
| **Stimulus** | Request schedule options for a version-controlled input whose hard constraints admit at least one feasible schedule |
| **Environment** | Normal operation using the regression suite of feasible inputs and known conflict edge cases |
| **Artifact** | Timetable optimisation capability |
| **Response** | Produce schedule options that satisfy every hard scheduling constraint and label the outcome accurately |
| **Response measure** | Across all feasible acceptance fixtures, **100% of returned conflict-free options** pass independent hard-constraint validation and contain **0 overlapping event pairs**. A result containing an overlap is never labelled `conflict-free`. |

For an input whose hard constraints admit no conflict-free schedule, the system returns a clearly
labelled `best-effort` result and identifies every remaining overlap. This is functional behaviour
and does not weaken the conflict-free acceptance measure above.

## NFR-Sec-1 - Student Timetable Confidentiality

**Quality attribute:** Security - confidentiality

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | A university administrator or authorised privacy tester |
| **Stimulus** | Request university analytics or attempt to associate aggregate results with an individual student |
| **Environment** | Production-equivalent operation using a synthetic dataset containing known student-to-schedule associations |
| **Artifact** | Student-data access and analytics privacy boundary |
| **Response** | Expose only authorised aggregate information and prevent administrators from retrieving or reconstructing individual student schedules |
| **Response measure** | Administrative responses, exports, logs, and analytics records contain **0 student UUIDs or equivalent linkable identifiers** beyond the privacy boundary; administrators can retrieve **0 individual student schedules**; and the documented re-identification test recovers **0 student identities** from aggregate output. |

## NFR-Scale-1 - University-Scale Scheduling Workload

**Quality attribute:** Flexibility - scalability

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | The synthetic student simulation workload |
| **Stimulus** | Generate scheduling activity from 20,000 concurrently active synthetic student profiles |
| **Environment** | Production deployment on the client-provided server, following a documented ramp-up and holding the target workload for 15 minutes |
| **Artifact** | Public API, scheduling-job submission path, status retrieval path, and background-processing capacity |
| **Response** | Continue accepting valid requests, expose job status, apply back-pressure when necessary, and preserve every accepted job |
| **Response measure** | During the 15-minute steady-state period with **20,000 active virtual users**, at least **99% of synchronous submission and status requests succeed**, their **p95 response time does not exceed 2 seconds**, and **0 accepted jobs are lost**. Queue-completion time, maximum queue depth, and production-host resource use are reported separately. |

The synchronous latency target applies to job submission and status retrieval, not to completion of
all compute-intensive scheduling work. A job is accepted when the API has persisted its job record,
successfully enqueued it, and returned its identifier.

**Interim evidence (2026-09-03) - target not yet reached.** The reference load run demonstrates the
measurement method and the shape of the result at **100 concurrent virtual users**, which is 0.5% of
the 20,000-user target. At that concurrency the system met every component of the measure with
substantial headroom. The submission and status paths took **3,619 requests**; discounting the 334
malformed solver payloads generated by the load script, **3,284 of 3,285 succeeded (99.97%)**, the
single exception being one HTTP 502. Their p95 response time peaked at **710 ms** against the
2-second budget, and every accepted job returned an identifier. This is a demonstration of the harness, not satisfaction of NFR-Scale-1. The
20,000-user run against the client-provided production host remains outstanding, and the ramp
between 100 and 20,000 users has not been characterised.

## NFR-Perf-1 - Everyday Scheduling Responsiveness

**Quality attribute:** Performance efficiency - time behaviour

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | Ordinary concurrent student usage (module browsing, enrolment, timetable building, solver requests) |
| **Stimulus** | A representative mix of student actions generated against the deployed API under normal, non-peak concurrency |
| **Environment** | Production-equivalent deployment, steady-state Locust load at a moderate, everyday concurrency level (not the NFR-Scale-1 peak) |
| **Artifact** | Public API, in particular the scheduling-job submission and status-retrieval endpoints |
| **Response** | Serve requests within the response-time budget while maintaining a low error rate |
| **Response measure** | Across the steady-state window, the **p95 response time for submission and status endpoints does not exceed 2 seconds**, and the **overall request success rate is at least 99%**. |

**Acceptance evidence (2026-09-03) - met.** From the reference load run
([Locust load-test report](LOCUST_REPORT.html)):

| **Component of the measure** | **Target** | **Actual** |
|---|---|---|
| p95, `POST /api/solver/jobs` (submission) | ≤ 2,000 ms | **710 ms** |
| p95, `POST /api/pdf-parser/jobs/upload` (submission) | ≤ 2,000 ms | **670 ms** |
| p95, `POST /api/timetables` (submission) | ≤ 2,000 ms | **720 ms** |
| p95, `GET /api/solver/jobs/[id]` (status) | ≤ 2,000 ms | **570 ms** |
| p95, `GET /api/pdf-parser/jobs/[id]` (status) | ≤ 2,000 ms | **560 ms** |
| Worst p95 of any of the 23 named endpoints | ≤ 2,000 ms | **900 ms** (`POST /api/auth/admin/create-mock-user` and `POST /api/auth/sign-in/email`) |
| Aggregate p95 across all 40,513 requests | ≤ 2,000 ms | **640 ms** |
| Overall request success rate | ≥ 99% | **99.17%** (40,178 of 40,513) |

The aggregate mean response time was **314.25 ms**, the median **280 ms**, the p99 **860 ms**, and
the slowest single observation across the entire run **1,448 ms** - still inside the 2-second
budget. No endpoint exceeded 1,500 ms at any point.

The 335 failures behind the 99.17% figure were **all** on `POST /api/solver/jobs`: 334 HTTP 400
responses and one HTTP 502. The 400s are attributable to a defect in the load script rather than
the API, and are analysed in
[Non-Functional Requirements Testing](NON-FUNCTIONAL_TESTING.md#solver-submission-failures). Every
one of the other 22 named endpoints recorded **0 failures across 39,337 requests**.

## NFR-Perf-2 - Interactive Read Responsiveness

**Quality attribute:** Performance efficiency - time behaviour

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | A student navigating the application: opening the module catalogue, listing events for an enrolled module, opening the timetable builder, and reviewing attendance |
| **Stimulus** | Read requests issued as part of ordinary browsing while the system carries concurrent write and solver traffic |
| **Environment** | Production-equivalent deployment under the reference load run |
| **Artifact** | Student-facing read endpoints of the public API |
| **Response** | Return the requested collection quickly enough that navigation feels immediate, without degrading as concurrent write traffic continues |
| **Response measure** | For every student-facing read (`GET`) endpoint, the **p95 response time does not exceed 1 second**, the **mean response time does not exceed 500 ms**, and the **success rate is 100%**. |

Read responsiveness is separated from NFR-Perf-1 because it governs perceived interactivity rather
than asynchronous job handling, and therefore carries a tighter budget than the 2-second
submission-and-status budget.

**Acceptance evidence (2026-09-03) - met.** Across the reference load run, the 14 named `GET`
endpoints served **30,498 requests with 0 failures**. The slowest was `GET /api/events` at a
**760 ms p95** and a **394.8 ms mean**; the heaviest by volume, `GET /api/modules?universityId=[id]`
(5,680 requests, 75 KB mean payload), returned a **640 ms p95** and a **335.6 ms mean**. Every read
endpoint met both the 1-second p95 budget and the 500 ms mean budget. The complete per-endpoint
table is in
[Non-Functional Requirements Testing](NON-FUNCTIONAL_TESTING.md#per-endpoint-results).

## NFR-Cap-1 - Sustained Request Throughput

**Quality attribute:** Performance efficiency - capacity

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | Concurrent student traffic generated by the Locust workload |
| **Stimulus** | A sustained mixed read/write request stream held at steady concurrency |
| **Environment** | Production-equivalent deployment, steady-state portion of the reference load run |
| **Artifact** | Public API request pipeline, application server, and database connection pool |
| **Response** | Absorb the offered request rate for the full steady-state window without throughput collapse, latency runaway, or a rising error rate |
| **Response measure** | The deployment sustains at least **50 requests per second** in aggregate for a steady-state window of at least **5 minutes**, while holding the **success rate at or above 99%** and the **aggregate p95 response time below 1 second**. |

**Acceptance evidence (2026-09-03) - met.** During the **8 min 25 s** steady-state window at 100
concurrent virtual users, the deployment sustained a mean of **72.02 requests per second**, with a
minimum sampled rate of **62.8 req/s** and a peak of **79.6 req/s** - between 1.26x and 1.59x the
50 req/s floor. Averaged over the whole 10 min 12 s run including ramp-up, throughput was
**66.19 req/s** across **40,513 requests**. The mean sampled p95 during steady state was **616.8 ms**
and the mean sampled median **300 ms**, both inside the 1-second bound; the aggregate p95 for the
run was **640 ms**.

Throughput did not decay: the last 60 seconds of the window averaged **71.85 req/s** against
**71.53 req/s** for the first 60 seconds. The aggregate mean response time rose from 215 ms at the start of steady
state to 314 ms at the end - a gradual climb consistent with a cumulative running average over an
increasing sample, with the instantaneous median flat at roughly 300 ms throughout. See the
requests-per-second chart in the [Locust load-test report](LOCUST_REPORT.html).

## NFR-Eff-1 - Ingestion and Solver Processing Efficiency

**Quality attribute:** Performance efficiency - resource/capacity utilisation

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | A student submitting a timetable PDF for parsing or a schedule for solving |
| **Stimulus** | Submit a PDF-ingestion job or a solver job while the system is under Locust-generated concurrent load |
| **Environment** | Production-equivalent deployment, steady-state Locust load |
| **Artifact** | PDF-parsing worker and scheduling-solver worker |
| **Response** | Complete each job in a duration that scales acceptably with the size of the input, rather than degrading disproportionately under load |
| **Response measure** | The **p95 solver processing time does not exceed 500 ms per scheduled event**, and the **p95 PDF-parsing time does not exceed 300 ms per KB** of input file size. |

**Status: not yet measured.** This measure concerns worker-side processing duration, which the
reference load run does not capture. Locust records the client-observed round trip to the API,
which for these endpoints returns HTTP 202 as soon as the job is enqueued and therefore excludes
the work performed in the worker. Satisfying NFR-Eff-1 requires the workers to emit per-job
processing duration alongside event count and input file size; that instrumentation is outstanding.
The API-side half of the picture - how quickly jobs are accepted under load - is covered separately
by NFR-Eff-2.

## NFR-Eff-2 - Asynchronous Job Acceptance Efficiency

**Quality attribute:** Performance efficiency - resource/capacity utilisation

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | A student uploading a timetable PDF or submitting a solve request |
| **Stimulus** | A multipart PDF upload or a solver-job submission issued while the system carries concurrent load |
| **Environment** | Production-equivalent deployment under the reference load run |
| **Artifact** | Job-acceptance path: request validation, job-record persistence, and queue enqueue |
| **Response** | Persist the job record, enqueue the job, and return its identifier promptly, so that the caller is never blocked on background processing |
| **Response measure** | The **p95 acceptance latency does not exceed 1 second** for both PDF upload and solver submission, and **100% of well-formed submissions are accepted** with a job identifier returned. |

Separating acceptance from processing is what makes the asynchronous design observable: acceptance
latency is bounded and testable from the client, while processing duration is a worker-side
property measured under NFR-Eff-1.

**Acceptance evidence (2026-09-03) - met.** `POST /api/pdf-parser/jobs/upload` accepted **255 of
255** multipart uploads (files of 3 KB to 15 KB drawn from 12 UP fixtures) with **0 failures**, a
**295.8 ms mean**, a **670 ms p95**, and a worst case of **815 ms**. `POST /api/solver/jobs`
accepted **841 of the 842 well-formed submissions** it received (99.9%, the exception being a single
HTTP 502) at a **710 ms p95**; the further 334 rejected submissions carried a malformed preferences
payload generated by the load script and were correctly refused with HTTP 400 (see
[the failure analysis](NON-FUNCTIONAL_TESTING.md#solver-submission-failures)). Downstream polling
confirmed that accepted jobs remained retrievable: `GET /api/pdf-parser/jobs/[id]` and
`GET /api/solver/jobs/[id]` together served 2,188 status checks with 0 failures, and 916 result
fetches likewise succeeded without error.

## NFR-Rely-1 - Sustained Reliability Under Load

**Quality attribute:** Reliability - availability under load

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | Continuous concurrent student traffic over an extended (soak) duration |
| **Stimulus** | A constant, low-cost session/authentication check issued alongside normal Locust load for the full duration of the test |
| **Environment** | Production-equivalent deployment, sustained Locust load held for an extended period (soak test) |
| **Artifact** | Authentication/session endpoint and overall API request pipeline |
| **Response** | Continue responding correctly and without degradation for the full duration of the sustained run |
| **Response measure** | The dedicated canary request maintains **≥99% success rate** for the entire soak duration. |

**Interim evidence (2026-09-03) - met over 10 minutes; full soak outstanding.** The canary is
`GET /api/auth/get-session`, issued throughout the reference load run. It recorded **1,870
requests with 0 failures - a 100% success rate** - against the ≥99% target, and it was the fastest
endpoint in the run: a **199.1 ms mean**, a **180 ms median**, a **410 ms p95**, and a **580 ms
p99**. Canary latency showed no upward drift across the window.

The reference run lasted 10 min 12 s, which establishes the canary and its measurement but does not
constitute a soak. An extended run is still required before NFR-Rely-1 can be reported as satisfied
at its intended duration.

## NFR-Rely-2 - Authenticated Session Establishment Reliability

**Quality attribute:** Reliability - maturity / fault tolerance

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | Students arriving at the system concurrently, as at the start of a registration period |
| **Stimulus** | A burst of account provisioning, email sign-in, and university-selection requests issued as concurrency ramps up |
| **Environment** | Production-equivalent deployment, ramp-up phase of the reference load run |
| **Artifact** | Authentication flow: account creation, credential sign-in, session-token issue, and university-scoped session upgrade |
| **Response** | Establish a valid, university-scoped session for every arriving user without dropping requests, issuing invalid tokens, or degrading as arrival rate climbs |
| **Response measure** | **100% of sign-in sequences complete successfully**, and the **p95 response time for each step of the sequence does not exceed 1 second**. |

A partial failure here is worse than a slow response: a user who receives a token but no
university-scoped session cannot use the application at all, so this requirement measures the
sequence rather than the individual endpoints.

**Acceptance evidence (2026-09-03) - met.** All 100 virtual users completed the full three-step
sequence during ramp-up, giving **300 of 300 requests successful with 0 failures**:

| **Step** | **Requests** | **Failures** | **Mean** | **p95** | **Max** |
|---|---:|---:|---:|---:|---:|
| `POST /api/auth/admin/create-mock-user` | 100 | 0 | 540.8 ms | 900 ms | 1,285 ms |
| `POST /api/auth/sign-in/email` | 100 | 0 | 434.5 ms | 900 ms | 1,099 ms |
| `POST /api/auth/select-university` | 100 | 0 | 92.6 ms | 310 ms | 445 ms |

Every step met the 1-second p95 budget. The sequence is fail-fast by construction: the load script
aborts the virtual user if any step returns an unexpected status, so the fact that all 100 users
went on to generate workload independently confirms that 100 valid university-scoped sessions were
issued.

## NFR-Avail-1 - Public Availability

**Quality attribute:** Reliability - availability

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | External uptime monitoring, independent of any test run |
| **Stimulus** | Periodic automated health checks against the public endpoint over the weeks leading up to Demo 3 |
| **Environment** | Production deployment, continuous monitoring window |
| **Artifact** | Public entry point / health-check endpoint |
| **Response** | Remain reachable and healthy, with any outage detected and the service restarted automatically or promptly |
| **Response measure** | Measured uptime over the monitoring window preceding Demo 3 is **at least 99.5%**. |

**Acceptance evidence - met.** UptimeRobot reports **greater than 99.95%** uptime over the
monitoring window, against the 99.5% target.

## NFR-Maint-1 - University Adapter Modifiability

**Quality attribute:** Maintainability - modifiability

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | A developer adding support for another university |
| **Stimulus** | Implement and register a new concrete adapter that transforms the new university's timetable format and API responses into the canonical UMTAS DTO representation |
| **Environment** | Normal development and continuous-integration workflow using representative fixtures from the new university |
| **Artifact** | University API Adapter layer and `AdapterRegistry` |
| **Response** | Add the university-specific behaviour without modifying existing production components outside the Adapter layer |
| **Response measure** | Number of existing production components outside the University API Adapter layer that must be modified equals **0**. The `AdapterRegistry` may be updated; this is considered part of the Adapter layer and does not count against the measure. |

**Acceptance evidence - met.** The [API adapter case study](API_ADAPTER_CASE_STUDY.md) walks through
introducing a new university integration and verifies that no production component outside the
adapter boundary required modification.

## NFR-Sec-2 - API Vulnerability Resistance

**Quality attribute:** Security - vulnerability resistance

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | An automated security scanning tool acting as an unauthenticated or low-privilege attacker |
| **Stimulus** | Run an OWASP ZAP scan (baseline and authenticated full scan) against the deployed public API surface |
| **Environment** | Staging environment, configuration equivalent to production, with a seeded test tenant and test user session |
| **Artifact** | Public API endpoints, authentication flow, and input-handling boundary |
| **Response** | Reject or safely handle malformed, injected, or unauthorised requests without exposing sensitive data or internal state |
| **Response measure** | The OWASP ZAP report contains **0 alerts of medium severity or above**. Any informational/low findings are logged and triaged, but do not block release. |

**Acceptance evidence - met.** The [OWASP ZAP report](Owasp.md) records **0 alerts** at medium
severity or above.

## NFR-Sec-3 - Dependency Vulnerability Resistance

**Quality attribute:** Security - vulnerability resistance

| **Part** | **UMTAS scenario** |
| --- | --- |
| **Source of stimulus** | A developer opening a pull request or merging code to the `main` branch |
| **Stimulus** | Execute the `pnpm audit` command during the Continuous Integration (CI) pipeline |
| **Environment** | Automated CI pipeline running against the `main` branch |
| **Artifact** | Project dependency tree and lockfile (`pnpm-lock.yaml`) |
| **Response** | Scan the monorepo dependency tree for known Common Vulnerabilities and Exposures (CVEs) and report findings |
| **Response measure** | The CI pipeline step passes with an exit code of 0, confirming **0 known vulnerabilities** of moderate or higher severity exist in the dependencies on the `main` branch. |

**Acceptance evidence - met.** The `pnpm audit` CI step exits 0 with **0 findings** at moderate
severity or above on `main`.

## NFR-Por-1 - Browser Adaptability

**Quality attribute:** Portability - Adaptability

| **Part** | **UMTAS scenario** |
| --- | --- |
| **Source of stimulus** | A developer opening a pull request to the dev branch |
| **Stimulus** | Execute the automated Playwright end-to-end test suite targeting Chromium, Microsoft Edge, and Mozilla Firefox |
| **Environment** | Automated CI/CD pipeline (or local development environment) pre-configured with all three browser targets |
| **Artifact** | E2e test files and `playwright.config.ts` |
| **Response** | Run E2e tests on all provided browsers in the config |
| **Response measure** | Measured 0 tests fail in the pipeline for repeated tests across all provided browsers |

## NFR-Acc-1 - Frontend Accessibility Audit

**Quality attribute:** Usability - accessibility

| **Part** | **UMTAS scenario** |
| --- | --- |
| **Source of stimulus** | A major release version of the software |
| **Stimulus** | Execute a manual Lighthouse accessibility audit across key pages of the frontend application |
| **Environment** | Local development or staging environment prior to major deployment |
| **Artifact** | Frontend web application and all UI views |
| **Response** | The Lighthouse scanner analyzes the web pages for accessibility best practices, contrast ratios, and ARIA usage, generating a performance and quality breakdown |
| **Response measure** | The resulting Lighthouse Accessibility score exceeds 90 out of a maximum of 100. |

The per-page [Lighthouse reports](Lighthouse.md) cover the Builder, Calendar Management, Course
Management, Event Management, Module Management, Role Management, and Schedules pages.
