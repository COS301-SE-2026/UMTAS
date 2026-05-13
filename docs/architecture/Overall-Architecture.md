# Overall Software Architecture

UMTAS follows a client-server architecture across three levels of granularity: system topology (client and server tier separation), inter-subsystem communication patterns, and architectural patterns employed within each subsystem. Architecture constrains technology selection — the reverse does not hold.

---

## Level 1 — System Topology

### Client-Server Architecture

UMTAS employs a **client-server architecture** where user-facing frontends (student view, university-customised view, administrator dashboard) act as thin clients communicating exclusively with a centralised server-side infrastructure. The server comprises the Core API, independently deployable background processing services, data stores, caches, and monitoring tooling.

A peer-to-peer architecture was rejected for three reasons:

- Timetable scheduling is a centralised, computationally intensive operation requiring access to the complete constraint set in a single, authoritative and consistent representation. Distributing this state across peers introduces synchronisation complexity with no benefit.
- The system serves distinct user roles (students, lecturers, administrators, system administrators) each with different access levels, mapping naturally to a client-server model with role-based access control enforced at a single gateway.
- The Core API acts as the single integration hub (API Gateway) through which all services, adapters, and external integrations communicate, enforcing data consistency and a uniform interface.

!!! example "Figure 1: High-Level System Architecture Overview"

    ```kroki-plantuml
    @startuml Figure1_HighLevelArchitecture
    !theme plain
    skinparam backgroundColor white
    skinparam defaultTextAlignment center
    skinparam rectangle {
        BorderColor #888888
    }

    rectangle "Client Tier" #dbeafe {
        component "Base Frontend" as BF
        component "University-Customised Frontend" as CF
        component "University Admin Dashboard" as AF
    }

    rectangle "Entry Point" {
        component "Reverse Proxy / Load Balancer" as RP
    }

    rectangle "API Tier" #dcfce7 {
        component "Core API / Gateway\n— Controller | Service | Repository Layers" as CORE
        component "Authentication Service\n— Embedded in Core" as AUTH
    }

    rectangle "Asynchronous Processing Tier" #fef9c3 {
        rectangle "Job Queues" {
            component "PDF Job Queue" as PQ
            component "Optimiser Job Queue" as OQ
        }
        rectangle "Stateless Scalable Workers" {
            component "PDF Parser\n— Abstract Parent + University Implementations" as PP
            component "Optimiser\n— Strategy: Constraint Solver / Heuristic" as OPT
        }
    }

    rectangle "Adapter Tier" {
        component "University API Adapter\n— Abstract Parent + University Implementations" as UAA
    }

    rectangle "Data Tier" #fce7f3 {
        database "Relational Database" as DB
        database "Session Cache" as SC
        database "Solution Cache" as SOLC
        database "Object Storage\n— Temporary PDF Store" as BLOB
    }

    rectangle "External Services" #ffedd5 {
        component "Calendar API" as GCAL
        component "OAuth Identity Provider" as GOAUTH
        component "University External APIs" as UNIAPI
    }

    rectangle "Monitoring" #f3e8ff {
        component "Metrics Collection Agent" as METRICS
        component "Monitoring Dashboard" as DASH
    }

    BF --> RP
    CF --> RP
    AF --> RP
    RP --> CORE : REST / Request-Response
    CORE -- AUTH
    CORE --> DB
    CORE --> SC
    CORE --> SOLC
    CORE --> PP : HTTP REST (job submission)
    CORE --> OPT : HTTP REST (job submission)
    CORE --> PQ : Push jobs
    CORE --> OQ : Push jobs
    PQ --> PP : Pull
    OQ --> OPT : Pull
    PP ..> CORE : Event: parse complete
    OPT ..> CORE : Event: solution ready
    PP --> BLOB
    CORE --> UAA : Request-Response
    UAA --> UNIAPI : REST
    CORE --> GCAL : REST
    AUTH --> GOAUTH : OAuth
    CORE ..> METRICS : Metrics
    PP ..> METRICS : Metrics
    OPT ..> METRICS : Metrics
    METRICS --> DASH

    @enduml
    ```

---

## Level 2 — Communication Patterns and Protocols

UMTAS employs three communication patterns, each suited to a different class of inter-subsystem interaction.

### Inter-Subsystem Communication

Three primary communication patterns are used:

- **Request-Response (Synchronous):** Frontend clients ↔ Core API, Core API ↔ Python workers, Core API ↔ University API Adapter, Core API ↔ Calendar API, Frontend ↔ Core API (OAuth).
- **Event-Driven Messaging (Asynchronous Completion):** PDF Parser → Core API, Optimiser → Core API, Core API → Frontend.
- **Push-Pull Model (Job Queue Distribution):** Core API → Job Queues, Job Queues → PDF Parser workers, Job Queues → Optimiser workers.

