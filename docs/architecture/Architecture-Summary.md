# Architecture Summary

This page binds all technology choices made in the preceding component sections into a coherent, unified system architecture.

---

## Technology Stack

| Concern | Technology | Version | Justification |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | Latest | SSR for performance; React component model for shared architecture; team knowledge alignment |
| **State Management** | Zustand | Latest | Lightweight, high-performance global state management |
| **UI Component Library** | Shadcn/UI + Radix UI | Latest | Headless, WCAG-compliant accessibility; Tailwind theming satisfies white-label branding requirement |
| **Styling** | Tailwind CSS | Latest | Utility-first, no CSS-in-JS runtime; theming via CSS custom properties |
| **Backend API Framework** | NestJS | Latest | Opinionated module/DI system enforces layered architecture; built-in Guards/Pipes for RBAC + validation |
| **ORM / Data Access** | DrizzleORM | Latest | TypeScript-first, explicit SQL, compile-time safety; low overhead; direct repository pattern realisation |
| **Persistent Database** | PostgreSQL | Latest | ACID-compliant relational database; ideal for highly relational timetabling domain |
| **Local Dev / Integration DB** | PGLite | Latest | Fast, in-memory/WASM PostgreSQL for development and integration testing |
| **Session + Solution Cache** | Redis | Latest | Sub-millisecond KV reads; reused for both session tokens and timetable solution caching |
| **Background Job Queue** | BullMQ (Redis-backed) | Latest | Native NestJS/TypeScript integration; retry + dead-letter + visibility; reuses Redis instance |
| **Object Storage** | MinIO (S3-compatible) | Latest | Content-addressable, scalable PDF storage; decoupled from compute |
| **Scheduling Solver Framework** | FastAPI (Python) | Latest | Async HTTP, Pydantic validation, auto OpenAPI docs; lightweight for a compute microservice |
| **Constraint Solver Engine** | Google OR-Tools (CP-SAT) | Latest | Best-in-class open-source CP solver; partial solution at timeout; Python bindings; active maintenance |
| **PDF Extraction Library** | PyMuPDF (fitz) | Latest | Spatially-aware text/block extraction; fast; MIT licensed; handles complex timetable grid layouts |
| **Authentication** | BetterAuth (OAuth 2.0 + JWT) | Latest | Dedicated auth library; supports third-party OAuth and password-based flows; managed session state |
| **Reverse Proxy / Load Balancer** | Traefik | Latest | SSL termination, routing, blue-green deployment; Docker-native service discovery |
| **Containerisation** | Docker + Docker Compose | Latest | All services containerised; consistent dev/prod environments; horizontal scaling by replica |
| **CI/CD** | GitHub Actions | Latest | Automated test, build, and deploy pipeline; PR-gated merges |
| **Unit Testing** | Jest (NestJS), pytest (Python) | Latest | Standard frameworks for their respective languages; CI integration |
| **E2E Testing** | Playwright | Latest | Browser automation; headless CI mode; covers all critical user flows |
| **Monitoring** | Prometheus + Grafana | Latest | Metrics scraping + dashboard; standard open-source observability stack |
| **Monorepo Tooling** | pnpm + Turborepo | Latest | Workspace-level dependency management; incremental builds |

---

## Deployment Topology

All services (Core API, solver, PDF parser, adapters, database, cache, object storage, reverse proxy) are containerised using Docker. The system deploys via Docker Compose for development and prototyping, and via Kubernetes or Docker Swarm for production. The reverse proxy (Traefik) handles SSL termination, request routing, and blue-green deployment switching. The Core API scales horizontally by running multiple replicas behind Traefik. The PDF Parser and Scheduling Solver scale by increasing container replica count; they pull jobs from queues independently, requiring no inter-replica coordination.

Persistent data (PostgreSQL) and cache/queue state (Redis) run as separate services. Object storage (MinIO) is deployed as a containerised S3-compatible service for PDF storage. Monitoring (Prometheus + Grafana) collects metrics from all services and provides a unified observability dashboard.

---

## Key Architectural Decisions

The following decisions represent trade-offs and alternative paths considered:

### Core-and-Adapter Over Microservices

**Decision:** Use a Service-Oriented Architecture (SOA) where the Core API owns all data, and background services (Solver, PDF Parser) are stateless workers. Do not use a full microservices architecture where each service owns its own data store.

**Rationale:** A single authoritative data store avoids distributed database consistency challenges. Workers are compute-focused (parsing, solving), not data-focused — they have no independent persistence layer. The HTTP interface at the language boundary (TypeScript ↔ Python) keeps inter-service communication simple and inspectable.

**Trade-offs:** This approach concentrates data access through a single point (the Core API), which could become a bottleneck under extreme scale. However, the system's current scope and expected growth trajectory do not justify the complexity of distributed data management.

