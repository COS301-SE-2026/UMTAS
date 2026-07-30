# Technology Requirements

## Selection Criteria

Selections favour architectural fit and the five primary quality targets: PDF extraction
correctness, schedule correctness, student-data confidentiality, university-scale scheduling, and
university-adapter modifiability.

## Selected Technologies

| Area | Selected Technology | Architectural Role | Rationale / Trade-off |
|---|---|---|---|
| Backend framework | NestJS | Core API and orchestration boundary | Provides modules, dependency injection, guards, and validation. Trade-off: additional framework structure. |
| Data access | Drizzle ORM | Relational persistence mapping | Keeps SQL explicit and typed. Trade-off: more manual query work than higher-level ORMs. |
| Relational database | PostgreSQL | Authoritative relational store | Fits the relational domain model. Trade-off: heavier operations than file-backed storage. |
| Solver CLI runtime | C++ executable | Local compute engine within the solver worker | Packages both strategies behind one process contract. Trade-off: native build and runtime dependencies. |
| Solver strategies | Google OR-Tools CP-SAT, OpenGA | Conflict-free and best-effort timetable selection | CP-SAT enforces no-clash constraints. OpenGA is used as a fallback for conflicting solutions. |
| Parser CLI runtime | Python | Local extraction engine within the parser worker | Supports a small adapter interface and mature PDF tooling. Trade-off: adds a second managed runtime. |
| PDF extraction | PyMuPDF | Layout-aware timetable extraction | Spatial extraction fits timetable grids. Trade-off: source-specific layouts require adapter maintenance. |
| Worker runtime | Node.js, BullMQ, shared worker package | Queue consumption, timeouts, cleanup, and callbacks | Reuses TypeScript contracts and Redis infrastructure. Trade-off: job-state and retry complexity. |
| University source integration | Uploaded PDFs and a parser adapter registry | Source-specific import behind a canonical boundary | Works without a live university API and isolates University of Pretoria layouts. Trade-off: users must upload supported documents and each new format requires an adapter. |
| Boundary validation | NestJS DTO validation, Zod schemas, Python parser validation | HTTP, queue, process, and callback validation | Each runtime validates its boundary. Trade-off: equivalent contracts must remain synchronized. |
| Frontend framework | Next.js | Browser delivery and route-level role separation | Supports server rendering and React-based surfaces. Trade-off: more complexity than a plain SPA. |
| Component and styling system | Shadcn/UI, Radix UI, Tailwind CSS | Accessible components and theming | Supports accessible, themeable interfaces. Trade-off: requires design-token governance. |
| Client state management | Tanstack | Shared browser state | Fits workspace and UI preference state without replacing server ownership. |

## Cross-Cutting Platform Choices

| Responsibility | Selected Technology | Reason |
|---|---|---|
| Authentication | Better Auth with optional Google OAuth | Supports password flows, Google identity-provider sign-in, account linking, and delegated authorization without hand-built authentication. |
| Queue and secondary state | Redis | Supports the message queue and authentication secondary storage. |
| Object storage | MinIO | Provides an S3-compatible interface without cloud lock-in. |
| Ingress | Traefik | Provides container routing and HTTPS termination. |
| Containerisation | Docker, Docker Compose | Reproduces the mixed-runtime deployment. |
| CI/CD | GitHub Actions | Provides repository-hosted automation and branch-gated checks. |
| Monitoring | Prometheus, Grafana, Loki | Provides metrics, dashboards, and log aggregation. |
| Local integration database | PGLite | Provides isolated local and CI database flows. |
| Monorepo tooling | pnpm, Turborepo | Provides one workflow for applications and shared packages. |

Current same-user solver-result reuse uses semantic job records in PostgreSQL. A separate solution
cache is planned for later work alongside additional solver heuristics; it is not yet implemented.
Google Calendar API synchronisation is also planned, while Demo 2 calendar interoperability uses
browser-generated iCalendar export.