The dominant pattern is **Request-Response** over HTTP/REST. This pattern is used wherever a caller expects an immediate, synchronous result: CRUD operations on timetables, login, timetable generation submission, and external service communication.

REST (Representational State Transfer) over HTTP was selected because the domain is resource-oriented (timetables, modules, venues, users), mapping naturally to REST resources and HTTP verbs (GET, POST, PUT, DELETE). Statelessness aligns with the containerised, horizontally scalable deployment model. REST is universally supported and easily inspectable for debugging.

Alternative protocols (GraphQL, gRPC, SOAP, MQTT, CORBA, Apache Thrift, XML-RPC) were evaluated and rejected. GraphQL would reduce over-fetching on the analytics dashboard but adds unnecessary query layer complexity. gRPC offers better performance for Core API ↔ Python service communication but introduces cross-language protocol buffer compilation complexity and is harder to inspect. SOAP, MQTT, CORBA, Thrift, and XML-RPC are either legacy or overly complex for this resource-oriented domain.

### Application-Level Protocols

| Communication Path | Pattern | Protocol |
|---|---|---|
| Frontend ↔ Core API | Request-Response | REST over HTTP |
| Core API ↔ Python Workers | Request-Response | REST over HTTP |
| Core API ↔ University API Adapter | Request-Response | REST over HTTP |
| Core API ↔ Calendar API | Request-Response | REST over HTTP |
| Core API → Job Queues | Push | AMQP (Message Queue) |
| Job Queues → Workers | Pull | AMQP (Message Queue) |
| Workers → Core API | Event-Driven | AMQP Event Notification |
| Core API → Frontend (async updates) | Event-Driven | TBD: SSE / WebSocket / Polling |
| Frontend ↔ Core API (Auth) | Request-Response | REST over HTTP (OAuth 2.0) |

!!! example "Figure 2: Request-Response Communication Flow"

    ```kroki-plantuml
    @startuml Figure2_RequestResponse
    !theme plain

    participant "Frontend Client" as Client
    participant "Core API Gateway" as GW
    participant "Service Layer" as SVC
    participant "Repository Layer" as REPO
    participant "Data Store" as DB

    Client -> GW : HTTP Request (REST/JSON)
    GW -> SVC : Validate + Delegate
    SVC -> REPO : Query or Persist
    REPO -> DB : SQL / Data Operation
    DB --> REPO : Result Set
    REPO --> SVC : Domain Objects
    SVC --> GW : Response Data
    GW --> Client : HTTP Response (JSON)

    @enduml
    ```

!!! example "Figure 3: Event-Driven Completion Notification"

    ```kroki-plantuml
    @startuml Figure3_EventDriven
    !theme plain

    participant "Core API" as Core
    participant "Job Queue" as Q
    participant "Background Worker" as Worker
    participant "Frontend Client" as Client

    Core -> Q : Push job (payload + metadata)
    Q --> Worker : Deliver job
    Worker -> Worker : Process (parse / solve)
    Worker --> Core : Emit completion event (result payload)
    Core -> Core : Persist result, update job status
    Core --> Client : Push notification (job complete)

    @enduml
    ```

!!! example "Figure 4: Push-Pull Job Queue Distribution"

    ```kroki-plantuml
    @startuml Figure4_PushPull
    !theme plain
    left to right direction

    component "Core API" as CORE

    rectangle "Job Queues" {
        component "PDF Job Queue" as PQ
        component "Optimiser Job Queue" as OQ
    }

    rectangle "PDF Parser Workers (Scalable)" {
        component "PDF Parser Instance 1" as PP1
        component "PDF Parser Instance 2" as PP2
        component "PDF Parser Instance N" as PPN
    }

    rectangle "Optimiser Workers (Scalable)" {
        component "Optimiser Instance 1" as OPT1
        component "Optimiser Instance 2" as OPT2
    }

    CORE --> PQ : Push
    CORE --> OQ : Push
    PQ --> PP1 : Pull
    PQ --> PP2 : Pull
    PQ --> PPN : Pull
    OQ --> OPT1 : Pull
    OQ --> OPT2 : Pull

    @enduml
    ```

---

## Level 3 — Architectural Patterns per Subsystem

Different subsystems employ different architectural patterns based on their requirements.

### Core-and-Adapter Architecture

The overall system follows a **Service-Oriented Architecture (SOA)** where the Core API acts as the central integration hub, and background processing services (Optimiser, PDF Parser) are independently deployable, stateless workers. Critically, these services **do not own their own data stores** — all persistent state is managed through the Core API's data layer. This distinguishes the architecture from microservices, where each service would own its data.

