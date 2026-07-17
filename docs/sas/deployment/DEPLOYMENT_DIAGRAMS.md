# Deployment Diagram

```mermaid
flowchart TB
    User([User]) -->|HTTPS 443| Traefik[Traefik ingress]

    subgraph Host[Production Docker host]
        Traefik -->|HTTP| Frontend[Frontend container]
        Traefik -->|HTTP| Core[Core API container]
        Core -->|PostgreSQL protocol| DB[(PostgreSQL)]
        Core -->|Redis protocol| Redis[(Redis and BullMQ)]
        Core -->|S3 API| Storage[(MinIO object storage)]
        Redis --> Parser[PDF parser worker container]
        Redis --> Solver[Solver worker container]
        Parser -->|HTTPS callback| Core
        Solver -->|HTTPS callback| Core
        Metrics[Prometheus] -->|Scrape| Core
        Metrics --> Grafana[Grafana]
        Logs[Loki] --> Grafana
        Promtail --> Logs
    end
```

| **Path** | **Protocol** | **Purpose** |
|---|---|---|
| User to ingress | HTTPS 443 | Browser and API traffic. |
| Core API to PostgreSQL | PostgreSQL wire protocol | Persistent application and job state. |
| Core API and workers to Redis | Redis protocol | Job queues and operational state. |
| Core API and parser worker to MinIO | S3-compatible API | Uploaded PDF storage. |
| Workers to Core API | HTTPS | Authenticated terminal callbacks. |

The diagram reflects the repository's production Compose topology. Active host placement and public reachability require operational confirmation.
