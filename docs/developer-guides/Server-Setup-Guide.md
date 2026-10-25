# Server Setup Guide

_Written by Marcel Stoltz_  
_24 Apr 2026_

---

## Initial Hardening

Before we installed any services, we ensured that all entry points were secure.

### SSH Port Remapping

We moved the SSH port from port `22` to another port (`2222`) to drastically reduce the background noise logs from potential automated attacks.

### Enable UFW

This firewall acts as our outer gate. We deny all incoming traffic by default, ensuring that when we unknowingly expose an internal container port, it won't be publicly accessible. We would need to explicitly whitelist it to expose the port.

### Docker Engine

We installed Docker and Docker Compose to ensure that every environment runs an identical binary. Environment in this case is `prod`/`dev`.

### Repository Prep

We cloned the repo to a specific deployment home to keep it separated from user files and system binaries.

---

## Server Philosophy → GitOps / Infrastructure As Code

As mentioned in our `Repo-Setup-Guide.md` file, we follow the **"One command for them all"** philosophy.
Infrastructure configuration lives in `/infra` and the root Compose files. Host setup and Phase configuration still require manual steps.

### Networking & Routing

- **Tech:** Traefik v3.6
- **Why:** Traefik is our reverse proxy of choice. It integrates natively with the Docker daemon. It discovers new containers on the go, reads their labels, and then creates routing rules for each container dynamically.
- **SSL:** Traefik also handles SSL certificates through an HTTP challenge. _(What is an HTTP Challenge? It's just a check that Traefik uses to verify if we own the domain)._
- **Security:** Traefik is the **only** service that exposes ports (`80` and `443`). Everything else is configured to live and communicate strictly on an internal network.

### Monitoring & Observability

- **Tech:** We use the Prometheus, Loki, and Grafana (**PLG**) stack to monitor everything.
- **Prometheus (Metrics):** Prometheus acts as a web scraper for our numeric data (CPU, memory, request counts) from Traefik, the backend and infrastructure exporters. Workers do not expose a scraped metrics endpoint.
- **Loki & Promtail (Logs):**
  - **Why:** Managing all the logs from `docker logs` is completely unscalable.
  - **How:** We are using Promtail. _(What does Promtail do?)_ Promtail mounts the host's `/var/lib/docker/containers` directory. It then reads the raw JSON logs of every container, and sends them to the Loki Service through the internal network.
- **Grafana (Visualisation):**
  - **Why:** It combines Prometheus metrics and Loki logs into one customizable dashboard.
  - **GitOps Magic:** Grafana is configured via `/infra/grafana/provisioning`. When the service loads, it auto-connects to Prometheus and Loki. This means that we have no manual steps, everything is controlled in our config files.
  - **Future:** Extensions for our data layer are also in our planning pipeline.

### Automated Maintenance

Watchtower is disabled in the staging Compose file. GitHub Actions deploys staging images after CI and image scans pass.

### Mail Server

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` and `SMTP_FROM` in Phase for the deployed mail service. Local development uses MailHog. The repository does not provision a production mailserver.
