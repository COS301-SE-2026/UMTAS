# Architectural Requirements

This section describes the architectural patterns, design patterns, constraints, and technology decisions that govern UMTAS design and implementation. For a detailed, comprehensive architecture discussion, see [Overall Architecture Documentation](../architecture/Overall-Architecture.md).

---

## Architectural Patterns

The system employs multiple architectural patterns at different levels of granularity to address distinct concerns.

### Core-and-Adapter Architecture (Ports and Adapters / Hexagonal)

The system isolates the scheduling core (Core API, constraint solver, common domain model) from all external data sources (university PDFs, university APIs, Google Calendar). This enables universities to be onboarded without modifying core logic.

**Implementation:**
- **Core:** NestJS API service managing timetables, users, and constraints
- **Adapters:** Pluggable PDF parsers and API adapters for university-specific formats
- **Benefit:** Add new university integrations by implementing a new concrete adapter class; zero changes to the core engine

### Layered (n-Tier) Architecture

The Core API is structured in distinct layers, each with a single responsibility:

- **Presentation Layer:** HTTP controllers handling request routing and response formatting (NestJS Controllers)
- **Application/Service Layer:** Business logic and orchestration (NestJS Services)
- **Repository/Persistence Layer:** Data access abstraction (TypeORM repositories)
- **Data Layer:** PostgreSQL database and Redis caches

**Benefit:** Changes to business logic do not require changes to request handling or data access, supporting maintainability and testability.

### Client-Server Architecture

All frontends (base student view, university-customised views, admin dashboard) are thin clients communicating exclusively with a centralised server-side infrastructure via REST over HTTP.

**Benefit:** Single point of access control, simplified authentication/authorisation, server-side data validation.

### Microservices at Component Level

The system is decomposed into independently deployable services:

- **Core API Service:** NestJS (primary application server and API gateway)
- **Scheduling Solver Service:** Python FastAPI (constraint solving via Google OR-Tools CP-SAT)
- **PDF Parser Service:** Python FastAPI (PDF parsing via university-specific parsers)
- **University API Adapter Service:** Lightweight integration proxies (one or more adapters per university)

**Benefit:** Services scale independently; a PDF parser overload does not impact core API responsiveness.

### Event-Driven Architecture (Asynchronous Processing)

Background tasks (PDF parsing, timetable generation, simulation) are enqueued and processed asynchronously via Redis BullMQ. Result notifications propagate back to the client via polling, webhooks, or real-time events.

**Benefit:** Long-running operations do not block the HTTP request-response cycle; tasks can be retried if they fail.

---

## Design Patterns

### Adapter Pattern

All external integrations (PDF parsers, university APIs, calendar services) are implemented via an abstract parent class and concrete child implementations. A new university integration requires only a new child class implementation.

```
PDFParserParent (abstract)
├── UPPDFParser (University of Pretoria)
├── WitsPDFParser (Wits) — future
└── StellenboschPDFParser (Stellenbosch) — future

APIAdapterParent (abstract)
├── MockAPIAdapter (testing)
├── UniversityOfPretoriaAPIAdapter — future
└── OtherUniversityAPIAdapter — future
```

**Benefit:** Open/Closed Principle — new adapters can be added without modifying existing code.

### Repository Pattern

All data access is abstracted behind repository interfaces. Business logic (services) never directly constructs SQL queries; they call repository methods.

**Benefit:** Database implementation can change (e.g., migrate from PostgreSQL to another RDBMS) without affecting business logic. Unit tests can substitute an in-memory repository.

### Strategy Pattern

The constraint solver supports multiple strategies (CP-SAT solver, heuristic solvers) that can be swapped without changing the caller's interface.

**Benefit:** Different scheduling strategies can be tested and compared; fallback strategies can be employed if the primary solver times out.

### Observer Pattern (Event Bus)

Background workers (PDF parser, scheduler) emit events that the Core API listens to and acts upon. This decouples the worker from the Core API — the worker doesn't need to know what happens after it completes.

**Benefit:** Loose coupling; multiple consumers can react to the same event (e.g., both log the completion and update the UI).

### Factory Pattern

Concrete adapter instances are created via a factory, decoupling the selection of the correct adapter from the business logic that uses it.

**Benefit:** New adapters can be registered with the factory without modifying caller code.

### Singleton Pattern

Critical shared resources (database connection pool, Redis client, cache manager) are managed as singletons to avoid resource exhaustion and ensure consistent state.

**Benefit:** Single, authoritative instance; thread-safe access to shared resources.

### Decorator Pattern

NestJS Guards and Interceptors decorate handlers to add cross-cutting concerns (authentication, logging, error handling) without modifying the handler itself.

**Benefit:** Separation of concerns; reusable decorators across multiple handlers.

---

## Constraints

The following constraints are imposed by external factors — client requirements, deployment environment, integration dependencies, and end-user device limitations.

### Technology Constraints

| ID | Constraint | Rationale |
|---|---|---|
| **C1** | Google Calendar integration via OAuth 2.0 authorisation code flow with PKCE | Client requirement |
| **C2** | Scheduling solver must expose HTTP interface (FastAPI) due to language boundary (Python) | Language boundary; keeps language-agnostic |
| **C3** | PDF format support: minimum University of Pretoria timetable format at delivery | Client requirement |
| **C4** | All services must be containerised and deployable on Linux via Docker | Standard deployment model |
| **C5** | SSL termination and routing via Traefik reverse proxy | Security and deployment requirement |
| **C6** | Web-browser-only access; no native mobile app required | Client requirement |
| **C7** | Monorepo tooling must support workspace-level dependency management | Development environment (pnpm workspaces) |

### Compliance Constraints

| Constraint | Detail |
|---|---|
| **Data Privacy (POPIA)** | South African Personal Information Protection Act compliance; data retention policies, user consent, and right-to-be-forgotten support |
| **Accessibility (WCAG 2.1 AA)** | All UI must meet Web Content Accessibility Guidelines Level AA standards |
| **Browser Support** | Modern evergreen browsers: Chrome, Firefox, Safari, Edge (latest two versions) |
| **University SSO Integration** | Optional support for Shibboleth/SAML integration for university single sign-on (Phase 2+) |

---

## Technology Requirements (Summary)

For the complete technology stack and rationale, refer to [Technology-Requirements.md](Technology-Requirements.md).

**Primary Technology Stack:**

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js, Shadcn, Tailwind CSS |
| **Backend API** | NestJS, TypeORM, PostgreSQL |
| **Scheduler** | Python, FastAPI, Google OR-Tools CP-SAT |
| **Session/Cache** | Redis |
| **Job Queue** | Redis BullMQ |
| **Authentication** | Better Auth (password + OAuth) |
| **Object Storage** | MinIO (S3-compatible) |
| **Reverse Proxy** | Traefik |
| **Container Orchestration** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Prometheus, Grafana |
| **Testing (Unit)** | Vitest |
| **Testing (E2E)** | Playwright |
| **Database (CI)** | PGLite |

!!! tip "See also"
    
    For architectural details, design decisions, and component responsibilities, refer to the [Overall Architecture](../architecture/Overall-Architecture.md) documentation, which provides comprehensive coverage of system topology, communication patterns, and component-specific quality requirements.
