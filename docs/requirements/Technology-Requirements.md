# Technology Requirements

Technology decisions for UMTAS are driven by architectural requirements and the need to support multiple universities with different data formats. This section documents the technology stack and the rationale for each choice.

---

## Technology Stack Overview

| Component | Technology | Version / Framework | Rationale |
|-----------|-----------|-------------------|-----------|
| **Frontend** | Next.js | 14.x (App Router) | SSR support, zero-config deployment, built-in optimisation (image, font), React ecosystem |
| **UI Components** | Shadcn/ui | Latest | Unstyled, accessible component library; consistent brand adaptation via Tailwind config |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS; rapid prototyping; responsive design; custom theme support |
| **Form Validation** | React Hook Form + Zod | Latest | Type-safe schema validation; minimal bundle size; real-time feedback |
| **Backend API** | NestJS | 10.x | Modular architecture; dependency injection; TypeScript-first; OpenAPI generation |
| **ORM** | TypeORM | 0.3.x | Relational SQL mapping; decorators for schema definition; migration tooling |
| **Authentication** | Better Auth | 1.x | Plugin-based auth; OAuth + password flows; session management; JWT support |
| **Database (Primary)** | PostgreSQL | 15.x | Relational model suits scheduling domain; JSONB support for flexible constraints; proven reliability |
| **Database (Dev/Test)** | PGLite | Latest | In-memory PostgreSQL for CI/testing; zero-setup databases per PR |
| **Session Cache** | Redis | 7.x | Low-latency key-value store; session token caching; TTL-based expiry |
| **Solution Cache** | Redis (same instance) | 7.x | Cache computed timetable solutions; sub-second retrieval for known configs |
| **Job Queue** | Redis BullMQ | 5.x | Reliable job queuing; automatic retries; dead-letter queue; event-based progress tracking |
| **Scheduling Solver** | Python FastAPI | 3.11 + 0.100.x | CP-SAT solver access via `google-or-tools`; lightweight HTTP service; independent scaling |
| **Constraint Solver** | Google OR-Tools CP-SAT | 9.x | Industry-standard; handles complex scheduling; open source; active development |
| **PDF Parsing** | Python (pdfplumber / PDFMiner) | Latest | Flexible PDF text extraction; support for University of Pretoria format |
| **Object Storage** | MinIO | Latest (Docker) | S3-compatible; self-hosted; temporary PDF storage before parsing |
| **Reverse Proxy / Load Balancer** | Traefik | 3.x | SSL termination; routing; automatic service discovery; blue-green deployment |
| **Container Runtime** | Docker | 24.x | Containerise all services; reproducible environments; CI/CD integration |
| **Container Orchestration** | Docker Compose (dev), Kubernetes (future) | Latest | Multi-service orchestration; volume management; networking |
| **CI/CD** | GitHub Actions | Latest | Native GitHub integration; workflow definition as code; free tier sufficient for team size |
| **Package Manager** | pnpm | 9.x | Monorepo workspace support; strict dependency management; fast installations |
| **Bundler** | Vite (Rollup) | 5.x | Fast dev server; efficient production builds; Rollup-based tree-shaking |
| **Testing (Unit)** | Vitest | Latest | Jest-compatible; ESM support; faster execution; in-process testing |
| **Testing (E2E)** | Playwright | Latest | Browser automation; cross-browser support (Chrome, Firefox, Safari); video recording |
| **Code Quality** | SonarCloud | Latest | Static analysis; code coverage reporting; technical debt tracking |
| **Monitoring** | Prometheus + Grafana | Latest | Metrics collection; time-series database; dashboard visualisation |
| **Logging** | Structured JSON (Winston/Pino) | Latest | Queryable logs; timestamp; user context; environment-aware verbosity |
| **VPN (Dev DB)** | WireGuard | Latest | Secure access to shared development database (if required) |

---

## Frontend Requirements

The frontend tier provides user-facing interfaces for students, lecturers, and administrators.

**Technology:** Next.js 14 (App Router) + React 19 + TypeScript  
**UI Framework:** Shadcn/ui (Radix UI + Tailwind CSS)  
**State Management:** TanStack Query (data fetching/caching) + Zustand (local UI state)  
**Form Handling:** React Hook Form + Zod schema validation  

**Key Features:**
- Server-side rendering (SSR) and static generation (SSG) for performance
- Automatic code splitting and lazy loading
- Built-in image optimisation (Next Image component)
- Font optimisation (next/font)
- Responsive design via Tailwind's breakpoint system
- Dark mode support via CSS variables
- Accessibility-first component library (Radix UI primitives)
- University-specific branding via Tailwind configuration (colour palette, typography)

