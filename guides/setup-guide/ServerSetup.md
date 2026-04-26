## Initial Hardening

written by Marcel Stoltz
24 Apr 2026

Before we installed any services we ensured that all entry points are secure.

### SSH Port Remapping

We moved the ssh port from port 22 to another port(2222) to drastically reduce the background noise logs from potential automated attacks.

### Key-only Auth ->something to consider:

<!-- We disables password authentication due to the fact that passwords can be guessed or leaked. Using Keys make brute-forcing the passwords essentially impossible. -->

### Enable UFW

This firewall acts as our outer gate. We deny all incoming traffic by default,ensuring that when we unknowingly expose an internal container port that it won't be publicly accessible. We would need to whitelist to expose the port.

### Docker Engine

We installed Docker and Docker Compose to ensure that every environment runs an identical binary. Environment in this case is prod/dev.

### Repository Prep

We cloned the repo to a specific deployment home to keep it seperated from user files and system binaries.

## Server Philosophy -> GitOps/Infrastructure As Code

As mentioned in our RepoSetup.md file we follow "One command for them all" philosophy.
Every config file is stored in the `/infra` folder. This ensures that there are 0 manual server steps.

### Networking & Routing

- Tech: Traefik V3.0
- Why: Traefik is our reverse proxy of choice. It integrates natively with the docker daemon. It discovers new containers on the go, reads their labels and then it creates routing rules for each container dynamically.
- SSL: Traefik also handles SSL certficiates through an HTTP challenge. What is an HTTP Challenge? It's just a check that traefik uses to verify if we own the domain.
- Security: Traefik is the only service that exposes ports (80 and 443). Everything else is configured to live and communicate on an internal network.

### Monitoring & Observability

- Tech:We use the Prometheus, Loki, and Grafana (PLG) stack to monitor everything.
- Prometheus (Metrics): Promotheus acts as a web scraper for our numeric data (CPU, memory, request counts) from Traefik, Backend, and Solver.
- Loki & Promtail (Logs):
  - Why: Mangaing all the logs from docker logs is completely unscalable.
  - How: We are using PromTail. What does PromTail do? PromTail mounts the host's `/var/lib/docker/containers` directory. It then reads the raw JSON logs of every container, and sends them to the Loki Service through the internal network.
- Grafana (Visualisation):
  - Why: It combines Prometheus metrics and Loki logs into one customisble dashboard.
  - GitOps Magic: Grafana is configured via `/infra/grafana/provisioning`. When the service loads, it auto-connects to Prometheus and Loki. This means that we have no manual steps, everything is controlled in our config files.
  - Future: Extenstions for our data layer are also in our planning pipeline.

### Automated Maintenance

- Tech: WatchTower
- Why: Auto-updates our containers when new images are pushed to the registry.
- Config:WatchTower runs every hour.
