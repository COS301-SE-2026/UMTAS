# Secrets Management

## Overview

The UMTAS repository utilises Phase as our centralised secrets manager. **All** project secrets are saved exclusively on Phase. They are stored in a secure, encrypted vault rather than `.env` files scattered across local machines, ensuring plain-text secrets remain strictly inaccessible in resting files.

To support our deployment pipeline, we have configured distinct environments on GitHub. Phase aligns with these environments to ensure that the correct credentials and API keys are securely routed and injected based on the specific deployment context via our Justfile commands.

!!! success "How does Phase work?"
    Phase CLI is integrated into the Justfile for runtime injection across local development, staging, and production deployments.

### Secrets Injection Flow

| Environment | Just Command Examples | Underlying Phase Command | Behaviour |
| :--- | :--- | :--- | :--- |
| **Local Development** | `just dev`, `just front`, `just back`, `just dev-infra`, `just sync` | `phase run -- <command>` | Fetches variables from Phase's default/dev environment and injects them into the local Node environment or local Docker infrastructure. |
| **Shared Infrastructure** | `just proxy-up`, `just proxy-down` | `phase run -- docker compose ...` | Injects configuration variables safely into the shared Traefik proxy stack. |
| **Staging** | `just staging-up`, `just staging-down` | `phase run -- docker compose ...` | Injects variables into the staging Docker Compose context to safely test changes without touching live production data. |
| **Production** | `just prod-up <tag>`, `just prod-migrate`, `just prod-db-backup` | `phase run --env production -- <command>` | Explicitly overrides to the Phase `production` environment to dynamically inject live database URLs, passwords, and API keys directly into the production containers and backup scripts. |
