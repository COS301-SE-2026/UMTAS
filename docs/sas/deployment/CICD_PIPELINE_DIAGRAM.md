# CI/CD Pipeline Diagram

```mermaid
flowchart LR
    Change[Push or pull request] --> Checks[Lint and automated tests]
    Checks -->|Failure| Stop[Block pipeline]
    Checks -->|Success| Build[Build application and worker images]
    Build --> Smoke[Run image and worker checks]
    Smoke -->|Failure| Stop
    Smoke -->|Success| Registry[(Container registry)]
    Registry --> Staging[Deploy staging]
    Staging --> Health[Run public health checks]
    Health -->|Failure| Stop
    Health -->|Success| Ready[Staging ready]
    Tag[Version tag] --> Production[Deploy production images]
    Production --> ProductionHealth[Run production health checks]
    ProductionHealth -->|Failure| Rollback[Deploy previous tag]
    ProductionHealth -->|Success| Release[Release complete]
```

| **Stage** | **Tool or artefact** |
|---|---|
| Trigger | GitHub push, pull request, version tag, or manual workflow dispatch. |
| Validation | GitHub Actions, Turbo, Jest, worker tests, and Docker configuration checks. |
| Build | Docker Buildx application and worker images. |
| Storage | Published container images in the configured registry. |
| Staging | Staging Docker Compose deployment followed by health checks. |
| Production | Tagged production Docker Compose deployment followed by health checks. |
| Failure | Job failure blocks later stages; production recovery uses the previous image tag. |

The repository contains separate CI, documentation, and production deployment workflows. Approval gates and current environment protection rules require confirmation.
