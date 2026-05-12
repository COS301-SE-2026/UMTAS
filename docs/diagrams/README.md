# Diagram Repository

This section contains all architectural and system diagrams for the UMTAS platform, organised by concern.

> Each section is managed via a single `.drawio` file located in its respective subdirectory for easier updates.

---

## :material-clipboard-list: Requirements & Use Cases

| Diagram                                                            | Description                                                |
| ------------------------------------------------------------------ | ---------------------------------------------------------- |
| [System Context Diagram](requirements/System-Context-Diagram.md)   | High-level system interaction overview (External Entities) |
| [Student Use Cases](requirements/Student-Use-Cases.md)             | Student interaction flows and requirements                 |
| [Admin Use Cases](requirements/Admin-Use-Cases.md)                 | Administrative management flows                            |
| [System Use Case Diagram](requirements/System-Use-Case-Diagram.md) | Standard UML use case interaction overview                 |

---

## :material-ruler-square: Architecture

| Diagram                                                          | Description                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| [System Overview](architecture/System-Overview.md)               | High-level Core-and-Adapter platform overview              |
| [Component Architecture](architecture/Component-Architecture.md) | Internal component breakdown                               |
| [Deployment Topology](architecture/Deployment-Topology.md)       | Physical server and network infrastructure design          |
| [Adapter Pattern](architecture/Adapter-Pattern.md)               | University-agnostic adapter interface design               |
| [Data Flow](architecture/Data-Flow.md)                           | End-to-end data flow from PDF ingestion to schedule output |

---

## :material-sync: Process & Interaction

| Diagram                                                      | Description                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------- |
| [Interaction Sequence](architecture/Interaction-Sequence.md) | Logic flow between objects for key use cases                    |
| [Process Flow (Activity)](architecture/Process-Flow.md)      | Activity diagrams for complex business logic (e.g. PDF Parsing) |

---

## :material-graph: Domain Model

| Diagram                                          | Description                                                |
| ------------------------------------------------ | ---------------------------------------------------------- |
| [Core Domain Model](domain/Core-Domain-Model.md) | University-agnostic core domain entities and relationships |

---

## :material-database: Database

| Diagram                                            | Description                                     |
| -------------------------------------------------- | ----------------------------------------------- |
| [Entity Relationship Diagram](database/ERD.md)     | Full ERD: Users, Preferences, Schedules, Venues |
| [Privacy Boundary](database/Privacy-Boundary.md)   | UUID dissociation & anonymisation layer (POPIA) |
| [Schema Migrations](database/Schema-Migrations.md) | DrizzleORM migration versioning overview        |

---

## :material-api: API & Integration

| Diagram                                                         | Description                                         |
| --------------------------------------------------------------- | --------------------------------------------------- |
| [API Contracts](api/API-Contracts.md)                           | REST API surface between NestJS core and frontend   |
| [Microservice Communication](api/Microservice-Communication.md) | NestJS ↔ FastAPI inter-service protocol             |
| [Google OAuth2 Flow](api/OAuth-Flow.md)                         | Google Calendar OAuth2 authorisation sequence       |
| [BullMQ Job Flow](api/BullMQ-Flow.md)                           | Async optimisation job lifecycle via Redis + BullMQ |

---

## :material-monitor: Frontend

| Diagram                                          | Description                   |
| ------------------------------------------------ | ----------------------------- |
| [Navigation Flow](frontend/Navigation-Flow.md)   | Student portal page flow      |
| [Component Tree](frontend/Component-Tree.md)     | Next.js component hierarchy   |
| [State Management](frontend/State-Management.md) | Client-side state transitions |

---

## :material-cog: DevOps & Infrastructure

| Diagram                                                      | Description                                     |
| ------------------------------------------------------------ | ----------------------------------------------- |
| [CI/CD Pipeline](devops/CICD-Pipeline.md)                    | GitHub Actions build, test & deploy pipeline    |
| [Network Flow](devops/Network-Flow.md)                       | Traefik edge routing & service mesh             |
| [Local vs Production](devops/Local-Vs-Prod-Dev.md)           | Dev environment vs Tyto server topology         |
| [Data Storage Layer](devops/Data-Storage-Layer.md)           | PostgreSQL + Redis + MinIO storage architecture |
| [Monitoring Stack](devops/Monitoring-Observability-Stack.md) | Grafana + Prometheus + Loki (PLG) observability |
| [Watchtower](devops/WatchTower.md)                           | Zero-touch auto-deployment via Watchtower       |

---

## :material-shield-lock: Security & Compliance

| Diagram                                          | Description                                  |
| ------------------------------------------------ | -------------------------------------------- |
| [Auth Flow](security/Auth-Flow.md)               | BetterAuth session lifecycle & OAuth2 scopes |
| [POPIA Compliance Flow](security/POPIA-Flow.md)  | Data anonymisation pipeline & audit trail    |
| [Network Security](security/Network-Security.md) | WireGuard VPN + Traefik TLS boundaries       |

---

## :material-test-tube: Testing

| Diagram                                         | Description                                  |
| ----------------------------------------------- | -------------------------------------------- |
| [Testing Strategy](testing/Testing-Strategy.md) | Unit (Jest) → Integration → E2E (Playwright) |
| [Test Coverage Map](testing/Coverage-Map.md)    | Requirement traceability to test cases       |

---

## :material-chart-bar: Analytics & Simulation

| Diagram                                                         | Description                                 |
| --------------------------------------------------------------- | ------------------------------------------- |
| [Analytics Pipeline](analytics/Analytics-Pipeline.md)           | Anonymised attendance aggregation flow      |
| [Simulation Architecture](analytics/Simulation-Architecture.md) | 20k synthetic student load generator design |
| [Venue Heatmap Logic](analytics/Heatmap-Logic.md)               | Real-time venue utilisation calculation     |
