# Diagram Repository

This section contains all architectural and system diagrams for the UMTAS platform, organised by concern.

> Each section is managed via a single `.drawio` file located in its respective subdirectory for easier updates.

---

<div class="grid cards" markdown>

-   :material-clipboard-list:{ .lg .middle } __Requirements & Use Cases__

    ---

    System context, student and admin interaction flows, and UML use case diagrams.

    [:octicons-arrow-right-24: View Section](#requirements-use-cases)

-   :material-ruler-square:{ .lg .middle } __Architecture__

    ---

    Core-and-Adapter platform overview, component breakdown, deployment topology, and adapter interface design.

    [:octicons-arrow-right-24: View Section](#architecture)

-   :material-sync:{ .lg .middle } __Process & Interaction__

    ---

    Logic flow between objects for key use cases and activity diagrams for complex business logic.

    [:octicons-arrow-right-24: View Section](#process-interaction)

-   :material-graph:{ .lg .middle } __Domain Model__

    ---

    University-agnostic core domain entities and relationships.

    [:octicons-arrow-right-24: View Section](#domain-model)

-   :material-database:{ .lg .middle } __Database__

    ---

    Full ERD, POPIA privacy boundary, and DrizzleORM migration versioning overview.

    [:octicons-arrow-right-24: View Section](#database)

-   :material-api:{ .lg .middle } __API & Integration__

    ---

    REST API surface, NestJS ↔ FastAPI inter-service protocol, OAuth2 flow, and BullMQ job lifecycle.

    [:octicons-arrow-right-24: View Section](#api-integration)

-   :material-monitor:{ .lg .middle } __Frontend__

    ---

    Student portal page flow, Next.js component hierarchy, and client-side state transitions.

    [:octicons-arrow-right-24: View Section](#frontend)

-   :material-cog:{ .lg .middle } __DevOps & Infrastructure__

    ---

    CI/CD pipeline, Traefik routing, storage architecture, and Watchtower auto-deployment.

    [:octicons-arrow-right-24: View Section](#devops-infrastructure)

-   :material-shield-lock:{ .lg .middle } __Security & Compliance__

    ---

    BetterAuth session lifecycle, POPIA data anonymisation pipeline, and WireGuard VPN boundaries.

    [:octicons-arrow-right-24: View Section](#security-compliance)

-   :material-test-tube:{ .lg .middle } __Testing__

    ---

    Unit → Integration → E2E testing strategy and requirement traceability to test cases.

    [:octicons-arrow-right-24: View Section](#testing)

-   :material-chart-bar:{ .lg .middle } __Analytics & Simulation__

    ---

    Anonymised attendance aggregation, 20k synthetic student load generator, and venue heatmap logic.

    [:octicons-arrow-right-24: View Section](#analytics-simulation)

</div>

---

## :material-clipboard-list: Requirements & Use Cases { #requirements-use-cases }

| Diagram                                                                        | Description                                                |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| [Authentication System](requirements/Authentication-System.md)                 | User identity and access control flows                     |
| [Timetable Management System](requirements/Timetable-Management-System.md)     | Manual and automated timetable generation                  |
| [Timetable Import System](requirements/Timetable-Import-System.md)             | External source (PDF/API) ingestion logic                  |
| [Calendar Integration System](requirements/Calender-Integration-System.md)     | Export to Google Calendar and .ics file flows              |
| [University Analytics System](requirements/University-Analytics-System.md)     | Administrative reporting and demand forecasting            |
| [Tyto Simulation System](requirements/Tyto-Simulation-System.md)               | Large-scale performance and scalability simulations        |

---

## :material-ruler-square: Architecture { #architecture }

| Diagram                                                          | Description                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| [System Overview](architecture/System-Overview.md)               | High-level Core-and-Adapter platform overview              |
| [Component Architecture](architecture/Component-Architecture.md) | Internal component breakdown                               |
| [Deployment Topology](architecture/Deployment-Topology.md)       | Physical server and network infrastructure design          |
| [Adapter Pattern](architecture/Adapter-Pattern.md)               | University-agnostic adapter interface design               |
| [Data Flow](architecture/Data-Flow.md)                           | End-to-end data flow from PDF ingestion to schedule output |

---

## :material-sync: Process & Interaction { #process-interaction }

| Diagram                                                      | Description                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------- |
| [Interaction Sequence](architecture/Interaction-Sequence.md) | Logic flow between objects for key use cases                    |
| [Process Flow (Activity)](architecture/Process-Flow.md)      | Activity diagrams for complex business logic (e.g. PDF Parsing) |

---

## :material-graph: Domain Model { #domain-model }

| Diagram                                          | Description                                                |
| ------------------------------------------------ | ---------------------------------------------------------- |
| [Core Domain Model](domain/Core-Domain-Model.md) | University-agnostic core domain entities and relationships |

---

## :material-database: Database { #database }

| Diagram                                            | Description                                     |
| -------------------------------------------------- | ----------------------------------------------- |
| [Entity Relationship Diagram](database/ERD.md)     | Full ERD: Users, Preferences, Schedules, Venues |
| [Privacy Boundary](database/Privacy-Boundary.md)   | UUID dissociation & anonymisation layer (POPIA) |
| [Schema Migrations](database/Schema-Migrations.md) | DrizzleORM migration versioning overview        |

---

## :material-api: API & Integration { #api-integration }

| Diagram                                                         | Description                                         |
| --------------------------------------------------------------- | --------------------------------------------------- |
| [API Contracts](api/API-Contracts.md)                           | REST API surface between NestJS core and frontend   |
| [Microservice Communication](api/Microservice-Communication.md) | NestJS ↔ FastAPI inter-service protocol             |
| [Google OAuth2 Flow](api/OAuth-Flow.md)                         | Google Calendar OAuth2 authorisation sequence       |
| [BullMQ Job Flow](api/BullMQ-Flow.md)                           | Async optimisation job lifecycle via Redis + BullMQ |

---

## :material-monitor: Frontend { #frontend }

| Diagram                                          | Description                   |
| ------------------------------------------------ | ----------------------------- |
| [Navigation Flow](frontend/Navigation-Flow.md)   | Student portal page flow      |
| [Component Tree](frontend/Component-Tree.md)     | Next.js component hierarchy   |
| [State Management](frontend/State-Management.md) | Client-side state transitions |

---

## :material-cog: DevOps & Infrastructure { #devops-infrastructure }

| Diagram                                                      | Description                                     |
| ------------------------------------------------------------ | ----------------------------------------------- |
| [CI/CD Pipeline](devops/CICD-Pipeline.md)                    | GitHub Actions build, test & deploy pipeline    |
| [Network Flow](devops/Network-Flow.md)                       | Traefik edge routing & service mesh             |
| [Local vs Production](devops/Local-Vs-Prod-Dev.md)           | Dev environment vs Tyto server topology         |
| [Data Storage Layer](devops/Data-Storage-Layer.md)           | PostgreSQL + Redis + MinIO storage architecture |
| [Monitoring Stack](devops/Monitoring-Observability-Stack.md) | Grafana + Prometheus + Loki (PLG) observability |
| [Watchtower](devops/WatchTower.md)                           | Zero-touch auto-deployment via Watchtower       |

---

## :material-shield-lock: Security & Compliance { #security-compliance }

| Diagram                                          | Description                                  |
| ------------------------------------------------ | -------------------------------------------- |
| [Auth Flow](security/Auth-Flow.md)               | BetterAuth session lifecycle & OAuth2 scopes |
| [POPIA Compliance Flow](security/POPIA-Flow.md)  | Data anonymisation pipeline & audit trail    |
| [Network Security](security/Network-Security.md) | WireGuard VPN + Traefik TLS boundaries       |

---

## :material-test-tube: Testing { #testing }

| Diagram                                         | Description                                  |
| ----------------------------------------------- | -------------------------------------------- |
| [Testing Strategy](testing/Testing-Strategy.md) | Unit (Jest) → Integration → E2E (Playwright) |
| [Test Coverage Map](testing/Coverage-Map.md)    | Requirement traceability to test cases       |

---

## :material-chart-bar: Analytics & Simulation { #analytics-simulation }

| Diagram                                                         | Description                                 |
| --------------------------------------------------------------- | ------------------------------------------- |
| [Analytics Pipeline](analytics/Analytics-Pipeline.md)           | Anonymised attendance aggregation flow      |
| [Simulation Architecture](analytics/Simulation-Architecture.md) | 20k synthetic student load generator design |
| [Venue Heatmap Logic](analytics/Heatmap-Logic.md)               | Real-time venue utilisation calculation     |
