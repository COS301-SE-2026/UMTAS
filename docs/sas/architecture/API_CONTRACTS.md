# API Contracts

<swagger-ui src="https://capstone-vigil.dns.net.za/api/docs-json" />

## Implemented Contract Standard

The committed OpenAPI document is the comprehensive system-contract catalogue,
and the generated frontend types consume its HTTP portion. NestJS decorators
provide route-specific schemas; the backend contract completion step and
`scripts/normalize-openapi.mjs` add the shared policy and system overview.
Redis/BullMQ and CLI boundaries remain runtime-typed by `packages/shared-types`;
their payloads are documented under OpenAPI components rather than represented
as HTTP paths.

### Current baseline

- The NestJS backend publishes an OpenAPI 3.0.0 document at `/api/docs-json`.
- The generated document currently contains 88 paths and 115 operations.
- The frontend generates TypeScript API types from the backend document.
- PDF parser and solver HTTP job boundaries are already present in the
  generated document.
- Parser and solver queue, CLI, and callback payloads are also represented by
  shared TypeScript/Zod contracts and fixtures.
- Google OAuth sign-in and account linking are present.
- Google Calendar synchronisation is not implemented; the frontend currently
  generates browser-side `.ics` exports. Google Maps is a direct frontend
  dependency rather than a UMTAS backend API.

### Target contract architecture

Maintain one authoritative OpenAPI document for all UMTAS HTTP interfaces:

1. **Public Core API** — frontend-facing authentication, CRUD, builder,
   timetable, academic calendar, PDF job, and solver job endpoints.
2. **Internal Worker API** — solver input retrieval and parser/solver callback
   endpoints, explicitly marked as internal and protected by the worker bearer
   token.
3. **External-provider documentation** — Google OAuth redirect/callback and
   account linking, plus Google Calendar operations if that integration is
   implemented in the future.

Redis/BullMQ messages and local CLI invocations are not HTTP interfaces and are
therefore not modelled as OpenAPI paths. Their JSON payloads remain typed
through `packages/shared-types` and are included in the same OpenAPI document as
named component schemas with transport, producer, consumer, and runtime-rule
descriptions.

### Contract policy

OpenAPI 3.0.3 is used because it is the version emitted by the installed
NestJS Swagger toolchain. A future 3.1 migration is a compatibility change.
Paths use kebab-case where introduced, operation IDs are unique and stable,
UUIDs use `format: uuid`, timestamps use RFC 3339 `date-time`, dates use
`YYYY-MM-DD`, and local time uses `HH:mm`. Public, session-cookie, and internal
bearer operations are explicitly distinguished in every operation.

#### Backend endpoint catalogue

For every controller operation, record the summary, description, operation ID,
tag, authentication requirement, parameters, request body, content types,
success response, failure responses, examples, defaults, and validation rules.
The catalogue must include Health, Auth, Modules, Courses, Universities,
Grouping, Events, Timetables, Builder, Attendance, Venues, Buildings, Map
Config, Routes, Academic Calendar, API Service, PDF Parser, and Solver.

The documented tag set must be declared centrally and use consistent casing;
for example, `Auth Admin` must not also appear as `Auth admin`.

#### Reusable schemas

Document reusable OpenAPI components for common parameters and responses,
including:

- Error, validation, unauthorized, forbidden, not-found, conflict, and rate
  limit responses.
- Job status, job error, accepted-job, and pagination structures.
- Parser results, parser annotations, solver input, solver results, and worker
  callback payloads.
- Shared UUID, timestamp, date, and time-of-day fields.

Inline duplicate schemas should be identified and consolidated in the future
implementation work.

#### Standard error contract

All documented errors should use a stable machine-readable code, human-readable
message, optional structured details, and an optional request/correlation ID.
Each code should state its HTTP status and whether retrying is appropriate.

The error-code catalogue should group codes by domain, including `AUTH_*`,
`MODULE_*`, `EVENT_*`, `TIMETABLE_*`, `PDF_*`, `SOLVER_*`, `CALENDAR_*`,
`UNIVERSITY_*`, `VALIDATION_*`, and `INTERNAL_*`. Existing worker codes such as
`SOLVER_INFEASIBLE` and `SOLVER_JOB_PROTOCOL_ERROR` must be included rather
than documented only in implementation tests.

