# Technology Requirements

## Selection Criteria

Selections favour architectural fit and the five primary quality targets: Performance, Scalability, Security, Reliability, Maintainability

## Selected Technologies

| Area | Selected Technology | Architectural Role | Rationale / Trade-off |
|---|---|---|---|
| Backend framework | NestJS | Core API and orchestration boundary | Provides modules, dependency injection, guards, and validation. Trade-off: additional framework structure. |
| Data access | Drizzle ORM | Relational persistence mapping | Keeps SQL explicit and typed. Trade-off: more manual query work than higher-level ORMs. |
| Relational database | PostgreSQL | Authoritative relational store | Fits the relational domain model. Trade-off: heavier operations than file-backed storage. |
| Solver CLI runtime | C++ executable | Local compute engine within the solver worker | Packages both strategies behind one process contract. Trade-off: native build and runtime dependencies. |
| Solver strategies | Google OR-Tools CP-SAT, OpenGA SOGA | Conflict-free and best-effort timetable selection | CP-SAT enforces no-clash constraints. OpenGA runs an independent single-objective search using preferred-start-time distance and a dominant pairwise-conflict penalty. |
| Parser CLI runtime | Python | Local extraction engine within the parser worker | Supports a small adapter interface and mature PDF tooling. Trade-off: adds a second managed runtime. |
| PDF extraction | PyMuPDF | Layout-aware timetable extraction | Spatial extraction fits timetable grids. Trade-off: source-specific layouts require adapter maintenance. |
| Worker runtime | Node.js, BullMQ, shared worker package | Queue consumption, timeouts, cleanup, and callbacks | Reuses TypeScript contracts and Redis infrastructure. Trade-off: job-state and retry complexity. |
| University integration client | Native fetch | Outbound adapter requests | Standards-based and dependency-light. Trade-off: fewer conveniences than richer clients. |
| Boundary validation | NestJS DTO validation, Zod schemas, Python parser validation | HTTP, queue, process, and callback validation | Each runtime validates its boundary. Trade-off: equivalent contracts must remain synchronized. |
| Frontend framework | Next.js | Browser delivery and route-level role separation | Supports server rendering and React-based surfaces. Trade-off: more complexity than a plain SPA. |
| Component and styling system | Shadcn/UI, Radix UI, Tailwind CSS | Accessible components and theming | Supports accessible, themeable interfaces. Trade-off: requires design-token governance. |
| Client state management | Zustand | Shared browser state | Fits workspace and UI preference state without replacing server ownership. |

## Cross-Cutting Platform Choices

| Responsibility | Selected Technology | Reason |
|---|---|---|
| Authentication | Better Auth | Supports delegated authorization and password flows without hand-built authentication. |
| Queue and secondary state | Redis | Supports the message queue and authentication secondary storage. |
| Object storage | MinIO | Provides an S3-compatible interface without cloud lock-in. |
| Ingress | Traefik | Provides container routing and HTTPS termination. |
| Containerisation | Docker, Docker Compose | Reproduces the mixed-runtime deployment. |
| CI/CD | GitHub Actions | Provides repository-hosted automation and branch-gated checks. |
| Monitoring | Prometheus, Grafana, Loki | Provides metrics, dashboards, and log aggregation. |
| Local integration database | PGLite | Provides isolated local and CI database flows. |
| Monorepo tooling | pnpm, Turborepo | Provides one workflow for applications and shared packages. |

Solver-result reuse is implemented through semantic job records in PostgreSQL, not a separate
solution cache.
