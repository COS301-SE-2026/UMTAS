# Architectural Requirements

## Architecture Requirements

| ID | Requirement | Architectural Response |
|---|---|---|
| AR-01 | UMTAS shall use a client-server architecture for all user-facing workflows. | Browsers call the Core API only, never queues, compute services, databases, object storage, or providers directly. |
| AR-02 | UMTAS shall use a Core-and-Adapter architecture for university-specific timetable sources. | PDF and future API adapters translate external formats into canonical UMTAS timetable structures. |
| AR-03 | The Core API shall remain the orchestration and policy boundary. | Auth, authorization, validation, persistence coordination, calendar orchestration, job creation, and job-state exposure stay in the Core. |
| AR-04 | Long-running parse and solve work shall run asynchronously. | The Core creates jobs; workers call parser or solver services and persist terminal results for browser polling. |
| AR-05 | Parser and solver services shall be stateless compute services. | They receive bounded requests, return results, and do not own persistent domain state. |
| AR-06 | University analytics shall be privacy-first. | Admin dashboards use anonymised or aggregate metrics, not individual student schedules. |
| AR-07 | The architecture shall support the client-stated 20,000+ user scale target. | Browser traffic, Core API instances, queue workers, parser services, and solver services must be horizontally scalable. |
| AR-08 | Backend integration points shall be OpenAPI-first. | Core API and integration boundaries must be documented with OpenAPI 3.0-compatible contracts. |
| AR-09 | Calendar integration shall be isolated behind the Core API. | OAuth handling, token storage, Google Calendar writes, and `.ics` export generation are Core-owned concerns. |
| AR-10 | The architecture shall document a reusable simulation-service boundary. | Simulation is a client requirement for Tyto reuse; full implementation is outside the Demo 2 feature scope. |

## Major Components

| Component | Responsibility | State Ownership |
|---|---|---|
| Browser clients | Student, lecturer, admin, and public-entry workflows | None |
| Core API | Auth, policy, orchestration, persistence coordination, calendar integration, and job state | Authoritative application state |
| Core-owned workers | Queued parse and solve execution | None |
| PDF parser service | Supported university PDF extraction and normalization | None |
| Solver service | Clash-free or preference-ranked timetable generation | None |
| University adapters | Source-specific format translation | None |
| Analytics boundary | Aggregate venue and demand metrics | Aggregate analytics state |
| Simulation boundary | Synthetic load and reusable stress-test profiles | Separate simulation data |
| Platform services | Database, cache, queue backing, object storage, ingress, and observability | Infrastructure state |
| External providers | OAuth identity, Google Calendar, and future university systems | External state |

## Communication Requirements

| Communication Style | Required Use |
|---|---|
| Synchronous request-response | Auth, timetable management, calendar operations, admin actions, analytics reads, and job-status reads |
| Queue-backed async processing | PDF parsing, timetable solving, and other long-running work |
| Internal service calls | Worker-to-parser and worker-to-solver HTTP calls |
| Polling-based completion | Browser reads of Core job states: `queued`, `running`, `succeeded`, `failed` |
| Adapter-mediated integration | University source variation and provider-specific integration behavior |