### CP-SAT Over Heuristic-Only Solving

**Decision:** Use Google OR-Tools CP-SAT (constraint programming) as the primary solver, with a heuristic fallback for large problem sizes or tight time limits.

**Rationale:** CP-SAT produces optimal or near-optimal timetable solutions for typical university problem sizes, directly satisfying users' need for high-quality schedules. Its ability to return partial solutions at timeout prevents scenarios where the solver times out with no result. The heuristic fallback provides a fast (if suboptimal) solution when CP-SAT's search space becomes intractable.

**Trade-offs:** CP-SAT requires more computational time than heuristics alone. The system tolerates this through the asynchronous job queue model — the solver does not block user-facing operations. If real-time solving becomes a requirement (unlikely for academic timetabling), a pure heuristic approach would be faster but lower-quality.

### NestJS Over Express.js

**Decision:** Use NestJS as the backend framework rather than Express.js with manual middleware assembly.

**Rationale:** NestJS enforces the layered (Controller → Service → Repository) architecture through its module system, preventing architectural drift. Its built-in Guards and Pipes realise RBAC and validation without additional libraries. The dependency injection container enables comprehensive testing. The opinionated structure reduces cognitive overhead in a team-developed system.

**Trade-offs:** NestJS introduces more framework overhead than raw Express.js. However, the productivity gains and code consistency benefits far outweigh the minimal performance cost for an I/O-bound system (not compute-bound).

### BullMQ for Async Queuing

**Decision:** Use BullMQ (Redis-backed, TypeScript-native) for background job queueing rather than Celery (Python-native) or a separate message broker.

**Rationale:** BullMQ integrates natively with the NestJS backend, using the same Redis instance needed for session and solution caching. This eliminates an additional infrastructure dependency (RabbitMQ or a separate Redis for Celery). BullMQ's visibility (job status, progress, history) directly supports the auditability requirement. Python workers consume jobs via simple HTTP polling or REST endpoints, maintaining language separation without coupling to a Python-specific queue system.

**Trade-offs:** Celery would be more natural for a pure Python worker environment. However, since the system's job lifecycle is managed by the NestJS Core API (which dispatches jobs and tracks their state), BullMQ in Node.js is architecturally cleaner than dual-queue management.

### PGLite for Development

**Decision:** Use PGLite (WASM PostgreSQL) for local development and integration testing, matching the production database (PostgreSQL) without requiring a separate Postgres instance.

**Rationale:** PGLite is embedded in Node.js, eliminating the need for Docker or manual database setup for local development. Integration tests can instantiate a fresh in-memory PGLite database per test run, ensuring isolation. The use of the same SQL dialect (PostgreSQL) in development and production eliminates syntax surprises (common with SQLite → PostgreSQL transitions).

**Trade-offs:** PGLite is newer than established databases, carries some performance variability, and WASM on-disk persistence is still evolving. For a system with moderate data volume and latency tolerance in development scenarios, these trade-offs are acceptable.

---

## Quality Attribute Summary

| Quality Attribute | System Target | Primary Mechanism |
|---|---|---|
| **Flexibility** | Support new universities without Core API changes | Adapter pattern (PDF parsers, API adapters) with factory instantiation; Open/Closed Principle |
| **Maintainability** | Maintainability rating A; cyclomatic complexity ≤ 10 | Layered architecture enforced by NestJS; dependency injection; modular domain decomposition |
| **Scalability** | 10+ concurrent sessions; 50 PDFs/hour per worker; 5 concurrent solves | Horizontal scaling via stateless replicas; load balancer distribution; job queue work distribution |
| **Performance** | CRUD: < 300 ms p95; cache hits: < 500 ms; solver: configurable timeout (default 60s) | Cache layer (Redis); async job dispatch; solution caching; query optimization |
| **Reliability** | Data never lost; worker crashes recovered; main branch always deployable | At-least-once job delivery (BullMQ acknowledgements); dead-letter queues; automated retries; CI gates on main |
| **Security** | HTTPS-only; RBAC enforced; OWASP Top 10 pass; OAuth 2.0 with PKCE | Guards/middleware enforce auth/authz; input validation; dependency scanning in CI; OAuth code flow |
| **Auditability** | All significant events logged; queryable by user/event type/timestamp | Structured logging of requests, job transitions, auth events, exceptions; monitoring dashboard |
| **Testability** | 80% code coverage; all service logic unit-testable; CI gates on test pass | Dependency injection enables test doubles; in-memory database for CI; E2E browser automation |
| **Usability** | WCAG 2.1 AA; responsive (320 px – desktop); university branding without code changes | Radix UI accessibility; Tailwind responsive; theming layer configuration; user acceptance testing |
| **Integrability** | REST APIs with documented contracts; test doubles for all adapters | Well-defined HTTP interfaces; OpenAPI documentation; integration test coverage; adapter factory |
