# Architectural Requirements

!!! abstract "Section Brief"
    This section specifies the architectural decisions that govern UMTAS. Quality requirements are documented in [Quality Requirements](Quality-Requirements.md). Technology choices are documented in [Technology Requirements](Technology-Requirements.md).

---

## 1. Overall Software Architecture

![System Architecture](../diagrams/architecture/Architecture.svg)

---

## 2. Component Overview

- **Frontend** - renders timetable views for all user roles. Handles authentication state and route-level access control. Communicates exclusively with the API Core via REST.
- **API Core** - single entry point for all client requests. Enforces JWT authentication (via BetterAuth) and RBAC. Owns all database access and orchestrates background job dispatch.
- **Scheduling Optimizer** - stateless computation service. Receives constraint specifications, executes scheduling algorithms, and returns solutions or partial results at timeout.
- **PDF Parser** - extracts and normalises timetable data from university-supplied PDFs. Runs as independently scalable workers consuming from the PDF job queue.
- **University API Adapter** - fetches and normalises structured data from external university APIs. Decoupled from the Core Engine via the adapter interface.
- **PostgreSQL** - system of record for all persistent data. Enforces referential integrity across modules, rooms, staff, and timetable slots.
- **Redis** - in-memory store for session tokens, solution cache, and BullMQ message brokering.
- **BullMQ** - decouples long-running tasks (optimisation, PDF parsing) from the synchronous request cycle. Provides retry, dead-letter, and job visibility.

---

## 3. Communication Patterns

- **Request-Response (REST/HTTP)** - all frontend → API and API → service calls.
- **Push-Pull (BullMQ/Redis)** - distributes parse and optimisation jobs across stateless worker replicas.
- **HTTP Callback** - workers notify the Core API of job completion via POST to a callback URL embedded in the job payload.

![PDF Upload Sequence](../diagrams/architecture/pdf_sequence.svg)

---

## 4. Architectural Patterns

- **Client-Server** - all frontends are thin clients; the server tier owns all state and computation.
- **Service-Oriented Architecture (SOA)** - solver and PDF parser are independently deployable compute services sharing the Core's data store.

---

## 5. Design Patterns

- **Adapter** - PDF Parser and University API Adapter normalise external data into the Core's format without modifying the Core Engine.
- **Strategy** - Scheduling Solver allows constraint programming and heuristic algorithms to be swapped without changing the surrounding service.
- **Factory** - resolves and instantiates the correct concrete adapter for a given university at runtime.

---

## 6. Architecture Constraints

| ID | Constraint | Source |
|---|---|---|
| C1 | The system must integrate with the Google Calendar API. The OAuth flow must conform to Google's OAuth 2.0 authorisation code flow with PKCE. | Client requirement |
| C2 | The constraint solver must expose its interface over HTTP, as it runs in a separate process and may be implemented in a different language from the primary server. | Language boundary - solver is Python |
| C3 | PDF parsing must support, at minimum, the University of Pretoria timetable PDF format at initial delivery. | Client requirement |
| C4 | All services must be containerisable and deployable on a standard Linux host via container orchestration. | Deployment environment |
| C5 | SSL termination and routing must be handled by a reverse proxy positioned in front of all backend services. | Security + deployment requirement |
| C6 | The system must be accessible via modern web browsers only; no native mobile application is required. Desktop and mobile viewports must both be supported. | Client requirement + end-user device |
| C7 | Monorepo tooling must support workspace-level dependency management across multiple applications (frontend, backend, solver). | Development environment |