This approach was chosen because:
- A single authoritative data store avoids data consistency challenges of distributed databases.
- Workers are computationally focused (parsing, solving) rather than data-focused — they have no need for their own persistence layer.
- The Python-based worker services expose HTTP REST endpoints, serving as the explicit language boundary between the primary application server and Python processing services.
- An **Enterprise Service Bus (ESB)** approach was rejected as unnecessarily heavyweight.
- A full **microservices** architecture was rejected because services share a data store via the Core, do not have independent deployment lifecycles beyond scaling, and are not independently versioned.

### Per-Subsystem Patterns

| Subsystem | Primary Pattern | Rationale |
|---|---|---|
| Core API | Layered (n-Tier) + API Gateway | Separation of concerns: Controller, Service, Repository layers enable independent testing and maintenance |
| Scheduling Solver | Strategy | Allows different scheduling algorithms to be swapped without changing infrastructure |
| PDF Parser | Adapter | New university PDF formats supported by adding concrete implementations without modifying Core API |
| University API Adapter | Adapter | New university APIs supported by adding concrete implementations without modifying Core API |
| Frontend | Component-Based + Theming | Shared component library reused across three application surfaces; university branding applied via theming layer |

---

## 1.1 Architectural Quality Requirements

Quality requirements apply system-wide and propagate down to each architectural component.

### 1.1.1 Flexibility

The system must accommodate new universities without architectural changes to the Core Engine. Flexibility is measured by:
- New input formats supported by adding concrete adapter implementations without modifying existing code (Open/Closed Principle).
- Cyclomatic complexity of functions ≤ 10, preventing convoluted logic that resists change.
- High cohesion and loose coupling between modules, verifiable by dependency analysis tooling.
- All external packages placed behind standardised interfaces; no direct coupling to third-party implementation details.
- Maintainability rating of A (per static analysis tool), indicating minimal technical debt.

### 1.1.2 Maintainability

The system is extended over multiple academic years, onboarding new universities and adding scheduling constraints. Maintainability is measured by:
- Maintainability rating of A (per SonarCloud or equivalent), indicating minimal technical debt ratio.
- Cyclomatic complexity not exceeding 10 per function.
- Depth of Inheritance Tree (DIT) kept shallow (≤ 3 levels); Adapter pattern is the primary exception (constrained to two levels).
- Class coupling minimised; circular dependencies disallowed.
- Code formatted consistently via pre-commit hooks enforced on every commit.

### 1.1.3 Scalability

UMTAS must scale to serve multiple universities concurrently. Scalability is measured by:
- System supports at least 10 concurrent active university sessions without response time degradation.
- PDF job queues sustain at least 50 parse jobs per hour per worker instance; additional throughput via worker replicas.
- Optimiser handles at least 5 concurrent timetable generation jobs via parallel worker instances.
- Concurrency tests, ramp-up load tests verify that adding a worker replica reduces average job wait time proportionally.
- Horizontal scaling: stateless workers scaled by increasing replica count; Core API scaled similarly behind reverse proxy.

### 1.1.4 Performance

Slow timetable generation or sluggish UI responses reduce system utility. Performance is measured by:
- Standard CRUD operations return in under 300 ms at the 95th percentile under normal load.
- Solution cache hits return in under 500 ms.
- Timetable generation via constraint solver completes within configurable timeout (default: 60 seconds); if exceeded, solver returns best partial solution and flags it as partial.
- Performance tracked continuously via metrics collection dashboard, measuring request rates, queue depths, worker throughput, and solver durations.

### 1.1.5 Reliability

UMTAS manages university scheduling data; downtime or data loss impacts academic operations. Reliability is measured by:
- Main branch always represents a deployable, working version; all merges gated on passing CI.
- Failed background jobs automatically retried with exponential backoff; after max retries, moved to dead-letter queue for manual inspection rather than silently discarded.
- Recovery from worker crash without data loss ensured by message broker acknowledgement — jobs only removed from queue after successful completion and acknowledgement.
- System uptime monitored externally; alerts raised if primary API endpoint becomes unreachable.

### 1.1.6 Security

The system manages academic data (student enrolments, lecturer schedules, venue bookings) and authenticates users across multiple institutions. Security is measured by:
- All inter-service and client-server communication encrypted in transit (HTTPS); unencrypted HTTP connections not accepted in production.
- Role-Based Access Control (RBAC) enforced on every API endpoint.
- Passwords hashed using adaptive hashing algorithms; JWTs have short expiry windows and are invalidated on logout.
- System passes OWASP Top 10 review as part of CI (injection attacks, broken authentication, CSRF, insecure direct object references).
- Dependency vulnerability scanning integrated into CI pipeline; builds with high-severity vulnerabilities blocked.
- OAuth integration follows OAuth 2.0 authorisation code flow with PKCE.

### 1.1.7 Auditability

