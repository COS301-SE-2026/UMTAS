# Deployment Requirements

| **ID** | **Requirement** | **Repository evidence** | **Status** |
|---|---|---|---|
| **DR-1** | The production application shall be reachable through HTTPS. | Production domains are configured in Docker Compose and deployment workflows. | Operational status requires confirmation. |
| **DR-2** | Development, staging, and production shall use explicit environment configuration. | Local, staging, and production Compose files are present. | Implemented configuration. |
| **DR-3** | A fresh clone shall be deployable through documented container definitions. | Dockerfiles and Docker Compose definitions cover the application, workers, and infrastructure. | Implemented configuration. |
| **DR-4** | Secrets shall be injected at runtime and shall not be stored in source control. | Compose files use environment variables; workflows use repository secrets. | Secret-store operation requires confirmation. |
| **DR-5** | A failed release shall be recoverable by redeploying the previous image tag. | The rollback guide uses the preceding published tag. | Exercise evidence required. |
| **DR-6** | Staging deployment shall follow successful continuous-integration checks. | GitHub Actions builds, tests, publishes images, deploys staging, and performs health checks. | Workflow present. |
| **DR-7** | Production deployment shall use a tagged release and health checks. | The production workflow deploys tagged images and checks public health endpoints. | Workflow present. |

## Deployment Units

- **Frontend:** Next.js container.
- **Core API:** NestJS container.
- **PDF parser worker:** Node.js worker invoking the Python parser.
- **Solver worker:** Node.js worker invoking the preference solver.
- **Data services:** PostgreSQL, Redis, and S3-compatible object storage.
- **Ingress and operations:** Traefik, Prometheus, Grafana, Loki, and Promtail.

## Evidence Gaps

- Confirm the active production and staging URLs in `QUESTIONS.md`.
- Record a successful fresh-clone deployment.
- Record a rollback exercise and recovery time.
- Confirm the active secret-management service and access policy.
