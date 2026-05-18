# Server Deployment Guide

!!! info "Purpose"
    Step-by-step runbook for deploying UMTAS on a fresh Ubuntu server. Every command is copy-paste ready. No manual UI steps required after the one-time `.env` setup.

---

## :material-check-circle: Prerequisites

Before you begin, the server must have:

- Ubuntu 22.04 LTS (or 24.04)
- Docker Engine ≥ 26 and Docker Compose plugin installed
- Ports `80` and `443` open in UFW / cloud firewall
- SSH access as a non-root user with `sudo`
- All DNS A records pointing at the server IP:

| Subdomain | A record |
| :--- | :--- |
| `capstone-vigil.dns.net.za` | `<server IP>` |
| `api.capstone-vigil.dns.net.za` | `<server IP>` |
| `storage.capstone-vigil.dns.net.za` | `<server IP>` |
| `solver.capstone-vigil.dns.net.za` | `<server IP>` |
| `grafana.capstone-vigil.dns.net.za` | `<server IP>` |
| `traefik.capstone-vigil.dns.net.za` | `<server IP>` |

??? note "Install Docker (if not already installed)"
    ```bash
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    newgrp docker
    docker --version        # Docker version 26.x.x
    docker compose version  # Docker Compose version v2.x.x
    ```

---

## :material-server: 1. Harden the Server

!!! warning "Do this before exposing any ports"

```bash
# Move SSH to a non-standard port
sudo sed -i 's/^#Port 22/Port 2222/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Enable UFW — allow only SSH, HTTP, HTTPS
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp    # SSH on new port
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## :material-source-repository: 2. Clone the Repository

```bash
sudo mkdir -p /opt/umtas
sudo chown $USER:$USER /opt/umtas
git clone --branch feat/cicd-production --single-branch https://github.com/COS301-SE-2026/UMTAS.git /opt/umtas
cd /opt/umtas
```

---

## :material-cog: 3. Create the `.env` File

```bash
cp .env.example .env
nano .env          # or vim .env
```

Fill in every value. Use the commands below to generate the secrets.

### Generate random secrets

```bash
# DB_PASSWORD, MINIO_ROOT_PASSWORD, REDIS_PASSWORD, GRAFANA_ADMIN_PASSWORD
openssl rand -base64 32

# BETTER_AUTH_SECRET (needs 32+ chars)
openssl rand -base64 48
```

### Generate the Traefik dashboard password hash

```bash
# Replace MY_PASSWORD with your chosen password
echo $(htpasswd -nb admin MY_PASSWORD) | sed -e 's/\$/\$\$/g'
```

Paste the output as `TRAEFIK_DASHBOARD_CREDENTIALS`.

!!! tip "htpasswd not installed?"
    ```bash
    sudo apt install apache2-utils -y
    ```

### Set the Watchtower Discord webhook

The URL must use the **shoutrrr** format, not the raw Discord webhook URL:

```
WATCHTOWER_DISCORD_URL=discord://TOKEN@WEBHOOK_ID
```

To convert your Discord webhook URL:

```
# Discord gives you: https://discord.com/api/webhooks/WEBHOOK_ID/TOKEN
# shoutrrr format:   discord://TOKEN@WEBHOOK_ID
```

### Set Google OAuth (optional)

Leave `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` blank if you are not using Google login.

### Final `.env` checklist

??? success "All required variables"
    | Variable | Example / Source |
    | :--- | :--- |
    | `DOMAIN` | `capstone-vigil.dns.net.za` |
    | `LETSENCRYPT_EMAIL` | your email |
    | `PROJECT_NAME` | `umtas` |
    | `DOCKER_REGISTRY` | `vigilcs/umtas` |
    | `TRAEFIK_DASHBOARD_CREDENTIALS` | output of `htpasswd` command above |
    | `DOCKERHUB_USERNAME` | your Docker Hub username |
    | `DOCKERHUB_TOKEN` | Docker Hub access token |
    | `WATCHTOWER_DISCORD_URL` | `discord://TOKEN@WEBHOOK_ID` |
    | `BACKEND_PORT` | `8000` |
    | `FRONTEND_PORT` | `3000` |
    | `DB_USER` | `capstone_admin` |
    | `DB_PASSWORD` | `openssl rand -base64 32` |
    | `DB_NAME` | `umtas_db` |
    | `DB_MODE` | `DATABASE` |
    | `SEED` | `FALSE` |
    | `MINIO_ROOT_USER` | `storage_admin` |
    | `MINIO_ROOT_PASSWORD` | `openssl rand -base64 32` |
    | `REDIS_PASSWORD` | `openssl rand -base64 32` |
    | `GRAFANA_ADMIN_PASSWORD` | `openssl rand -base64 32` |
    | `BETTER_AUTH_SECRET` | `openssl rand -base64 48` |
    | `GOOGLE_CLIENT_ID` | _(optional)_ |
    | `GOOGLE_CLIENT_SECRET` | _(optional)_ |
    | `SYSTEM_ADMIN_USER_IDS` | _(optional)_ |

---

## :material-docker: 4. Start Everything

```bash
cd /opt/umtas
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile server up -d
```

This single command starts all services:

| Service | Role |
| :--- | :--- |
| `traefik` | Reverse proxy + SSL termination |
| `postgres` | Primary database |
| `redis` | Cache / session store |
| `minio` | Object storage |
| `backend` | NestJS API |
| `frontend` | Next.js app |
| `solver` | Python solver service |
| `grafana` | Dashboards |
| `prometheus` | Metrics collection |
| `loki` | Log aggregation |
| `promtail` | Log shipper (reads Docker JSON logs) |
| `node-exporter` | Host metrics |
| `cadvisor` | Container metrics |
| `postgres-exporter` | PostgreSQL metrics |
| `watchtower` | Automatic image updates |

