# Non-Functional Requirements

<a id="evidence-and-test-reports"></a>

The [NFR testing matrix](../evidence/nfr/NON-FUNCTIONAL_TESTING.md) links each release measure to its repeatable command and evidence. Each requirement states its own test environment.

The evidence set comprises the [Locust report](../evidence/nfr/LOCUST_REPORT.html), [soak report](../evidence/nfr/records/soak-report.html), [worker timings](../evidence/nfr/records/worker-timings.txt), [privacy test](../evidence/nfr/records/privacy-test.txt), [ZAP report](../evidence/nfr/ZAP_REPORT.pdf), [Lighthouse reports](../evidence/nfr/Lighthouse.md), [browser reports](../evidence/nfr/records/playwright-chromium/index.html), [availability export](../evidence/nfr/records/uptime-export.csv), [parser suite](../evidence/nfr/records/parser-suite.txt), [solver regression](../evidence/nfr/records/solver-regression.txt), [dependency audit](../evidence/nfr/records/dependency-audit.txt) and [adapter case study](../evidence/nfr/API_ADAPTER_CASE_STUDY.md).

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

## Production Load Profile

The shared [Locust report](../evidence/nfr/LOCUST_REPORT.html) records the production workload, endpoint measurements and run configuration.

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

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/records/parser-suite.txt).

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

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/records/solver-regression.txt).

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

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/records/privacy-test.txt) and the [boundary unit tests](../evidence/nfr/records/analytics-boundary-unit-tests.txt).

## NFR-Scale-1 - University-Scale Scheduling Workload

**Quality attribute:** Flexibility - scalability

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | The synthetic student simulation workload |
| **Stimulus** | Generate a representative scheduling workload for a university serving 20,000 users per day |
| **Environment** | Production deployment on the client-provided server, following a documented ramp-up to 100 concurrent virtual users |
| **Artifact** | Public API, scheduling-job submission path, status retrieval path, and background-processing capacity |
| **Response** | Continue accepting valid requests, expose job status, apply back-pressure when necessary, and preserve every accepted job |
| **Response measure** | At **100 concurrent virtual users** for at least **5 minutes** of steady state, at least **99% of well-formed synchronous submission and status requests succeed** and their **p95 response time does not exceed 2 seconds**. Accepted jobs must return an identifier. Queue-completion time, maximum queue depth, and production-host resource use are outside this measure. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/LOCUST_REPORT.html).

## NFR-Perf-1 - Everyday Scheduling Responsiveness

**Quality attribute:** Performance efficiency - time behaviour

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | Concurrent student usage (module browsing, enrolment, timetable building, solver requests) |
| **Stimulus** | A representative mix of student actions generated against the deployed API |
| **Environment** | Production deployment, steady-state window of the production load run |
| **Artifact** | Public API, in particular the scheduling-job submission and status-retrieval endpoints |
| **Response** | Serve requests within the response-time budget while maintaining a low error rate |
| **Response measure** | Across the steady-state window, the **p95 response time for submission and status endpoints does not exceed 2 seconds**, and the **overall request success rate is at least 99%**. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/LOCUST_REPORT.html).

## NFR-Perf-2 - Interactive Read Responsiveness

**Quality attribute:** Performance efficiency - time behaviour

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | A student navigating the application: opening the module catalogue, listing events for an enrolled module, opening the timetable builder, and reviewing attendance |
| **Stimulus** | Read requests issued as part of ordinary browsing while the system carries concurrent write and solver traffic |
| **Environment** | Production deployment under the production load run |
| **Artifact** | Student-facing read endpoints of the public API |
| **Response** | Return the requested collection quickly enough that navigation feels immediate, without degrading as concurrent write traffic continues |
| **Response measure** | For every student-facing read (`GET`) endpoint, the **p95 response time does not exceed 1 second**, the **mean response time does not exceed 500 ms**, and the **success rate is 100%**. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/LOCUST_REPORT.html).

## NFR-Cap-1 - Sustained Request Throughput

