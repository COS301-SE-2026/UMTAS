# Docker Compose Reference Manual (v5.1.2)

## Section 0: Quick Start

Immediate hands-on path for multi-container orchestration.

```yaml
# docker-compose.yml
version: "3.8"
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

```bash
# Start the application
docker compose up -d
```

Visit `http://localhost:8080` → See "Welcome to nginx!" response.

---

## Section 1: Key Language Terms & Features

- **Services** — Definitions for individual containers in the application | `services: web:` | ⚠️ Keep service names simple and descriptive.
- **Project Name** — The namespace for your application, defaults to the directory name | `COMPOSE_PROJECT_NAME=my-app` | ⚠️ Set a custom project name to avoid collisions when running multiple instances.
- **Networks** — Shared communication channels defined at the top level | `networks: frontend:` | ⚠️ Compose automatically creates a `default` network; use custom networks for better isolation.
- **Volumes** — Persistent storage defined at the top level for sharing across services | `volumes: db-data:` | ⚠️ Use named volumes instead of host paths for better portability across OSs.
- **Environment Variables** — Configuration passed to containers at runtime | `env_file: .env` | ⚠️ Use `.env` files for secrets and keep them out of version control.
- **Build Configuration** — Instructions for building an image if it doesn't exist | `build: context: ./app` | ⚠️ Use `docker compose build` to force a rebuild if files change but the image tag hasn't.
- **Dependencies** — Order of service startup | `depends_on: - db` | ⚠️ `depends_on` only waits for the container to start, not for the application inside to be "ready."
- **Profiles** — Selective service activation for different environments (dev, test, prod) | `profiles: ["debug"]` | ⚠️ Use profiles to keep your main file clean while allowing for optional tools like Adminer.
- **Healthchecks** — Custom commands to verify if a service is actually ready | `healthcheck: test: ["CMD", "curl", "-f", "http://localhost"]` | ⚠️ Use healthchecks in combination with `depends_on` (condition: service_healthy).
- **Extending Files** — Ability to split configuration across multiple files | `docker compose -f base.yml -f dev.yml up` | ⚠️ The order of `-f` flags matters; later files override earlier ones.

---

## Section 2: Key Commands & Workflows

- `docker compose up` — Builds, (re)creates, starts, and attaches to containers for a service | _Primary dev command._
- `docker compose down` — Stops containers and removes containers, networks, volumes, and images created by `up` | _Cleanup._
- `docker compose build` — Build or rebuild services | _When Dockerfile changes._
- `docker compose ps` — List containers | _Checking status._
- `docker compose logs -f` — View output from containers with "follow" mode | _Debugging runtime errors._
- `docker compose exec <service> <command>` — Run a command in a running container | _Executing migrations or shell access._
- `docker compose stop` — Stop services | _Pausing the stack._
- `docker compose start` — Start services | _Resuming the stack._
- `docker compose restart` — Restart services | _Applying config changes._
- `docker compose pull` — Pull service images | _Updating images from registry._

---

## Section 3: Architecture & Component Relationships

Docker Compose orchestrates multiple containers as a single unit using a declarative YAML file.

```text
docker-compose.yml
        ↓
[ Docker Compose CLI ]
        ↓
  [ Docker Daemon ]
  ↙        ↓        ↘
Network  Service A  Service B
           ↓          ↓
         Volume A   Volume B
```

---

## Section 4: Documentation Links

- [Official Documentation](https://docs.docker.com/compose/) — _Comprehensive overview._
- [Compose File Reference](https://docs.docker.com/compose/compose-file/) — _Detailed YAML syntax._
- [Sample Apps](https://github.com/docker/awesome-compose) — _Curated list of multi-container setups._
- [Environment Variables in Compose](https://docs.docker.com/compose/environment-variables/) — _Config management best practices._
- [Production Best Practices](https://docs.docker.com/compose/production/) — _Scaling and security tips._
