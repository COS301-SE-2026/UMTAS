# Server & Infrastructure Guide

!!! info "Purpose"
This guide defines how server-side infrastructure is managed, updated, and monitored. It covers the full lifecycle from Docker packaging to Grafana observability.

---

## :material-auto-fix: Workflow (Infra-as-Code)

1.  **Branch**: Create a feature branch from `dev`.
2.  **Identify**: Pinpoint the component (Traefik, Redis, MinIO, etc.).
3.  **Impact**: Confirm operational risk and network boundaries.
4.  **Config**: Update files in the `/infra` or `docker-compose` layer.
5.  **Test**: Validate locally using `docker-compose up`.
6.  **PR**: Open a PR with clear "Deployment Impact" notes.

---

## :material-layers: Infrastructure Components

| Layer          | Technology                                                                                                             | Role                                  |
| :------------- | :--------------------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| **Runtime**    | ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)           | Containerized service isolation       |
| **Routing**    | ![Traefik](https://img.shields.io/badge/traefik-%2324A1C1.svg?style=for-the-badge&logo=traefik&logoColor=white)        | SSL, CORS, and Blue-Green routing     |
| **Storage**    | ![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) | Primary relational data               |
| **Monitoring** | ![Grafana](https://img.shields.io/badge/grafana-%23F46800.svg?style=for-the-badge&logo=grafana&logoColor=white)        | PLG Stack (Prometheus, Loki, Grafana) |

---

## :material-check-decagram: Definition of Done

??? success "Server Checklist" - [ ] Service configuration is reproducible and versioned. - [ ] Deployment risk is documented (e.g. downtime required?). - [ ] Monitoring impact considered (new dashboard needed?). - [ ] Rollback plan is clear. - [ ] CI/CD container build tests pass.

---

## :material-monitor-eye: Monitoring & Logging

=== "Prometheus (Metrics)"
Collects numeric data (CPU, RAM, Request counts). Every new service must expose a `/metrics` endpoint.

=== "Loki (Logs)"
Aggregates all container logs. Use `docker logs` labels to ensure logs are correctly tagged in Grafana.

=== "Grafana (Dashboards)"
The single pane of glass. Ensure new infrastructure changes are reflected in the **System Health** dashboard.
