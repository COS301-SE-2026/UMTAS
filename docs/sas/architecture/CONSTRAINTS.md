# Architectural Constraints

## Scope

This page records limitations and restrictions that shape the architecture. It does not repeat every
quality target from the SRS or every deployment mechanism from the deployment section. Design choices
such as Traefik, queue-backed processing, and stateless workers are treated as architectural responses
to these constraints.

## Constraints Table

| ID | Category | Constraint | Source / Rationale | Architectural Impact | Verification | Compliance Status |
|---|---|---|---|---|---|---|
| AC-01 | Client architecture | UMTAS shall use a Core-and-Adapter architecture where university-specific connectors can be added without changing Core scheduling logic. | Client proposal: "Core-and-Adapter Pattern" and modular university-agnostic platform goal | Requires a stable canonical timetable model, adapter boundary, parser contracts, and Core-owned orchestration | Adapter contract tests and architecture conformance review | Documented |
| AC-02 | External data availability | The system shall not depend on a live university API during development; the first supported ingestion path shall handle offline/static timetable sources. | Client proposal constraints and current UP timetable source reality | Requires a PDF adapter path, fixture-driven parser tests, and import flows that can run without university network access | UP PDF parse fixtures and acceptance test against static samples | Documented |
| AC-03 | Initial format scope | The first supported timetable PDF format shall be the University of Pretoria layout. | Client proposal and project scope for initial delivery | Keeps adapter implementation focused while preserving the ability to add other university adapters later | Parse test fixtures and acceptance test using UP PDFs | Documented |
| AC-04 | Calendar provider access | Google Calendar integration shall use OAuth 2.0 and request write-only calendar access; it shall not read existing student calendar events. | Client proposal constraint and Google OAuth provider model | Requires server-managed OAuth flow, token lifecycle handling, least-privilege scopes, and calendar export isolation in the Core | OAuth scope review and calendar export integration test | Documented, implementation evidence still required |
| AC-05 | Privacy and compliance | Individual student schedules shall never be visible to university administrators, and analytics data shall be anonymised before it reaches admin-facing aggregation. | Client proposal: privacy-first architecture, POPIA/GDPR compliance, and admin aggregate-only visibility | Requires tenant and role authorization, anonymisation boundary, aggregate-only analytics schemas, and UUID dissociation before admin metrics | Authorization tests, anonymisation tests, and deliberate re-identification review | Documented, final RBAC evidence pending |
| AC-06 | Simulation scale | The architecture shall sustain or simulate 20,000+ concurrent scheduling users as a primary client scale driver. | Client proposal: horizontal scalability and Simulation Scale success criterion | Requires async processing, queue buffering, stateless API and compute services, independent parser/solver scaling, and load-testable simulation tooling | Locust or equivalent load test, queue-depth test, and multi-worker scale test | Architectural target, not yet proven |
| AC-07 | Simulation service reuse | The synthetic-user simulation service shall be delivered as a standalone, documented module reusable by Tyto outside this project. | Client proposal: decoupled simulation service and delivery requirements | Requires a separate service boundary, documented configuration, exportable stress-test profiles, and limited coupling to UMTAS internals | Service README/runbook review and standalone smoke test | Documented |
| AC-08 | Runtime environment | The deployed system shall run on a Tyto-provided Ubuntu server and all major services shall be fully Dockerised/containerisable. | Client proposal and university reproducibility requirement | Drives Linux-compatible services, Docker Compose/deployment assets, environment-based configuration, and container-first handoff | Container build, Ubuntu deployment smoke test, and fresh-clone deployment runbook test | Documented |
| AC-09 | Network and ingress | Public traffic shall enter through a single reverse-proxy boundary that terminates HTTPS before routing raw HTTP to internal services. | Team deployment decision supporting Docker scaling, central TLS handling, and simpler internal service communication | Centralises TLS termination, routing policy, service discovery, and horizontal scaling behind Traefik | HTTPS endpoint verification, Traefik routing review, and internal-network inspection | Documented |
| AC-10 | Public Demo 2 deployment | Demo 2 shall be reachable through a public non-local URL, and main shall deploy to at least one non-local environment automatically. | Demo 2 instructions | Requires CI/CD integration, externally reachable hosting, and documented deployment target | Public URL verification and pipeline run evidence | Partially evidenced; final Demo 2 URL not recorded here |
| AC-11 | Reproducible handoff | A fresh clone of main shall be deployable from repository instructions without click-ops. | Demo 2 instructions and client deployment runbook requirement | Requires versioned deployment assets, `.env.example`, scripted setup, and a Tyto sysadmin runbook | Fresh-clone deployment test | Planned, evidence gap remains |
| AC-12 | Secrets handling | Credentials, API keys, OAuth secrets, and connection strings shall not be committed to the repository. | Demo 2 instructions and standard security practice | Requires environment-based configuration, secret injection in CI/runtime, and documented variable inventory | Secret scan and repository review | Documented |
| AC-13 | API documentation | Backend endpoints shall be documented using OpenAPI 3.0. | Client proposal delivery requirement for adapter authors and future integrations | Requires schema-backed API contracts and reviewable integration documentation | OpenAPI inspection and API contract tests | Documented, complete checked-in inventory still pending |
| AC-14 | Environment separation | Development, staging, and production environments shall be distinguishable for Demo 2. | Demo 2 deployment requirements | Prevents treating a local setup or integration branch as an undocumented staging substitute | Environment inventory and non-local URL verification | Known compliance gap: separate staging evidence not recorded here |

## High-Impact Constraints

`AC-01`, `AC-05`, `AC-06`, `AC-08`, `AC-09`, `AC-11`, and `AC-13` shape the architecture most
strongly. Together they explain the Core-and-Adapter split, async worker boundary, stateless compute
services, Docker-based deployment model, single Traefik ingress, and schema-first API documentation.

## Constraint Boundaries

- The `20,000+` workload is a client scale driver and simulation success criterion, not a claim that
  Demo 2 production traffic will contain 20,000 real users.
- Dockerisation is both a university reproducibility expectation and a client handoff requirement for
  the Tyto Ubuntu server.
- Traefik is the chosen implementation of the single-ingress constraint. The architectural constraint
  is centralised HTTPS termination and routing; the technology choice is documented in the technology
  and deployment sections.
- Worker crash recovery, retries, and dead-letter visibility are reliability mechanisms. They belong
  primarily in the quality mapping unless a client or course source makes them a hard constraint.
