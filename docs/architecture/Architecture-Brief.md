# Architecture Brief

UMTAS's architecture achieves a clear separation between user-facing API services, background compute workers, and persistent data storage. The Core API acts as the sole integration hub through which all clients and services communicate; background workers (PDF parsing, constraint solving) are independently scalable, stateless compute services; and all persistent state lives in a single authoritative data layer. This design enables the system to scale horizontally, remain maintainable as it onboards new universities, and provide a consistent API contract to both humans and machines.

---

## High-Level System Diagram

The system decomposes into five architectural components: **Core API** (central hub), **Scheduling Solver** (constraint optimization), **PDF Parser & Job Queue** (async document processing), **University API Adapter** (external data ingestion), and **Frontend** (user-facing interface).

!!! example "Figure 1: High-Level System Architecture"

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
        database "PostgreSQL" as DB
        database "PGLite\n(Local Dev & Integration)" as PGL
        database "Redis\n(Session + Solution Cache)" as SC
        database "MinIO\n(PDF Object Storage)" as BLOB
    }

    rectangle "External Services" #ffedd5 {
        component "Google Calendar API" as GCAL
        component "OAuth Identity Provider" as GOAUTH
        component "University External APIs" as UNIAPI
    }

    rectangle "Monitoring" #f3e8ff {
        component "Prometheus" as METRICS
        component "Grafana" as DASH
    }

    BF --> RP
    CF --> RP
    AF --> RP
    RP --> CORE : REST / Request-Response
    CORE -- AUTH
    CORE --> DB
    CORE --> SC
    CORE --> BLOB
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

## Communication Across Components

Three communication patterns are used, each matched to a different interaction class:

| Path | Pattern | Protocol | Sync/Async |
|---|---|---|---|
| Frontend ↔ Core API | Request-Response | REST / HTTP | Synchronous |
| Core API ↔ Python Workers | Request-Response | REST / HTTP | Synchronous |
| Core API ↔ University API Adapter | Request-Response | REST / HTTP | Synchronous |
| Core API → Job Queues | Push | AMQP (BullMQ / Redis) | Asynchronous |
| Job Queues → Workers | Pull | AMQP (BullMQ / Redis) | Asynchronous |
| Workers → Core API | Event-Driven | AMQP completion event | Asynchronous |
| Core API → Frontend (async updates) | Event-Driven | SSE / WebSocket (TBD) | Asynchronous |

!!! example "Figure 2: Communication Pattern Summary"

    ```kroki-plantuml
    @startuml Figure2_CommPatternSummary
    !theme plain
    left to right direction

    rectangle "Clients" {
        component "Frontends" as F
    }

    rectangle "Core" {
        component "Core API / Gateway" as API
    }

    rectangle "Queues" {
        component "PDF Job Queue" as PQ
        component "Optimiser Job Queue" as OQ
    }

    rectangle "Workers" {
        component "PDF Parser" as PP
        component "Optimiser" as OPT
    }

    rectangle "External" {
        component "University APIs" as UNI
        component "Google Calendar" as CAL
    }

    F --> API : REST / Request-Response
    API --> PQ : Push jobs
    API --> OQ : Push jobs
    PQ --> PP : Pull jobs
    OQ --> OPT : Pull jobs
    PP ..> API : Event: job complete
    OPT ..> API : Event: solution ready
    API ..> F : Event: notify client
    API --> UNI : REST / Request-Response
    API --> CAL : REST / Request-Response

    @enduml
    ```

---

## Sequence Diagrams

### End-to-End: PDF Upload and Schedule Generation

The complete flow from PDF upload through timetable generation demonstrates how components coordinate:

