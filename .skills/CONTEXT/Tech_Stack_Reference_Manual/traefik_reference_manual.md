# Traefik Reference Manual (v3.6.0)

## Section 0: Quick Start

Start Traefik with Docker and route traffic to a service based on the hostname.

```bash
# Start Traefik with the Docker provider enabled
docker run -d -p 80:80 -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  traefik:v3.6 --api.insecure=true --providers.docker

# Start a service with Traefik labels
docker run -d --label "traefik.http.routers.my-app.rule=Host(\`example.com\`)" nginx
```

Expected output: Accessing `example.com` routes to the Nginx container; dashboard at `:8080`.

## Section 1: Key Language Terms & Features

- **EntryPoint** — The network port Traefik listens on (e.g., 80 for HTTP, 443 for HTTPS). | `entryPoints.web.address=:80` | ⚠️ EntryPoints must be unique; ensure no other service is using the port.
- **Provider** — A source of configuration (Docker, Kubernetes, File, Consul). | `providers.docker` | ⚠️ Providers allow Traefik to discover services dynamically.
- **Router** — Connects an EntryPoint to a Service, filtered by Rules (Host, Path, Headers). | `rule = Host("api.test")` | ⚠️ Router names must be unique across the entire Traefik instance.
- **Service** — Defines how to reach the actual backend (load balancing, health checks). | `loadBalancer.servers` | ⚠️ Traefik automatically handles load balancing if multiple replicas are found.
- **Middleware** — Components that modify requests or responses (Auth, RateLimit, Stripprefix). | `middlewares.auth.basicauth` | ⚠️ Chain multiple middlewares for complex processing flows.
- **Certificate Resolver** — Automates the acquisition of TLS certificates (ACME/Let's Encrypt). | `certificatesResolvers.myresolver.acme` | ⚠️ Requires a persistent volume to store the JSON certificate file.
- **Dynamic Configuration** — Configuration that changes without restarting Traefik (Service/Router definitions). | `providers.file.filename` | ⚠️ Static configuration (EntryPoints, Providers) DOES require a restart.
- **Dashboard** — A web-based UI for visualizing the current routing state and health. | `api.insecure = true` | ⚠️ Never expose the dashboard to the public internet without authentication.
- **Gateway API** — (v3+) The modern Kubernetes standard for routing, replacing legacy Ingress. | `apiVersion: gateway.networking.k8s.io/v1` | ⚠️ Recommended for all new Kubernetes deployments.
- **WAF Integration** — Integrated Web Application Firewall for protecting backends from common attacks. | `middlewares.waf.owasp` | ⚠️ Can impact performance; monitor latency when enabling complex rule sets.

## Section 2: Key Commands & Workflows

- `traefik --configfile=traefik.yml` — Starts Traefik with a static configuration file. | _Starting the proxy._
- `traefik version` — Displays the current Traefik version and build metadata. | _Environment check._
- `traefik healthcheck` — Verifies the health of the Traefik process. | _Docker health checks._
- `docker-compose up -d` — Standard way to deploy Traefik and its backends. | _Orchestration._
- `kubectl apply -f ingress.yml` — Deploys routing rules to a Kubernetes cluster. | _Kubernetes deployment._
- `openssl req ...` — Generates certificates for manual TLS configuration. | _Security setup._
- `curl -H "Host: example.com" http://localhost` — Manually tests routing rules. | _Connectivity testing._
- `traefik bug` — Generates a diagnostic report for issue reporting. | _Troubleshooting._

## Section 3: Architecture & Component Relationships

```
Incoming Request (Client)
       ↓
[EntryPoint] (Port 80/443)
       ↓
[Router] (Rules: Host, Path) ← [Middleware] (Auth, Compress)
       ↓
[Service] (Load Balancer)
       ↓
[Backend Instance] (Container/VM)
```

**Key Flow:** Requests arrive at an **EntryPoint**, are matched by a **Router** based on **Rules**, processed by any attached **Middleware**, and finally forwarded by a **Service** to a **Backend Instance**.

## Section 4: Documentation Links

- [Official Traefik Docs](https://doc.traefik.io/traefik/) — _Comprehensive configuration reference._
- [Docker Provider Guide](https://doc.traefik.io/traefik/providers/docker/) — _Setting up Traefik with Docker._
- [Kubernetes Ingress Guide](https://doc.traefik.io/traefik/providers/kubernetes-ingress/) — _Standard K8s integration._
- [Middleware List](https://doc.traefik.io/traefik/middlewares/overview/) — _Every available request/response modifier._
- [Traefik Hub](https://traefik.io/traefik-hub/) — _Centralized management and security platform._
