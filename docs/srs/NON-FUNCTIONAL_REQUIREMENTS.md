# Non-Functional Requirements

These five primary requirements are derived from the client's stated success criteria: correct
University of Pretoria PDF extraction, conflict-free schedules, privacy-preserving administration,
university-scale simulation, and university-specific adapters that do not alter the core. They are
acceptance targets, not claims that the corresponding tests have already passed.

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
| **NFR-Eff-1** | Performance efficiency | Resource/capacity utilisation | M | M |
| **NFR-Rely-1** | Reliability | Availability under load | H | M |
| **NFR-Avail-1** | Reliability | Availability | M | L |

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

## NFR-Maint-1 - University Adapter Modifiability

**Quality attribute:** Maintainability - modifiability

| **Part** | **UMTAS scenario** |
|---|---|
| **Source of stimulus** | A developer adding support for another university |
| **Stimulus** | Implement and register an adapter that transforms the new university's timetable format into the canonical import representation |
| **Environment** | Normal development and continuous-integration workflow using representative fixtures |
| **Artifact** | University ingestion extension point |
| **Response** | Add the university-specific behaviour without altering unrelated application behaviour or existing adapters |
| **Response measure** | The change modifies **0 Core API, persistent-schema, queue-contract, worker-orchestration, or existing-adapter implementation files**. Changes remain confined to the new adapter, registration/configuration, fixtures, and tests, and **100% of canonical contract and existing-adapter regression tests pass**. |

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