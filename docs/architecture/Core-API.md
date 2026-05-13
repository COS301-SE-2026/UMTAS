# Architectural Component: Core API

The Core API is the central component of UMTAS. It serves as the API Gateway (single entry point for all client requests), the business logic layer (timetable management, conflict detection, RBAC enforcement), the data access layer (database reads and writes), and the integration hub (orchestrating calls to the solver, PDF parser, API adapters, and external services). All other components depend on the Core API either to submit results or to receive instructions. No other component accesses the persistent data store directly — the Core API is the sole owner of that interface.

The Core API depends on: the Relational Database (persistent data), the Session Cache (authentication tokens), the Solution Cache (cached timetable solutions), the Object Storage (PDF retrieval coordination), the Job Queue Manager (background job dispatch), and the University API Adapter (external data ingestion). The Scheduling Solver and PDF Parser communicate results back to the Core API via events.

---

## 2.1 Architectural Quality Requirements

The following quality requirements propagate from the overall architecture and are particularly critical for the Core API due to its central role.

### 2.1.1 Scalability

The Core API must handle concurrent requests from multiple universities and user roles simultaneously. Because it is stateless with respect to business logic (session state externalised to the Session Cache), it scales horizontally by running multiple replicas behind the load balancer. The Core API must sustain a minimum of 100 concurrent HTTP connections without response time degradation; verified through load testing with ramped concurrency profiles.

### 2.1.2 Security

As the sole gateway into the system, the Core API is the enforcement point for all security controls. Every inbound request must be authenticated before reaching any business logic; unauthenticated requests rejected at the controller layer with a 401 response. Role-based access control must be enforced declaratively, such that adding a new endpoint requires explicit role annotation — secure by default. Input validation must reject malformed payloads before they reach the service layer, preventing injection vectors. All secrets (database credentials, cache connection strings, OAuth client secrets) must be injected via environment configuration, never hardcoded or committed to the repository.

### 2.1.3 Maintainability

The layered architecture (Controller → Service → Repository) enforces separation of concerns, ensuring that business logic changes do not require changes to request handling or data access code, and vice versa. Modular decomposition by domain (auth module, timetable module, user module, analytics module, etc.) ensures that developers can work on one domain without touching another. The codebase must maintain a static analysis maintainability rating of A and a cyclomatic complexity of ≤ 10 per function. Pre-commit hooks enforce formatting and linting on every commit.

### 2.1.4 Performance

The Core API must return responses for standard CRUD operations in under 300 ms at the 95th percentile. Cache-served responses (solution lookups, session validation) must complete in under 500 ms. Long-running operations (solver invocation, PDF parsing) are offloaded to background workers and never block the HTTP request-response cycle — they are submitted as jobs and the client receives a job ID for polling or event-based notification.

### 2.1.5 Testability

All business logic in the service layer must be unit-testable in isolation, with the repository layer replaced by a mock or in-memory equivalent during unit testing. Integration tests must exercise the repository layer against a real (CI-isolated) database instance, verifying that all queries and mutations behave correctly. The modular architecture with dependency injection enables test doubles to be substituted without modifying production code. Code coverage for the Core API must exceed 80%.

### 2.1.6 Integrability

The Core API exposes a documented REST API consumed by all frontend clients and all background services. All inter-service communication enters and leaves through the Core API's defined HTTP interface. The use of a layered architecture with a repository abstraction layer means that the underlying data store can be swapped (e.g., from one relational database to another) without affecting the service or controller layers.

---

## 2.2 Architectural Responsibility

The Core API is responsible for:

- **Request Routing and Validation (Controller Layer):** Receiving inbound HTTP requests, validating input payloads against defined schemas, delegating to the appropriate service.
- **Business Logic Execution (Service Layer):** Enforcing timetable rules, detecting scheduling conflicts, managing job lifecycle, enforcing RBAC, coordinating cross-domain operations.
- **Data Access Abstraction (Repository Layer):** Providing a clean CRUD interface over the relational database and caches, isolating all query logic from business logic.
- **Authentication Enforcement:** Validating JWT tokens on every request, refreshing sessions, integrating with OAuth identity provider for third-party login.
- **Background Job Dispatch:** Pushing parse and optimisation jobs onto the appropriate queues, tracking job status.
- **External Service Coordination:** Invoking the University API Adapter for data sync and the Calendar export service for timetable export.

!!! example "Figure 8: Core API — Layered Architecture"

    ```kroki-plantuml
    @startuml Figure8_CoreAPILayered
    !theme plain
    top to bottom direction

    component "Client Request (HTTP)" as CLIENT

    rectangle "Core API" #dcfce7 {
        component "Controller Layer\n— Request Handling, Input Validation,\nRoute Definitions, HTTP Response Formation" as CTL
        component "Service Layer\n— Business Logic, Conflict Detection,\nJob Orchestration, RBAC Enforcement" as SVC
        component "Repository Layer\n— Data Access Abstraction,\nCRUD Operations, Query Isolation" as REPO
    }

    rectangle "Data Stores" {
        database "Relational Database" as DB
        database "Cache Store" as CACHE
    }

    CLIENT --> CTL
    CTL --> SVC
    SVC --> REPO
    REPO --> DB
    REPO --> CACHE

    @enduml
    ```

---

## 2.3 Frameworks and Technologies

This section evaluates the frameworks and technologies available to realise the identified architectural responsibilities. Comparisons are scientific and technology-neutral — the goal is identifying which option best satisfies stated responsibilities.

