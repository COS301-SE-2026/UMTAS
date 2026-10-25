# Environment Parity

## Overview

Staging and production share one host and use separate data networks and volumes. Both connect to the shared gateway network. Their configuration and data differ, so production still needs verification.

!!! success "3 Distinct Environments"
    Three distinct environments are defined. The `dev` branch automatically deploys to the Staging environment via Github Actions, while Production requires a manual trigger via Github Actions.

## GitHub Environments

To strictly control our CI/CD pipelines, approvals, and context, UMTAS maps the deployment pipeline to two distinct **GitHub Environments**:`Staging`, and `Production`. These environments act as gatekeepers for our deployment workflows.


* **Staging:** Pushes to `dev` build and scan images, then deploy the seven-character commit SHA tags over SSH.
* **Production:** Pushes of `v*` tags build release images. The separate production workflow deploys a chosen release manually.

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
    * **Deployment Flow:** `just dev`

    | Service | URL Structure | Target Port |
    | :--- | :--- | :--- |
    | **Frontend** | `http://localhost:port` | 3001 |
    | **API Backend** | `http://localhost:port` | 3000 |
    | **Storage (MinIO)** | `http://localhost:9000` | 9000 |


=== "Staging"

    * **Hosting:** Cloud VPS
    * **Image Tagging:** Commit SHA tags.
    * **Network Isolation:** `umtas-staging-internal`
    * **Deployment Flow:** Automated (SSH)

    | Service | Subdomain / URL Structure | Target Port (via Traefik) |
    | :--- | :--- | :--- |
    | **Frontend** | `https://staging.capstone-vigil.dns.net.za` | 80/443 -> `${FRONTEND_PORT}` |
    | **API Backend** | `https://staging.capstone-vigil.dns.net.za/api` | 80/443 -> `${BACKEND_PORT}` |
    | **Storage (MinIO)** | `https://staging.storage.capstone-vigil.dns.net.za` | 80/443 -> 9000 |


=== "Production"

    * **Hosting:** Cloud VPS
    * **Image Tagging:** Pinned version (e.g., `v1.0.2`)
    * **Network Isolation:** Separate app, data and observability networks.
    * **Deployment Flow:** Manual GitHub Actions workflow.

    | Service | Subdomain / URL Structure | Target Port (via Traefik) |
    | :--- | :--- | :--- |
    | **Frontend** | `https://capstone-vigil.dns.net.za` | 80/443 -> `${FRONTEND_PORT}` |
    | **API Backend** | `https://capstone-vigil.dns.net.za/api` | 80/443 -> `${BACKEND_PORT}` |
    | **Storage (MinIO)** | `https://storage.capstone-vigil.dns.net.za` | 80/443 -> 9000 |
    | **Grafana** | `https://grafana.capstone-vigil.dns.net.za` | 80/443 -> 3000 |

---
