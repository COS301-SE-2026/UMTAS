# Rollback Strategy

!!! abstract "Section Brief"
    Documents how a failed deployment is handled to ensure high availability. UMTAS employs a strict Re-deploy-Previous-Tag strategy to minimise system downtime in the event of a critical failure.

---

## Overview

Using deterministic image tags rather than `latest` in production allows for instant container swaps. Because a database backup is run prior to every new deployment, the system is protected against destructive migrations, ensuring zero data loss upon rollback.

!!! success "Rollbacks"
    Rollbacks are fully scripted via the Justfile command runner, requiring only a single command and the target previous tag.

### Rollback Procedure

| Step | Action | Command Executed |
| :--- | :--- | :--- |
| **1. Trigger** | Admin identifies critical failure and initiates rollback. | `just rollback-prod {{previous_tag}}` |
| **2. Target** | Justfile triggers the production deployment command with the old tag. | `just prod-up {{previous_tag}}` |
| **3. Container Swap**| Docker pulls the old images and restarts the backend/frontend. | `docker compose -f docker-compose.prod.yml up -d` |
| **4. Reroute**| Traefik detects the healthy containers via Docker socket and routes traffic. | *(Handled automatically by Traefik)* |