### Backend Application Framework

| Framework | Assessment |
|---|---|
| **NestJS** | Opinionated, modular TypeScript framework. Provides built-in dependency injection, module system, declarative Guards (RBAC), Interceptors (logging, transformation), Pipes (validation), and a rich ecosystem of first-party integrations. Its module boundaries directly enforce the layered (Controller / Service / Repository) architecture. Strong TypeScript typing reduces runtime errors. Widely adopted in enterprise Node.js systems. |
| **Express.js** | Minimalist Node.js framework with maximum flexibility. Requires manual assembly of middleware, routing, dependency injection, and validation. This freedom leads to inconsistent patterns in team settings and makes it difficult to enforce the layered architecture without additional conventions and tooling. |
| **Fastify** | High-performance Node.js framework with schema-based validation and lower overhead per request than Express.js. Less opinionated than NestJS; does not natively enforce a layered architecture. Better suited to microservices with simple routing than to a feature-rich application server with domain modules, RBAC, and complex business logic. |

### ORM / Data Access Layer

| ORM | Assessment |
|---|---|
| **DrizzleORM** | TypeScript-first SQL query builder. Schema definitions are TypeScript objects, providing compile-time type safety on all queries. Explicit SQL construction gives full control over query shape without hidden magic or N+1 generation. Lightweight, with low overhead and excellent PostgreSQL support. Schema definition aligns directly with the repository layer abstraction. |
| **TypeORM** | Mature ORM with Active Record and Data Mapper patterns. Supports decorator-based entity definitions that integrate well with NestJS. However, query generation can be non-deterministic for complex joins, and the Active Record pattern can blur the boundary between the domain model and data access concerns. Heavier dependency tree. |
| **Prisma** | Schema-first ORM with a powerful auto-generated client. Excellent developer experience for simple CRUD. However, migrations are managed by the Prisma CLI (separate from the application), and the Prisma engine binary introduces a heavy runtime dependency. Type generation requires a separate codegen step, complicating CI. |

### Relational Database

| Database | Assessment |
|---|---|
| **PostgreSQL** | Mature, fully ACID-compliant relational database. Supports complex joins, partial indexes, array columns, JSON columns, and full-text search. The timetabling domain is highly relational (modules ↔ venues ↔ lecturers ↔ time slots ↔ student groups), making a relational model the natural fit. Strong community support and wide hosting options. |
| **MySQL / MariaDB** | Popular relational database but with weaker support for advanced features compared to PostgreSQL: no native array types, weaker partial index support, less mature JSON operators. Suitable for simpler applications but provides no advantages over PostgreSQL for this domain. |
| **MongoDB** | Document-oriented NoSQL database. A flexible schema is a disadvantage here — the timetabling domain is highly structured with complex inter-entity relationships that are naturally expressed as relational joins, not document nesting. Enforcing relational integrity at the application level introduces avoidable complexity and error surface. |

---

## 2.4 Architectural Realization Mapping

The chosen framework realises each identified responsibility:

- The **Controller Layer** is realised by framework controllers with route decorators and input validation pipes — request handling, schema enforcement, and response formation are all handled declaratively.
- The **Service Layer** is realised by injectable service classes containing all business logic, accessed via dependency injection — no direct instantiation.
- The **Repository Layer** is realised by injectable repository classes wrapping the ORM query builder, exposing only domain-relevant CRUD methods to the service layer.
- **Authentication enforcement** is realised by a Guard (a framework-level middleware hook) that runs before every controller method, validating the JWT token and attaching the user context.
- **RBAC enforcement** is realised by a role-based decorator on each controller method, evaluated by the same Guard after authentication.
- **Input validation** is realised by Pipes that validate and transform inbound DTOs (Data Transfer Objects) against schema definitions before the controller method body executes.

| Responsibility | Realised By (NestJS Concept) |
|---|---|
| Request routing | Route decorators (e.g. @Get, @Post) |
| Input validation | Pipes (ClassValidatorPipe) |
| HTTP response formation | Controller methods + serialization |
| Business logic execution | Injectable Service classes |
| Data access abstraction | Injectable Repository classes + DrizzleORM |
| Authentication | Guards (authentication guard checks JWT) |
| RBAC | Decorators + Guards (role-based guard) |
| Job dispatch | Service method calls to job queue service |

---

## 2.5 Technology Choice

The Core API will be built using **NestJS** as the application framework, **DrizzleORM** as the data access layer, and **PostgreSQL** as the persistent data store.

NestJS was chosen because its opinionated module structure directly enforces the layered architecture required by the system's maintainability and scalability requirements. Its built-in Guards and Pipes realise the RBAC and validation responsibilities without additional libraries. The framework's dependency injection container ensures testability — all service and repository dependencies are injectable and replaceable with test doubles. NestJS's adoption in large-scale TypeScript backends makes it the lowest-risk choice for a team-developed system expected to evolve over multiple iterations.

DrizzleORM was chosen over TypeORM and Prisma because it provides compile-time type safety over SQL without hidden query generation behaviour, keeping the repository layer explicit and predictable. Its lightweight footprint reduces bundle size and startup time, and its PostgreSQL dialect support is first-class.

PostgreSQL was chosen because the timetabling domain is inherently relational — modules, venues, lecturers, time slots, and student groups form a web of foreign-key relationships that are best expressed and queried using SQL joins and constraints. PostgreSQL's advanced features (partial indexes, array types, ACID transactions) provide capabilities that may be needed as the schema evolves.
