# Service Contract 

<swagger-ui src="https://capstone-vigil.dns.net.za/api/docs-json" />

## Worker CLI Invocations & Integration

| Worker | CLI Invocation | Input Source | Callback Endpoint | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **PDF Parser** | `python3 -m parser_cli --adapter <adapterKey> --file <path>` | Blob storage (`fileKey`) | `POST /pdf-parser/jobs/:jobId/callback` | Only University of Pretoria adapter is registered. Outputs structured JSON. |
| **Timetable Solver** | `solver-cli --input <path> --output <path> --engine <cp-sat\|ga> --solve-mode <feasibility\|optimization>` | `GET /solver/jobs/:jobId/input` | `POST /solver/jobs/:jobId/callback?attemptToken=:attemptToken` | Tries `cp-sat` first; starts `ga` if `cp-sat` is infeasible. |

### Shared Worker Runtime
* **Job Statuses:** `Queued` (waiting/processing), `Completed` (success), `Failed` (failure). Core API is polled for status.
* **Behaviour:** Handles concurrency, timeouts, cleanup, and callback retries (3x with exponential backoff).