**Browser Support:** Chrome, Firefox, Safari, Edge (latest two versions); mobile browsers on iOS/Android

---

## Backend Requirements

The backend provides the REST API, business logic, data persistence, and integration orchestration.

**Technology:** NestJS 10 + TypeScript + Node.js 20+  
**Framework Patterns:** Modular architecture (features organised as modules), dependency injection, decorators

**Components:**
- **Controllers:** HTTP request routing and validation (NestJS Controllers)
- **Services:** Business logic, orchestration, integration with adapters and solver
- **Repositories:** Data access abstraction (TypeORM repositories)
- **Guards:** Authentication and authorisation (NestJS Guards)
- **Interceptors:** Logging, error handling, response formatting (NestJS Interceptors)
- **Pipes:** Input validation and transformation (NestJS Pipes)

**Key Features:**
- Modular architecture by domain (auth, timetable, user, analytics, admin, simulation modules)
- Dependency injection for testability and loose coupling
- Built-in OpenAPI/Swagger documentation generation
- Request validation via class-validator and Zod
- Structured error handling with custom exception filters
- Request logging and tracing

---

## Database Requirements

**Primary:** PostgreSQL 15.x  
**Development/Testing:** PGLite (in-memory PostgreSQL)

**ORM:** TypeORM 0.3.x
- Declarative schema definition via decorators
- Type-safe query builder
- Automatic migrations
- Lazy and eager loading strategies
- Composite keys and polymorphic relationships (single-table inheritance for Event types)

**Schema Features:**
- Relational tables (User, Module, Venue, Timetable, TimetableEntry, Event subtypes)
- JSONB columns for flexible constraint storage (Event.criteria, Event.details)
- Foreign keys with cascade policies
- Temporal columns (createdAt, updatedAt timestamps)
- Enums (EventType, RestrictionType, TimetableStatus, etc.)
- Indices for query performance (user email, module code, timetable status)

---

## Job Queue / Message Broker

**Technology:** Redis 7.x + BullMQ 5.x

**Use Cases:**
- PDF parsing jobs: Long-running background tasks
- Timetable generation: Solver invocation with result callbacks
- Simulation batches: Synthetic load generation
- Email notifications: Async notification delivery

**Features:**
- Automatic retries with exponential backoff
- Dead-letter queue for permanently failed jobs
- Event-based progress tracking (job started, completed, failed)
- Job persistence and recovery after worker crashes
- Configurable job timeout and concurrency per queue

**Queue Configuration:**
- `pdf-parse` queue: 2 concurrent workers per deployment
- `timetable-solve` queue: 1 worker (single solver instance)
- `simulation` queue: 1 worker (exclusive)

---

## Infrastructure / DevOps

**Container Runtime:** Docker 24.x

**Services:**
- **Core API:** NestJS service (Node.js runtime) port 3000
- **Scheduling Solver:** Python FastAPI service port 8000
- **PDF Parser:** Python FastAPI service (scalable) port 8001+
- **Database:** PostgreSQL port 5432
- **Redis Cache/Queue:** Redis port 6379
- **Object Storage:** MinIO port 9000 (S3 API), 9001 (console)
- **Reverse Proxy:** Traefik port 80/443
- **Monitoring:** Prometheus port 9090, Grafana port 3000

**Deployment:**
- Docker Compose for local development and staging
- Kubernetes manifests (future production deployment)
- Watchtower for automatic image updates

**CI/CD Pipeline (GitHub Actions):**
1. Lint and format check (ESLint, Prettier)
2. Static analysis (SonarCloud)
3. Dependency vulnerability scan (npm audit)
4. Unit tests (Vitest) with coverage reporting
5. Build artifacts (Docker images pushed to DockerHub)
6. Integration tests against PGLite
7. E2E tests (Playwright) against deployed staging environment
8. Code coverage badge update

---

## External Integrations

### Google Calendar API

**Purpose:** Export timetables to student Google Calendar accounts  
**Integration Type:** REST API via OAuth 2.0 authorisation code flow with PKCE  
**Client Library:** @google-cloud/calendar (Node.js) or direct REST calls  
**Authentication:** OAuth scopes for calendar write access (calendar.events.create)  
**Rate Limiting:** Batch inserts where possible; handle 403 rate limit responses with exponential backoff

### University API Adapters

**Purpose:** Fetch institutional timetable data (modules, venues, lecturers)  
**Integration Type:** REST, SOAP, or custom protocols via concrete adapter implementations  
**Pattern:** Abstract APIAdapterParent with university-specific concrete implementations  
**Example:** MockAPIAdapter for testing; future UP API adapter for production

