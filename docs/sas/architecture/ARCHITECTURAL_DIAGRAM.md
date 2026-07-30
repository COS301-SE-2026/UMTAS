# Architectural Diagram

![Architecture Diagram](../../diagrams/architecture/Architecture.svg)

The diagram is a technology-neutral blueprint containing both the implemented Demo 2 architecture and
explicitly planned extension points. Solid components and flows are implemented; grey dashed
components and flows are planned and are not part of the current runtime.

## Interaction Sequences

### PDF parsing

![PDF parsing sequence](../../diagrams/architecture/parser-sequence.svg)

### Timetable solving

![Timetable solving sequence](../../diagrams/architecture/solver-sequence.svg)

## Component Responsibilities

| Component | Responsibility | State |
|---|---|---|
| Browser Client | Submit work and poll status | None |
| Core API | Enforce policy, persist jobs, enqueue work, and accept callbacks | Authoritative application state |
| Relational Database | Store domain records, job inputs, and results | Persistent relational state |
| Blob Storage | Store uploaded documents | Persistent object state |
| Message Queue | Buffer parse and solve jobs | Operational queue state |
| PDF Parser Worker | Download input, invoke the PDF Parser, validate output, and send a callback | Temporary files only |
| Timetable Solver Worker | Fetch input, invoke the Timetable Solver, validate output, and send a callback | Temporary files only |
| External Identity Provider | Authenticate or link a user through Google OAuth when configured | Provider-owned identity state; encrypted OAuth tokens are held by UMTAS |
| Calendar Application | Import the iCalendar file generated and downloaded by the browser | Outside UMTAS |
| Planned Solution Cache | Reuse compatible solutions across requests once the cache policy and additional solver heuristics are implemented | Not implemented |
| Planned Google Calendar Integration | Synchronise timetable events through the Google Calendar API | Not implemented |

Solver jobs and their results are ordinary records in the relational database and are therefore not
shown as a separate architectural component. The current Core computes a semantic fingerprint and
can reuse a matching per-user job record. The separately depicted solution cache is a planned
cross-request optimisation and is not yet implemented. Redis currently supports queues,
authentication secondary storage, and rate limiting; it does not currently implement the planned
solution cache.

## Data Flow

1. The browser submits parse or solve work to the Core.
2. The Core validates the request, persists a job, and publishes a small job message.
3. A worker creates temporary storage and obtains its input from blob storage or the Core.
4. The worker invokes its compute engine and validates the result.
5. The worker sends an authenticated terminal callback. Solver callbacks identify the active attempt.
6. The Core persists completed or failed status; the browser polls for status and results.

## Other Boundary Flows

1. When Google OAuth is configured, the Core authentication component communicates with Google using
   OAuth 2.0/OpenID Connect and maps the verified profile to a UMTAS user.
2. The browser can generate and download an `.ics` file from timetable data. The user imports that
   file into a calendar application. Direct Google Calendar API synchronisation is a planned flow.
3. CP-SAT and the GA engine are implemented. Additional heuristic modules and their solution-cache
   policy remain planned extensions.
4. Live university APIs are not integrated in Demo 2. University-specific input currently enters
   through uploaded PDFs selected by the parser adapter registry.