The system maintains a clear audit trail supporting debugging, compliance, and accountability. Auditability is measured by:
- Structured application logs for all HTTP requests (method, path, status code, duration, authenticated user), job state transitions (submitted, started, completed, failed, dead-lettered), authentication events (login, logout, token refresh, failed attempts), and exceptions.
- Logs queryable by user identity, event type, and timestamp, supporting incident investigation.
- Monitoring dashboards exposing aggregate metrics for request rates, error rates, queue depths, and worker health.
- Log verbosity configurable per environment (DEBUG in development, INFO/WARN in production) without code changes.

### 1.1.8 Testability

All business logic testable in isolation without requiring a running database or external services. Testability is measured by:
- Unit tests cover all service-layer methods; code coverage target ≥ 80%.
- All tests executable in CI without external service dependencies; database layer replaceable by in-memory equivalent during CI.
- Integration tests cover all repository-layer interactions against real (but isolated) database instance.
- End-to-end tests cover all critical user flows (registration, login, timetable generation, calendar export) using browser automation framework.
- All tests run automatically on every pull request; merges to main blocked on failing tests.

### 1.1.9 Usability

UMTAS is used by students, lecturers, and university administrators with varying technical literacy. Usability is measured by:
- Interface meets WCAG 2.1 AA accessibility standards (colour contrast, keyboard navigability, screen reader compatibility, touch target sizing).
- Fully functional on modern desktop browsers, tablet displays, and mobile viewports without degraded experience.
- University branding (logo, colour palette, typography) configurable via theming layer without code changes.
- UI designs validated through prototyping and user acceptance testing prior to final delivery.
- Interfaces follow established UX conventions (consistent navigation, clear error messages, confirmation dialogs for destructive actions).

### 1.1.10 Integrability

UMTAS must integrate with Google Calendar for timetable export and external university APIs for data ingestion, remaining open to integration with additional systems. Integrability is measured by:
- All external integrations communicate via well-defined interfaces (REST over HTTP) with documented contracts; no direct coupling to external API implementation details.
- Integration tests written for all adapter implementations using test doubles for external systems; passing tests are a CI gate.
- Regression tests maintained such that changes to one adapter cannot silently break another.
- New university integrations achievable by implementing the abstract adapter interface and providing configuration, without modifying the Core Engine or existing adapters.

---

## 1.2 Architectural Responsibility

The architectural responsibilities are system-wide concerns that must be addressed by designated components:

- **Authentication Manager** — User authentication (password-based and OAuth), session management, JWT issuance and validation, token refresh.
- **Authorisation / RBAC Enforcer** — Role-based access control evaluation on every inbound request before reaching business logic.
- **API Gateway / Routing Manager** — Request routing, SSL termination, load distribution across Core API replicas.
- **Job Queue Manager** — Enqueuing background tasks (PDF parse, optimisation jobs), managing job state transitions, handling retries and dead-lettering.
- **Solution Cache Manager** — Caching computed timetable solutions, enabling sub-second retrieval of previously generated results.
- **University Adapter Registry** — Instantiating the correct concrete adapter (PDF parser or API adapter) for a given university via factory mechanism.
- **Constraint Solver Orchestrator** — Receiving solve requests, selecting appropriate scheduling strategy, returning solution or partial result within configured timeout.
- **Object Storage Manager** — Storing and retrieving uploaded PDF files in content-addressable object store accessible to parser workers.
- **Metrics Collector** — Scraping performance and health metrics from all services, providing them to monitoring dashboard.

---

## 1.3 Architecture Constraints

The following constraints are imposed by external factors — client requirements, deployment environment, integration dependencies, end-user device limitations. Subjective technology preferences are excluded.

| ID | Constraint | Source |
|---|---|---|
| C1 | System must integrate with Google Calendar API; OAuth authorisation flow must conform to Google's OAuth 2.0 authorisation code flow with PKCE. | Client requirement |
| C2 | Constraint solver service must expose its interface over HTTP; it operates in a separate process and may be implemented in a different language. HTTP interface must be self-documenting (OpenAPI-compatible). | Language boundary — solver is Python |
| C3 | PDF parsing subsystem must support, at minimum, the University of Pretoria timetable PDF format at initial delivery. Support for additional formats achieved by adding concrete adapter implementations. | Client requirement |
| C4 | All services (Core API, solver, PDF parser, adapters, database, cache, object storage, reverse proxy) must be containerised and deployable on standard Linux host via container orchestration. | Deployment environment |
| C5 | SSL termination, routing, and blue-green deployment switching must be handled by reverse proxy / load balancer positioned in front of all backend services. | Security + deployment requirement |
| C6 | System must be accessible via modern web browsers only; no native mobile application required at this stage. Desktop and mobile browser viewports must both be supported. | Client requirement |
| C7 | Monorepo tooling and package manager must support workspace-level dependency management and incremental builds, given that multiple applications (frontend, backend, solver) coexist in same repository. | Development environment |