### OAuth Identity Provider

**Purpose:** Optional university single sign-on (Shibboleth, SAML) and social login (Google)  
**Implementation:** Better Auth with configurable OAuth providers  

---

## Technology Constraints

### Runtime Constraints

| Constraint | Detail |
|---|---|
| **Node.js Version** | 20.x LTS (Frontend + Backend API) |
| **Python Version** | 3.11+ (Scheduling Solver + PDF Parser) |
| **PostgreSQL Version** | 15.x (production), PGLite (CI) |
| **Redis Version** | 7.x (single instance for session + cache + queue) |
| **Docker Version** | 24.x (all services containerised) |

### Performance Constraints

| Constraint | Detail |
|---|---|
| **Max Concurrent Connections (Core API)** | 100 (verified via load testing) |
| **Max PDF Parse Queue Depth** | 1000 jobs (configurable; backpressure triggers warnings) |
| **Solution Cache TTL** | Configurable (default: 7 days) |
| **Session Token TTL** | 1 hour (access token), 7 days (refresh token) |
| **Solver Timeout** | 60 seconds default (configurable per request) |

### Security Constraints

| Constraint | Detail |
|---|---|
| **TLS Version** | 1.3 minimum (enforced by Traefik) |
| **Password Hashing** | Argon2 or bcrypt (modern adaptive algorithm) |
| **Secrets Management** | Environment variables only (no hardcoded secrets) |
| **CORS Policy** | Explicitly defined allowlist of frontend origins |
| **Rate Limiting** | 100 requests per minute per IP (configurable) |

### Deployment Constraints

| Constraint | Detail |
|---|---|
| **Container Architecture** | amd64 (x86_64) and arm64 (for M1/M2 Mac development) |
| **Host OS** | Linux (Ubuntu 22.04 LTS for production) |
| **Container Registry** | DockerHub or private registry |
| **Orchestration** | Docker Compose (dev/staging), Kubernetes (future production) |

---

## Rationale for Technology Choices

### Why NestJS for the Backend?

- **Modularity:** Organise code by feature/domain; modules can be enabled/disabled independently
- **Type Safety:** TypeScript throughout; compile-time error detection
- **Dependency Injection:** Built-in IoC container; simplifies testing with mocks
- **Decorator-Based:** Guards, Interceptors, Pipes for cross-cutting concerns; avoids middleware spaghetti
- **Framework Maturity:** Stable 10.x release; active community; enterprise adoption

### Why Next.js for the Frontend?

- **SSR and SSG:** Critical for performance and SEO; dynamic rendering for personalised timetables
- **API Routes:** Optional backend-in-a-box for simple endpoints
- **Image Optimisation:** Critical for university branding assets
- **Built-in Monorepo Support:** Single repository for frontend, backend, solver, adapters
- **Rapid Development:** Hot module reloading; zero-config deployment

### Why Google OR-Tools CP-SAT?

- **Constraint Programming:** Industry-standard solver; supports arbitrary constraints and objectives
- **Performance:** Highly optimised C++ core with Python bindings
- **Flexibility:** Can swap strategies (exact solver, heuristics, local search) at runtime
- **Open Source:** Free to use; active Google-backed development
- **Timeout Support:** Guarantees return within configurable timeout; can return partial solutions

### Why Redis for Both Session and Cache?

- **Single Instance:** Reduces operational complexity
- **Performance:** Sub-millisecond latency for session lookups
- **Built-in TTL:** Automatic expiry of session tokens and cached solutions
- **Pub/Sub:** Optional event-based notifications (future enhancement)
- **Persistence:** Optional RDB/AOF for durability

### Why PostgreSQL?

- **Relational Model:** Natural fit for scheduling domain (entities, relationships, constraints)
- **JSONB Support:** Extensible constraint storage without migrations
- **Maturity and Reliability:** Battle-tested; trusted by enterprises
- **TypeORM Support:** Seamless integration with NestJS
- **Open Source:** No licensing constraints

---

## Technology Rationale Summary

The technology stack prioritises:

1. **Modularity:** Clear separation of concerns; pluggable adapters
2. **Type Safety:** TypeScript throughout for early error detection
3. **Testability:** Dependency injection, mocks, in-memory databases for CI
4. **Performance:** Redis caching, JSONB for flexible data, single-table inheritance for Events
5. **Operational Simplicity:** Docker containerisation, GitHub Actions CI/CD, Prometheus/Grafana monitoring
6. **Team Productivity:** Well-established frameworks (Next.js, NestJS, TypeORM) with large communities and good documentation
7. **Scalability:** Stateless services, horizontal scaling behind load balancer, message-broker-based async processing