Watch services come up:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile server ps
```

Follow live logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile server logs -f
```

---

## :material-check-all: 5. Verify the Deployment

### Check Prometheus targets

Open `https://traefik.capstone-vigil.dns.net.za` → log in with the credentials from `TRAEFIK_DASHBOARD_CREDENTIALS`.

Then open Prometheus via the Grafana Explore panel, or verify directly by checking that all scrape targets are `UP`:

=== "Expected Prometheus targets"
    | Job | Target |
    | :--- | :--- |
    | `prometheus` | `localhost:9090` |
    | `traefik` | `traefik:8082` |
    | `backend` | `backend:8000` |
    | `solver` | `solver:8000` |
    | `node` | `node-exporter:9100` |
    | `cadvisor` | `cadvisor:8080` |
    | `postgres` | `postgres-exporter:9187` |

=== "Quick health check via curl (on server)"
    ```bash
    # Prometheus itself
    docker exec -it $(docker ps -qf name=prometheus) wget -qO- localhost:9090/-/healthy

    # Loki
    docker exec -it $(docker ps -qf name=loki) wget -qO- localhost:3100/ready
    ```

### Check Grafana datasources

Open `https://grafana.capstone-vigil.dns.net.za` and log in with:

- **User**: `admin`
- **Password**: the value of `GRAFANA_ADMIN_PASSWORD` from your `.env`

Go to **Connections → Data sources** and verify both `Prometheus` and `Loki` show a green **"Data source is working"** status.

Dashboards auto-provision on startup. Navigate to **Dashboards** to see all 7 pre-loaded dashboards.

### Verify SSL certificates

```bash
# Each domain should show a valid Let's Encrypt cert
curl -I https://capstone-vigil.dns.net.za
curl -I https://api.capstone-vigil.dns.net.za
```

---

## :material-link: 6. Live URLs

| URL | Service |
| :--- | :--- |
| `https://capstone-vigil.dns.net.za` | Frontend |
| `https://api.capstone-vigil.dns.net.za` | Backend API |
| `https://storage.capstone-vigil.dns.net.za` | MinIO console |
| `https://solver.capstone-vigil.dns.net.za` | Solver service |
| `https://grafana.capstone-vigil.dns.net.za` | Grafana dashboards |
| `https://traefik.capstone-vigil.dns.net.za` | Traefik dashboard |

---

## :material-update: 7. Ongoing Operations

### CI/CD — automatic app updates

Watchtower polls Docker Hub every hour. When CI pushes a new image, Watchtower:

1. Detects the new `backend-dev`, `frontend-dev`, or `solver-dev` image
2. Pulls and restarts the affected container with zero downtime
3. Sends a Discord notification with the result

**The `dev` branch** → builds `:backend-dev` / `:frontend-dev` / `:solver-dev` images → Watchtower auto-deploys.

Infrastructure containers (`grafana`, `prometheus`, `loki`, etc.) have `com.centurylinklabs.watchtower.enable=false` and are never auto-updated.

### Updating infrastructure config

When you change files under `/infra` or `docker-compose*.yml`:

```bash
cd /opt/umtas
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile server up -d
```

Docker Compose will only recreate containers whose config changed. Everything else keeps running.

### Restarting a single service

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

### Viewing logs for a specific service

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

### Stopping everything

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile server down
```

!!! warning "Data is safe"
    `down` does not delete named volumes (`postgres_data`, `minio_data`, etc.). Use `down -v` only if you intentionally want to wipe all data.

---

## :material-alert: Troubleshooting

??? warning "Grafana password not working"
    The `GF_SECURITY_ADMIN_PASSWORD` env var only takes effect on the **first** container start. If the volume already exists from a previous run with a different password, reset it:
    ```bash
    docker exec -it $(docker ps -qf name=grafana) grafana-cli admin reset-admin-password NEW_PASSWORD
    ```

??? warning "Prometheus target is DOWN"
    1. Check the container is running: `docker ps | grep <service>`
    2. Check the service's network. Prometheus is on `internal` — all scrape targets must also be on `internal`.
    3. Check the metrics endpoint responds: `docker exec -it prometheus wget -qO- http://<service>:<port>/metrics | head`

??? warning "Let's Encrypt rate limit hit"
    During testing, switch to the staging CA to avoid hitting the production rate limit:
    ```bash
    # In .env, add:
    ACME_CA_SERVER=https://acme-staging-v02.api.letsencrypt.org/directory
    ```
    Remove the variable (or delete `acme.json` from the `letsencrypt_data` volume) before going live.

??? warning "Postgres-exporter shows pg_up=0"
    The exporter uses `DB_PASSWORD` from `.env`. If the postgres volume was initialised with a different password, update the DB user:
    ```bash
    docker exec -it postgres psql -U capstone_admin -d umtas_db \
      -c "ALTER USER capstone_admin PASSWORD 'your-current-db-password';"
    ```

??? warning "Watchtower Discord notification not arriving"
    Ensure the URL uses the shoutrrr format, not the raw webhook URL:
    ```
    # Wrong:  https://discord.com/api/webhooks/ID/TOKEN
    # Correct: discord://TOKEN@ID
    ```
    Regenerate the Discord webhook if the token was ever exposed.