**Quality attribute:** Performance efficiency - capacity

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | Concurrent student traffic generated by the Locust workload |
| **Stimulus** | A sustained mixed read/write request stream held at steady concurrency |
| **Environment** | Production deployment, steady-state portion of the production load run |
| **Artifact** | Public API request pipeline, application server, and database connection pool |
| **Response** | Absorb the offered request rate for the full steady-state window without throughput collapse, latency runaway, or a rising error rate |
| **Response measure** | The deployment sustains at least **50 requests per second** in aggregate for a steady-state window of at least **5 minutes**, while holding the **success rate at or above 99%** and the **aggregate p95 response time below 1 second**. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/LOCUST_REPORT.html).

## NFR-Eff-1 - Ingestion and Solver Processing Efficiency

**Quality attribute:** Performance efficiency - resource/capacity utilisation

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | A student submitting a timetable PDF for parsing or a schedule for solving |
| **Stimulus** | Submit a PDF-ingestion job or a solver job while the system is under Locust-generated concurrent load |
| **Environment** | Production deployment, steady-state Locust load |
| **Artifact** | PDF-parsing worker and scheduling-solver worker |
| **Response** | Complete each job in a duration that scales acceptably with the size of the input, rather than degrading disproportionately under load |
| **Response measure** | The **p95 solver processing time does not exceed 500 ms per scheduled event**, and the **p95 PDF-parsing time does not exceed 300 ms per KB** of input file size. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/records/worker-timings.txt).

## NFR-Eff-2 - Asynchronous Job Acceptance Efficiency

**Quality attribute:** Performance efficiency - resource/capacity utilisation

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | A student uploading a timetable PDF or submitting a solve request |
| **Stimulus** | A multipart PDF upload or a solver-job submission issued while the system carries concurrent load |
| **Environment** | Production deployment under the production load run |
| **Artifact** | Job-acceptance path: request validation, job-record persistence, and queue enqueue |
| **Response** | Persist the job record, enqueue the job, and return its identifier promptly, so that the caller is never blocked on background processing |
| **Response measure** | The **p95 acceptance latency does not exceed 1 second** for both PDF upload and solver submission, and **100% of well-formed submissions are accepted** with a job identifier returned. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/LOCUST_REPORT.html).

## NFR-Rely-1 - Sustained Reliability Under Load

**Quality attribute:** Reliability - availability under load

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | Continuous concurrent student traffic over an extended (soak) duration |
| **Stimulus** | A constant, low-cost session/authentication check issued alongside normal Locust load for the full duration of the test |
| **Environment** | Production deployment, sustained Locust load held for an extended period (soak test) |
| **Artifact** | Authentication/session endpoint and overall API request pipeline |
| **Response** | Continue responding correctly and without degradation for the full duration of the sustained run |
| **Response measure** | The dedicated canary request maintains **at least 99% success rate** for the entire soak duration. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/records/soak-report.html).

## NFR-Rely-2 - Authenticated Session Establishment Reliability

**Quality attribute:** Reliability - maturity / fault tolerance

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | Students arriving at the system concurrently, as at the start of a registration period |
| **Stimulus** | A burst of account provisioning, email sign-in, and university-selection requests issued as concurrency ramps up |
| **Environment** | Production deployment, ramp-up phase of the production load run |
| **Artifact** | Authentication flow: account creation, credential sign-in, session-token issue, and university-scoped session upgrade |
| **Response** | Establish a valid, university-scoped session for every arriving user without dropping requests, issuing invalid tokens, or degrading as arrival rate climbs |
| **Response measure** | **100% of sign-in sequences complete successfully**, and the **p95 response time for each step of the sequence does not exceed 1 second**. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/LOCUST_REPORT.html).

## NFR-Avail-1 - Public Availability

**Quality attribute:** Reliability - availability

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | External uptime monitoring, independent of any test run |
| **Stimulus** | Periodic automated health checks against the public endpoint over a dated monitoring window covering the release |
| **Environment** | Production deployment, continuous monitoring window |
| **Artifact** | Public entry point / health-check endpoint |
| **Response** | Remain reachable and healthy, with any outage detected and the service restarted automatically or promptly |
| **Response measure** | Measured uptime over a stated 30-day monitoring window that includes the assessed Demo 4 release is **at least 99.5%**. The report must identify its start and end dates and the monitored endpoint. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/records/uptime-export.csv).

## NFR-Maint-1 - University Adapter Modifiability