!!! example "Figure 3: PDF Upload → Timetable Generation Flow"

    ```kroki-plantuml
    @startuml Figure3_PDFUploadFlow
    !theme plain

    participant "User" as User
    participant "Frontend" as FE
    participant "Core API" as Core
    participant "Object Storage" as OBJ
    participant "PDF Job Queue" as PQ
    participant "PDF Parser" as Parser
    participant "Optimiser Job Queue" as OQ
    participant "Optimiser" as Solver
    participant "Database" as DB
    participant "Solution Cache" as Cache

    User -> FE : Upload PDF
    FE -> Core : POST /pdf-upload
    Core -> OBJ : Store PDF
    Core -> PQ : Push parse job
    Core --> FE : 202 Accepted (job ID)

    PQ -> Parser : Pull job
    Parser -> OBJ : Retrieve PDF
    Parser -> Parser : Parse (university-specific adapter)
    Parser --> Core : Event: parse complete (normalised payload)
    Core -> DB : Persist parsed timetable data
    Core --> FE : Event: parse complete

    User -> FE : Request timetable generation
    FE -> Core : POST /generate
    Core -> Cache : Check for cached solution
    alt Cache hit
        Cache --> Core : Return cached solution
        Core --> FE : 200 OK (solution)
    else Cache miss
        Core -> OQ : Push optimisation job
        Core --> FE : 202 Accepted (job ID)
        OQ -> Solver : Pull job
        Solver -> Solver : Solve (CP-SAT / heuristic)
        Solver --> Core : Event: solution ready
        Core -> DB : Persist solution
        Core -> Cache : Cache solution
        Core --> FE : Event: solution ready
    end

    @enduml
    ```

### OAuth Login Flow

Users authenticate via OAuth 2.0, with the frontend initiating the flow and the Core API completing the exchange server-side:

!!! example "Figure 4: OAuth Login Sequence"

    ```kroki-plantuml
    @startuml Figure4_OAuthFlow
    !theme plain

    participant "User" as User
    participant "Frontend" as FE
    participant "Core API" as Core
    participant "OAuth Provider" as OAuth
    participant "Session Cache" as Cache

    User -> FE : Click Login
    FE -> Core : GET /auth/oauth/authorize?provider=google
    Core -> OAuth : Redirect to OAuth consent screen
    OAuth --> User : Consent form
    User -> OAuth : Grant permission
    OAuth --> Core : Authorization code
    Core -> OAuth : POST token (code + client_secret)
    OAuth --> Core : Access token + ID token
    Core -> Cache : Store session token
    Core --> FE : Set session cookie
    FE --> User : Redirect to dashboard

    @enduml
    ```

### Calendar Export Flow

Students can export their timetable to Google Calendar:

```
1. Student requests timetable export via Frontend
2. Frontend → Core API: POST /export/calendar
3. Core API → Database: Fetch student's timetable
4. Core API → Calendar API: Create calendar events (iCal format)
5. Calendar API: Creates events in student's Google Calendar
6. Core API → Frontend: 200 OK (export complete)
7. Frontend → Student: Confirmation message
```

---

## Services and Architecture Types Explained

### Core API

The **Core API** is a NestJS application implementing a strict layered (n-tier) architecture: Controller → Service → Repository. It is the single integration hub — all clients (frontends, background workers, adapters) communicate exclusively through the Core API's REST endpoints. No other component accesses the persistent database directly.

**Key pattern:** Layered (n-Tier) architecture + API Gateway.

**What it owns:** All persistent state (PostgreSQL), session management (Redis), job state tracking (BullMQ), and inter-service coordination logic.

---

### Scheduling Solver

The **Scheduling Solver** is a stateless Python service built with FastAPI. It receives a normalised constraint specification over HTTP and returns a timetable solution using the **Strategy pattern** — different scheduling algorithms (Constraint Programming via OR-Tools, heuristics) can be swapped without changing the service infrastructure.

**Key pattern:** Strategy pattern for algorithm interchangeability.

**What it owns:** Constraint formulation logic and solver algorithm selection. It owns no persistent data — all input is passed in the HTTP request, and results are returned to the Core API.

---

### PDF Parser & Job Queue

