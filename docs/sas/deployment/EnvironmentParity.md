# Environment Parity

## Overview

Staging and Production share the same host infrastructure to optimise costs but are completely isolated via Docker networks. This co-location ensures the staging environment flawlessly mirrors the production environment's OS and architecture. If a feature works in staging, it is guaranteed to work in production. As mentioned previously the plan is to expand to a multi-server architecture post demo 2.

!!! success "3 Distinct Environments"
    Three distinct environments are defined. The `main` branch automatically deploys to the Staging environment via Github Actions, while Production requires a manual trigger via Github Actions.

## GitHub Environments

To strictly control our CI/CD pipelines, approvals, and context, UMTAS maps the deployment pipeline to two distinct **GitHub Environments**:`Staging`, and `Production`. These environments act as gatekeepers for our deployment workflows.


* **Staging:** Tied directly to the `main` branch. Merges to `main` trigger GitHub Actions to build and push the `latest` Docker images, which are then deployed via ssh on our server.
* **Production:** Heavily protected to prevent accidental deployments. Deployments to this environment are triggered manually via GitHub Actions and require explicit approval. This guarantees that live user data is only ever touched during planned release windows.

### Github Environments

<figure markdown="span">
  <img src="../gh.png" alt="GitHub Environment Secrets" width="800">
  <figcaption>Fig 2. Screenshot of our Environment Parity on Github</figcaption>
</figure>

### Environment Configurations

=== "Development"

    * **Hosting:** Local machine of dev
    * **Image Tagging:** Local build
    * **Network Isolation:** Default Docker
    * **Deployment Flow:** `just dev -> just both`

    | Service | URL Structure | Target Port |
    | :--- | :--- | :--- |
    | **Frontend** | `http://localhost:port` | Local (e.g., 3000/3001) |
    | **API Backend** | `http://localhost:port` | Local (e.g., 8000) |
    | **Storage (MinIO)** | `http://localhost:9001` | 9001 |


=== "Staging"

    * **Hosting:** Cloud VPS
    * **Image Tagging:** `latest` (Continuous)
    * **Network Isolation:** `umtas-staging`
    * **Deployment Flow:** Automated (SSH)

    | Service | Subdomain / URL Structure | Target Port (via Traefik) |
    | :--- | :--- | :--- |
    | **Frontend** | `https://staging.capstone-vigil.dns.net.za` | 80/443 -> 3003 |
    | **API Backend** | `https://staging.capstone-vigil.dns.net.za/api` | 80/443 -> 8008 |
    | **Storage (MinIO)** | `https://staging.storage.capstone-vigil.dns.net.za` | 80/443 -> 9001 |


=== "Production"

    * **Hosting:** Cloud VPS
    * **Image Tagging:** Pinned version (e.g., `v1.0.2`)
    * **Network Isolation:** `umtas-prod`
    * **Deployment Flow:** Manual Trigger via Github actions(`just deploy-prod TAG`)

    | Service | Subdomain / URL Structure | Target Port (via Traefik) |
    | :--- | :--- | :--- |
    | **Frontend** | `https://capstone-vigil.dns.net.za` | 80/443 -> 3001 |
    | **API Backend** | `https://capstone-vigil.dns.net.za/api` | 80/443 -> 8000 |
    | **Storage (MinIO)** | `https://storage.capstone-vigil.dns.net.za` | 80/443 -> 9001 |
    | **Solver** | `https://solver.capstone-vigil.dns.net.za` | 80/443 -> 8000 |
    | **Grafana** | `https://grafana.capstone-vigil.dns.net.za` | 80/443 -> 3000 |
    | **Brand Style**| `https://brand.capstone-vigil.dns.net.za` | 80/443 -> 6767 |

---