#### PDF parser contract

Document the complete lifecycle for:

- `POST /pdf-parser/jobs/upload`
- `POST /pdf-parser/jobs/lookup`
- `GET /pdf-parser/jobs/{jobId}`
- `GET /pdf-parser/jobs/{jobId}/result`
- Internal `POST /pdf-parser/jobs/{jobId}/callback`

The documentation must specify multipart field names, required fields, maximum
file size, MIME types, adapter keys, fingerprint and hash formats, duplicate
behaviour, job states, result availability, warnings, callback authentication,
idempotency, retries, and parser failure codes.

The semantic source for parser payloads is the shared contract in
`packages/shared-types/src/parser.ts`; the OpenAPI representation must explain
its discriminated recurring/dated event shapes and validation rules.

#### Solver contract

Document job submission, status, result retrieval, internal input retrieval,
internal callbacks, attempt tokens, engine selection, solve modes, heuristic
preferences, conflict metadata, best-effort results, infeasibility, timeout,
and CP-SAT-to-GA fallback behaviour.

Cross-field rules that OpenAPI cannot express completely must be stated in the
schema descriptions and examples, including exactly one of `date` or
`dayOfWeek`, valid time ordering, conflict-count consistency, and the meaning
of `engine: auto`.

#### Google and frontend interactions

Document Google OAuth separately from calendar synchronisation:

- OAuth initiation, callback, account linking, redirects, scopes, session
  cookies, disabled-configuration behaviour, and failure handling.
- `.ics` export as a frontend-generated interoperability feature, not a Google
  Calendar API endpoint.
- Google Maps as a frontend configuration/dependency contract.

Google Calendar endpoints shall only be added to the OpenAPI contract after a
separate implementation decision defines scopes, calendar selection, event
create/update/delete semantics, idempotency, token expiry, revocation, and
Google-error translation. They are not to be documented as implemented today.

#### Frontend contract consumption

Document the required generation workflow for `apps/frontend/src/lib/api.ts`:

- Generate from the authoritative committed OpenAPI document.
- Make generation reproducible without relying on a production deployment.
- Record the contract version used by generated types.
- Ensure PDF parser, solver, authentication, academic calendar, and future
  Google flows use the same definitions.

#### Verification standard

CI validates:

- OpenAPI syntax, version, `$ref` resolution, and examples.
- Unique operation IDs and declared tags.
- Complete route coverage.
- Security declarations.
- Success and failure response schemas.
- Generated frontend types being up to date.
- Runtime responses and error codes matching the documented schemas.
- Parser and solver callback idempotency, retries, fallback, and terminal
  failure paths.

### Current completion status

The current artifact contains every discovered backend route (88 paths / 115
operations), canonical tags, explicit security, reusable error/job components,
and internal parser/solver worker operations. Google OAuth is documented from
the implemented flows. Google Calendar synchronization is explicitly not
implemented; browser `.ics` export remains the supported calendar
interoperability feature. CI runs contract validation and fails when generated
frontend types differ from the committed source document.

## Worker CLI Invocations & Integration

| Worker | CLI Invocation | Input Source | Callback Endpoint | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **PDF Parser** | `python3 -m parser_cli --adapter <adapterKey> --file <path>` | Blob storage (`fileKey`) | `POST /pdf-parser/jobs/:jobId/callback` | Only University of Pretoria adapter is registered. Outputs structured JSON. |
| **Timetable Solver** | `solver-cli --input <path> --output <path> --engine <cp-sat\|ga> --solve-mode <feasibility\|optimization>` | `GET /solver/jobs/:jobId/input` | `POST /solver/jobs/:jobId/callback?attemptToken=:attemptToken` | Tries `cp-sat` first; starts `ga` if `cp-sat` is infeasible. |

### Shared Worker Runtime
* **Job Statuses:** `Queued` (waiting/processing), `Completed` (success), `Failed` (failure). Core API is polled for status.
* **Behaviour:** Handles concurrency, timeouts, cleanup, and callback retries (3x with exponential backoff).
