# Architectural Requirements

## Requirements

| **ID** | **Requirement** | **Current response / status** |
|---|---|---|
| **AR-1** | User workflows shall use a client-server boundary. | Browsers call the Core API rather than internal data or compute services. |
| **AR-2** | University-specific import formats shall use adapters. | The parser selects the University of Pretoria adapter and returns canonical candidates. |
| **AR-3** | The Core API shall own policy and persistent application state. | The Core validates requests, stores domain and job records, and coordinates workers. |
| **AR-4** | PDF parsing and timetable solving shall run asynchronously. | The Core enqueues BullMQ jobs and exposes status and result endpoints. |
| **AR-5** | Parser and solver compute shall remain stateless. | Workers use temporary files and return terminal results through callbacks. |
| **AR-6** | Worker callbacks shall be authenticated. | Parser and solver callbacks require a configured bearer token. |
| **AR-7** | Browser, queue, callback, and command-line boundaries shall use explicit contracts. | Swagger DTOs, shared schemas, and worker contracts define the implemented boundaries. |
| **AR-8** | Solver engines shall remain independently selectable. | Requests select CP-SAT, genetic search, or automatic CP-SAT-first fallback. |
| **AR-9** | Imported academic data shall preserve a validation state. | Parser-created modules and events are stored with `validated` set to false. |
| **AR-10** | Long-running components shall scale independently. | Core, parser-worker, and solver-worker containers have separate runtime and concurrency controls. |
| **AR-11** | University analytics shall expose aggregate information without disclosing or permitting reconstruction of individual student schedules. | Authentication and role boundaries are enforced. Analytics aggregate data using student UUIDs while excluding personally identifiable student information from the resulting statistics. |
| **AR-12** | A reusable synthetic workload shall exercise the system at the client's 20,000-user per day target. | Asynchronous job processing provides a scaling boundary, tested with the simulation service. |

## State Ownership

| **Component** | **Responsibility** | **State** |
|---|---|---|
| Browser Client | User workflows, local iCalendar generation, and job polling | Browser state only |
| Core API | Policy, orchestration, persistence, and validation | Authoritative application state |
| PDF Parser Worker | Execute queued PDF parsing jobs | Temporary files only |
| Timetable Solver Worker | Execute queued timetable solving jobs | Temporary files only |
| Relational DB | Domain, authentication, and job records | Persistent relational state |
| Message Queue | Coordinate asynchronous jobs | Operational queue state |
| Object Storage | Store uploaded PDFs | Persistent object state |

## Communication

| **Style** | **Use** |
|---|---|
| Synchronous request-response | Authentication, domain operations, job submission, status, and results |
| Asynchronous job processing | PDF parsing and timetable solving |
| Local command-line invocation | Worker-to-parser and worker-to-solver execution |
| Authenticated callback | Terminal worker result to the Core API |
| Polling | Browser reads of queued, completed, and failed jobs |