**Quality attribute:** Maintainability - modifiability

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | A developer adding support for another university |
| **Stimulus** | Add a new concrete adapter that transforms the new university's timetable format into the canonical UMTAS representation |
| **Environment** | Normal development and continuous-integration workflow using representative fixtures from the new university |
| **Artifact** | University adapter layer (`apps/pdf_parser/parser/adapters/`) and parser registry (`apps/pdf_parser/parser/registry.py`) |
| **Response** | Add the university-specific behaviour without modifying existing production components outside the Adapter layer |
| **Response measure** | Number of existing production components outside the university adapter layer that must be modified equals **0**. The parser registry discovers every adapter class that subclasses `BasePDFParser` and declares an `ADAPTER_KEY`, so adding an adapter requires no change to the registry. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/API_ADAPTER_CASE_STUDY.md).

## NFR-Sec-2 - API Vulnerability Resistance

**Quality attribute:** Security - vulnerability resistance

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | An automated security scanning tool acting as an unauthenticated or low-privilege attacker |
| **Stimulus** | Run OWASP ZAP baseline and authenticated passive scans against the deployed public surface |
| **Environment** | Production deployment, with a dedicated synthetic test account for the authenticated scan |
| **Artifact** | Public API endpoints, authentication flow, and input-handling boundary |
| **Response** | Reject or safely handle malformed, injected, or unauthorised requests without exposing sensitive data or internal state |
| **Response measure** | The OWASP ZAP report contains **0 alerts of medium severity or above**. Any informational/low findings are logged and triaged, but do not block release. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/ZAP_REPORT.pdf).

## NFR-Sec-3 - Dependency Vulnerability Resistance

**Quality attribute:** Security - vulnerability resistance

| **Part** | **UMTAS scenario** |
| --- |---|
| **Source of stimulus** | A developer opening a pull request or merging code to the `main` branch |
| **Stimulus** | Execute `pnpm audit --audit-level=moderate --prod` in the release test environment and the Continuous Integration (CI) pipeline |
| **Environment** | Release test environment and the automated CI pipeline, both running against the `main` branch |
| **Artifact** | Project dependency tree and lockfile (`pnpm-lock.yaml`) |
| **Response** | Scan the monorepo dependency tree for known Common Vulnerabilities and Exposures (CVEs) and report findings |
| **Response measure** | The CI pipeline step passes with an exit code of 0, confirming **0 known vulnerabilities** of moderate or higher severity exist in the production dependencies on the `main` branch. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/records/dependency-audit.txt).

## NFR-Por-1 - Browser Adaptability

**Quality attribute:** Portability - adaptability

| **Part** | **UMTAS scenario** |
| --- |---|
| **Source of stimulus** | A developer opening a pull request to the dev branch |
| **Stimulus** | Execute the automated Playwright end-to-end test suite targeting Chromium, Microsoft Edge, and Mozilla Firefox |
| **Environment** | Automated CI/CD pipeline (or local development environment) pre-configured with all three browser targets |
| **Artifact** | E2e test files and `playwright.config.ts` |
| **Response** | Run E2e tests on all provided browsers in the config |
| **Response measure** | **0 tests fail** across Chromium, Microsoft Edge and Mozilla Firefox. |

**Acceptance evidence:** The requirement is met; see the [Chromium](../evidence/nfr/records/playwright-chromium/index.html), [Firefox](../evidence/nfr/records/playwright-firefox/index.html) and [Edge](../evidence/nfr/records/playwright-edge/index.html) reports.

## NFR-Acc-1 - Frontend Accessibility Audit

**Quality attribute:** Usability - accessibility

| **Part** | **UMTAS scenario** |
| --- |---|
| **Source of stimulus** | A major release version of the software |
| **Stimulus** | Execute a manual Lighthouse accessibility audit across key pages of the frontend application |
| **Environment** | Production deployment during the release audit |
| **Artifact** | Frontend web application and all UI views |
| **Response** | The Lighthouse scanner analyses each page for accessibility best practices, contrast ratios, and ARIA usage, and reports an accessibility score |
| **Response measure** | The Lighthouse Accessibility score **exceeds 90** out of a maximum of 100 on each audited page. |

**Acceptance evidence:** The requirement is met; see the [result](../evidence/nfr/Lighthouse.md).
