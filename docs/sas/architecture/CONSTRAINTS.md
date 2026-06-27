# Architectural Constraints

## Constraints Table

| ID | Category | Constraint | Source / Rationale | Architectural Impact | Verification | Compliance Status |
|---|---|---|---|---|---|---|
| AC-01 | External integration | The system shall integrate with Google Calendar and follow Google's OAuth 2.0 authorization model. | Client and feature requirements | Requires server-managed OAuth flow, token lifecycle handling, and calendar export boundary in the Core | Calendar export test flow and OAuth conformance review | Documented, implementation evidence still required |
| AC-02 | Language boundary | The scheduling service shall expose an HTTP API because it runs outside the main TypeScript application boundary. | Approved split between TypeScript Core and Python solver | Favors a simple service contract and self-documenting API over language-specific RPC | API contract tests and OpenAPI inspection | Documented |
| AC-03 | External data format | The first supported timetable PDF format shall be the University of Pretoria layout. | Project scope for initial delivery | Requires adapter-based parsing and contract tests against UP samples | Parse test fixtures and acceptance test using UP PDFs | Documented |
| AC-04 | Runtime environment | All major services shall be containerisable and runnable on a Linux host. | Deployment and team operations context | Drives stateless service boundaries, container-first local setup, and reverse-proxy ingress | Container build and deployment smoke tests | Documented |
| AC-05 | Network and ingress | Public traffic shall enter through a single reverse-proxy boundary that handles HTTPS and routing. | Security and deployment planning | Centralises TLS termination, routing policy, and horizontal scaling strategy | HTTPS endpoint verification and ingress health checks | Documented |
| AC-06 | Access surface | The system shall be delivered as a browser-based web application, not a native mobile app. | Client and course scope | Frontend must support responsive layouts and accessible browser flows | Cross-browser and responsive UI testing | Documented |
| AC-07 | Delivery model | Demo 2 shall be publicly reachable via a non-local URL. Local-only demos are not acceptable. | Demo 2 instructions | Requires at least one non-local deployed environment and documented access path | Public URL verification on demo day | Partially evidenced; final Demo 2 URL not recorded here |
| AC-08 | Reproducibility | A fresh clone of the main branch shall be deployable from documented instructions without click-ops. | Demo 2 instructions | Requires scripted infrastructure, environment documentation, and versioned deployment assets | Fresh-clone deployment test | Planned, evidence gap remains |
| AC-09 | Secrets handling | Credentials, API keys, and connection strings shall not be committed to the repository. | Demo 2 instructions and standard security practice | Requires environment-based configuration and secret injection in CI and runtime | Secret scan and repo review | Documented |
| AC-10 | Failure recovery | A worker crash during PDF parsing or timetable generation shall not silently lose the job. | Explicit reliability concern in SAS prompts and queue-based design | Requires durable job-state handling, retries, and dead-letter or failure visibility | Crash simulation and retry-path test | Documented |
| AC-11 | Tenant isolation | Custom-university workspaces shall remain private to the owning student in Demo 2. | Current Q&A decisions for custom mode | Requires tenant-scoped writes, auth checks, and separation of supported vs custom workspaces | Authorization tests across tenant boundaries | Documented, final RBAC evidence pending |
| AC-12 | Monorepo operations | The repository shall support a single team workflow across frontend, backend, and Python services. | Team setup and developer-experience plans | Drives workspace tooling, shared scripts, and container-assisted local development | Fresh-dev bootstrap test | Documented |
| AC-13 | Future simulation scale | The architecture shall permit solver and parser capacity to grow independently toward large-scale `20,000+` simulation workloads without redesigning the Core API. | Deferred Tyto workload has already shaped system boundaries | Requires queue buffering, stateless workers, and independently scalable compute sidecars | Queue-depth load test and multi-worker scale test | Architectural target, not yet proven |
| AC-14 | Environment separation | The Demo 2 brief expects development, staging, and production to be distinguishable. | Demo 2 instructions and deployment checklist | Prevents treating the integration branch as an undocumented substitute for staging | Environment inventory and non-local URL verification | Known compliance gap: no separate staging evidence in this workspace |

## High-Impact Constraints

`AC-02`, `AC-04`, `AC-05`, `AC-08`, `AC-10`, and `AC-14` shape the architecture most strongly.
They keep orchestration in the Core, move expensive work off the request path, require
reproducible deployment, and leave staging as an explicit gap. `AC-11` also drives tenant-scoped
authorization for custom workspaces.

## Scope Qualification

The `20,000+` workload is a future scale driver, not a Demo 2 runtime promise. It justifies
asynchronous processing and extracted compute, but it has not been demonstrated in this workspace.
