# Architectural Requirements

## Scope

This page defines UMTAS's high-level Demo 2 architecture: boundaries, responsibilities, and
communication styles. Product choices are in [Technology Requirements](./TECHNOLOGY_REQUIREMENTS.md)
and deployment details are in the deployment section.

## Architectural Position

UMTAS is a client-server system with extracted parser and solver compute services. It is not a set
of independent data-owning microservices. Persistent state is coordinated through the Core API so
auth, domain rules, orchestration, and user-visible job state stay consistent.

## Major Components

| Component | Responsibility | Owns Persistent State | Main Interactions |
|---|---|---|---|
| Browser clients | Deliver student, lecturer, university-admin, and public-entry workflows | No | Synchronous requests to the Core API |
| Core API | Auth, authorization, orchestration, domain services, persistence coordination, job-state exposure | Coordinates authoritative state | Clients, workers, adapters, storage, auth, calendar |
| Core-owned queue workers | Consume parse and solve jobs, invoke compute services, and persist terminal job results | No | Job channels, parser, solver, Core persistence |
| Solver service | Selects or optimizes clash-free timetable options from constrained inputs | No | Receives HTTP solve requests from a solve worker |
| PDF parser service | Extracts and normalizes timetable data from supported university PDF formats | No | Receives HTTP parse requests from a parse worker |
| University adapter boundary | Normalizes external university API or file formats to canonical UMTAS structures | No | Core API and external university systems |
| Shared platform services | Provide relational persistence, cache/session state, job backing, and object storage | Yes, as infrastructure state | Core API, parser, solver, workers |
| External providers | OAuth identity, Google Calendar, and university external systems | External | Core API or adapter boundary |

## System Boundaries

| Boundary | Rule |
|---|---|
| User-facing | Browsers call the Core API only, never queues, compute services, or stores directly. |
| Domain | The Core owns access control, validation, persistence coordination, and job status. |
| Compute | Parser and solver services are stateless and run specialized work outside the request path. |
| Integration | University and calendar/provider variation is isolated behind adapters. |

## Communication Model

| Style | Use |
|---|---|
| Request-response | Auth, timetable management, calendar operations, admin actions, and job-status reads. |
| Queue-backed async processing | Parse and solve jobs are submitted to Core-owned workers, which call stateless Python services over HTTP. |
| Async completion | Workers persist terminal job state; browsers poll the Core for `queued`, `running`, `succeeded`, or `failed`. |

## Demo 2 Decisions

- The Core API remains the single orchestration and policy boundary.
- Parser and solver capabilities are extracted because they have different runtime and scaling
  characteristics from the main application.
- Long-running work is asynchronous and job-oriented rather than handled inside the request path.
- External university-specific variation is handled by adapters.
- Browser-facing workflows remain behind the Core API rather than calling queues, compute services,
  or storage directly.

## Evidence Gaps

| ID | Issue | Current documented position | Impact |
|---|---|---|---|
| IQ1 | Complete checked-in API inventory missing | A live Core Swagger source is referenced, but not every boundary has checked-in schema artifacts | API contracts remain partly descriptive rather than fully schema-backed |
| IQ2/IQ3 | Worker and compute-service schemas are not checked in | The SAS resolves the path as queue -> Core-owned worker -> HTTP compute service -> worker result persistence | Implementation conformance cannot yet be verified from this workspace |
| IQ10 | Workspace RBAC combination not fully evidenced | Better Auth global roles and workspace-scoped privileges are both documented | Authorization model needs final implementation proof |
| IQ12 | Scaling mechanism not fully evidenced | Independent scaling is an architecture goal; concrete replica or auto-scaling configuration is not checked in here | Limits measurable scaling claims |

## Related Pages

- [Introduction](./INTRODUCTION.md)
- [Architectural Patterns](./ARCHITECTURAL_PATTERNS.md)
- [Architectural Diagram](./ARCHITECTURAL_DIAGRAM.md)
- [Design Patterns](./DESIGN_PATTERNS.md)
- [Constraints](./CONSTRAINTS.md)
- [Quality Requirement Mapping](./QUALITY_REQUIREMENT_MAPPING.md)
- [Technology Requirements](./TECHNOLOGY_REQUIREMENTS.md)
- [API Contracts](./API_CONTRACTS.md)
- [Deployment Requirements](../deployment/DEPLOYMENT_REQUIREMENTS.md)
