# Technology Requirements

## Selection Criteria

UMTAS technologies are selected for architectural fit, quality-requirement support, operational
simplicity across TypeScript and Python, team maintainability, integration maturity, and deployment
practicality. Familiarity alone is not a valid selection reason.

Quality drivers referenced below:

- `NFR-PERF-001` Performance
- `NFR-SEC-001` Security
- `NFR-MAINT-001` Maintainability
- `NFR-TEST-001` Testability
- `NFR-USA-001` Usability

## Selected Technologies

| Area | Selected Technology | Alternatives Considered | Architectural Responsibility | Requirement Alignment | Rationale / Trade-off |
|---|---|---|---|---|---|
| Backend application framework | `NestJS` | `Express.js`, `Fastify` | Core API and orchestration boundary | `NFR-SEC-001`, `NFR-MAINT-001`, `NFR-TEST-001` | Supports layered modules, dependency injection, guards, and validation. Trade-off: more framework ceremony. |
| Data access layer | `DrizzleORM` | `TypeORM`, `Prisma` | Relational persistence mapping | `NFR-MAINT-001`, `NFR-TEST-001` | Keeps SQL explicit and typed. Trade-off: more manual query work than higher-level ORMs. |
| Persistent database | `PostgreSQL` | `MySQL / MariaDB`, `MongoDB` | Authoritative relational store | `NFR-PERF-001`, `NFR-MAINT-001`, `NFR-TEST-001` | Fits modules, venues, lecturers, semesters, and timetable events. Trade-off: heavier operations than file-backed or document stores. |
| Solver service framework | `FastAPI` | `Flask`, `Django REST Framework` | Python HTTP boundary for extracted compute | `NFR-MAINT-001`, `NFR-TEST-001` | Provides validation and OpenAPI with low ceremony. Trade-off: adds inter-service contract management. |
| Solver engine | `Google OR-Tools CP-SAT` | `OptaPlanner / Timefold`, `PuLP / COIN-OR` | Constraint solving and preference optimization | `NFR-PERF-001`, `NFR-MAINT-001` | Fits timetable-option selection and two-pass feasibility/optimization. Trade-off: needs instrumentation to explain solver behavior. |
| PDF extraction | `PyMuPDF` | `pdfplumber`, `pdfminer.six` | Layout-aware timetable PDF extraction | `NFR-PERF-001`, `NFR-MAINT-001` | Spatial extraction fits timetable grids. Trade-off: UP-specific layouts still need adapter maintenance. |
| Background queue | `BullMQ` | `Celery`, `Agenda` | Queue-backed parse/solve orchestration | `NFR-PERF-001`, `NFR-TEST-001` | Keeps queue ownership in the TypeScript Core and reuses Redis. Trade-off: job-state and retry complexity. |
| University integration HTTP client | Native `fetch` | `axios`, `got` | Outbound adapter requests | `NFR-MAINT-001` | Standards-based and dependency-light. Trade-off: fewer conveniences than richer clients. |
| Boundary validation | `NestJS` validation pipeline | `Zod`, `Ajv` | DTO validation and normalization | `NFR-SEC-001`, `NFR-MAINT-001`, `NFR-TEST-001` | Reuses the Core validation model. Trade-off: adapter validation follows Nest conventions. |
| Frontend framework | `Next.js` | `Nuxt`, `SvelteKit` | Browser UI delivery and route-level role separation | `NFR-PERF-001`, `NFR-USA-001`, `NFR-MAINT-001` | Fits SSR and React-based multi-surface UI. Trade-off: more complexity than a plain SPA. |
| Component and styling system | `Shadcn/UI`, `Radix UI`, `Tailwind CSS` | `Material UI`, `Chakra UI` | Accessible components and theming | `NFR-USA-001`, `NFR-MAINT-001` | Supports accessible, themeable, white-label UI. Trade-off: requires internal design governance. |
| Client state management | `Zustand` | `Redux Toolkit`, React Context | Lightweight shared browser state | `NFR-USA-001`, `NFR-MAINT-001` | Fits workspace, builder, and UI preference state without replacing server ownership. Trade-off: requires discipline around authoritative state. |

## Cross-Cutting Platform Choices

| Responsibility | Selected Technology | Reason |
|---|---|---|
| Authentication | `Better Auth` | Supports OAuth plus password flows without hand-rolled auth. |
| Cache and sessions | `Redis` | Supports sessions, solution cache, and BullMQ. |
| Object storage | `MinIO` | Gives S3-style PDF storage without cloud lock-in. |
| Ingress | `Traefik` | Fits container routing and HTTPS termination. |
| Containerisation | `Docker`, `Docker Compose` | Reproducible runtime across mixed-language services. |
| CI/CD | `GitHub Actions` | Repository-hosted automation and branch-gated checks. |
| Monitoring | `Prometheus`, `Grafana`, `Loki` | Metrics, dashboards, and log aggregation. |
| Local integration database | `PGLite` | Isolated local and CI database flows. |
| Monorepo tooling | `pnpm`, `Turborepo` | Single-repo workflow for frontend, backend, and shared tooling. |

## Consolidated Stack

| Area | Technology |
|---|---|
| Frontend | `Next.js`, `Shadcn/UI`, `Radix UI`, `Tailwind CSS`, `Zustand` |
| Core API | `NestJS`, `Better Auth`, `DrizzleORM` |
| Data and storage | `PostgreSQL`, `PGLite`, `Redis`, `MinIO` |
| Background processing | `BullMQ`, Core-owned workers |
| Solver | `FastAPI`, `Google OR-Tools CP-SAT` |
| Parser | `FastAPI`, `PyMuPDF` |
| Deployment | `Traefik`, `Docker`, `Docker Compose` |
| Operations | `GitHub Actions`, `Docker Hub`, `Watchtower`, `Prometheus`, `Grafana`, `Loki` |
| Monorepo | `pnpm`, `Turborepo` |