The **PDF Parser** is a collection of Python worker processes that pull PDF parsing jobs from a BullMQ queue. It uses the **Adapter pattern** — an abstract parent class defines the parsing interface; concrete implementations (one per university PDF format) extract and normalise data using PyMuPDF.

The **Job Queue** (BullMQ, Redis-backed) manages the work distribution, retry logic, and dead-letter handling. When a university administrator uploads a PDF, the Core API pushes a job onto the queue. Parser workers pull jobs independently, enabling horizontal scaling by replica count alone.

**Key pattern:** Adapter pattern for format-specific implementations; Push-Pull job queue distribution.

**What it owns:** PDF extraction logic and format-specific normalisations. No persistent data — results are pushed back to the Core API for persistence.

---

### University API Adapter

The **University API Adapter** is a set of TypeScript service classes in the Core API codebase. Like the PDF Parser, it uses the **Adapter pattern** — an abstract parent class defines the data-fetch interface; concrete implementations (one per university API) fetch, transform, and validate external data.

**Key pattern:** Adapter pattern for API schema variations.

**What it owns:** External API communication and data transformation logic. It is embedded in the Core API codebase, not a separate service, so integration is direct (no additional HTTP calls).

---

### Frontend

The **Frontend** is a Next.js SPA (single-page application) with server-side rendering (SSR). Three application surfaces (Base Frontend, University-Customised Frontend, Admin Dashboard) share a single **Shadcn/UI + Radix UI** component library. **Tailwind CSS** theming enables university-specific branding without code duplication.

**Key pattern:** Component-based architecture with theming layer; feature flags for per-university capability configuration.

**What it owns:** User interface rendering, client-side routing, form validation, state management (Zustand), and polling/notification handling for async job progress.

---

## Technology Stack at a Glance

| Layer | Technology |
|---|---|
| **Frontend** | Next.js, React, Shadcn/UI, Tailwind CSS, Zustand |
| **Backend API** | NestJS, TypeScript, DrizzleORM, PostgreSQL |
| **Background Processing** | Python, FastAPI, Google OR-Tools (CP-SAT), PyMuPDF |
| **Job Queue** | BullMQ (Redis-backed) |
| **Cache & Session** | Redis |
| **Object Storage** | MinIO (S3-compatible) |
| **Database (Prod)** | PostgreSQL |
| **Database (Dev/Test)** | PGLite (WASM PostgreSQL) |
| **Reverse Proxy** | Traefik |
| **Containerisation** | Docker + Docker Compose |
| **Monitoring** | Prometheus + Grafana |
| **CI/CD** | GitHub Actions |
| **Testing** | Jest (Backend), pytest (Python), Playwright (E2E) |
| **Monorepo** | pnpm + Turborepo |

The stack forms two coherent language environments — **TypeScript** (frontend, Core API, BullMQ) and **Python** (FastAPI solver, PDF parser workers) — connected by well-defined HTTP REST interfaces. All services are containerised, stateless, and independently scalable. The reverse proxy handles routing and SSL. The CI/CD pipeline ensures the main branch is always deployable.

!!! info "Deep Dives Available"

    For detailed quality requirements, responsibility mappings, framework comparisons, and technology justifications per component, see the individual architecture component pages:
    
    - [Overall Architecture](Overall-Architecture.md) — System topology, communication patterns, architectural patterns, quality requirements
    - [Core API](Core-API.md) — API gateway, layered architecture, framework choices
    - [Scheduling Solver](Scheduling-Solver.md) — Strategy pattern, constraint solving, algorithm selection
    - [PDF Parser](PDF-Parser.md) — Adapter pattern, job queue, PDF extraction
    - [University API Adapter](University-API-Adapter.md) — External data integration, schema transformation
    - [Frontend](Frontend-Component.md) — Component-based UI, theming, accessibility
    - [Architecture Summary](Architecture-Summary.md) — Complete technology stack table, deployment topology, key decisions
