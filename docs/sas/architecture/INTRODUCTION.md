# Introduction

UMTAS is a browser-based timetable management platform. Its Demo 2 architecture uses browser
clients, a central Core API, extracted parser and solver services, and containerized deployment.

## Architectural Shape

- Client-server: browser clients access UMTAS through the Core API.
- Core-owned orchestration: the Core owns auth, authorization, persistence coordination, and job
  state.
- Extracted compute: parser and solver work runs outside the request path through workers and
  internal HTTP services.

## Key Non-Functional Requirements

- Performance: keep parse and solve work asynchronous.
- Security: centralize access control and protect internal service boundaries.
- Maintainability: separate frontend, Core, parser, solver, adapters, and infrastructure.
- Testability: preserve unit, integration, contract, and E2E boundaries.
- Usability: support responsive, role-specific browser workflows.

## Technology Choices

| Element | Selected Technologies |
|---|---|
| Frontend | `Next.js`, `Shadcn/UI`, `Radix UI`, `Tailwind CSS`, `Zustand` |
| Core API | `NestJS`, `Better Auth`, `DrizzleORM` |
| Data and storage | `PostgreSQL`, `PGLite`, `Redis`, `MinIO` |
| Background processing | `BullMQ`, Core-owned queue workers |
| Solver | `FastAPI`, `Google OR-Tools CP-SAT` |
| Parser | `FastAPI`, `PyMuPDF` |
| Ingress and runtime | `Traefik`, `Docker`, `Docker Compose` |
| CI/CD and operations | `GitHub Actions`, `Docker Hub`, `Watchtower`, `Prometheus`, `Grafana`, `Loki` |
| Monorepo tooling | `pnpm`, `Turborepo` |

## Deployment Chain

The documented delivery path is:

`feature branch -> dev -> main -> GitHub Actions -> Docker Hub -> Watchtower -> production containers`

Production uses public HTTPS ingress to route to frontend, Core API, worker, parser, and solver
containers. Database, cache, object storage, and observability services stay internal.

The [SRS](../../srs/index.md) remains authoritative for behavior and quantified quality targets.
