# Docker Reference Manual (v29.4.0)

## Section 0: Quick Start

Immediate hands-on path for containerization.

```bash
# Pull and run an official NGINX image
docker run --name my-nginx -p 8080:80 -d nginx
```

Visit `http://localhost:8080` → See "Welcome to nginx!" response.

---

## Section 1: Key Language Terms & Features

- **Images** — Read-only templates containing the application code, runtime, libraries, and environment variables | `FROM node:20` | ⚠️ Use small base images like `alpine` to reduce surface area and build time.
- **Containers** — Runnable instances of an image; isolated environments that share the host kernel | `docker run <image>` | ⚠️ Containers should be ephemeral; store persistent data in volumes.
- **Dockerfile** — Text document containing all commands to assemble an image | `COPY . /app` | ⚠️ Leverage layer caching by putting infrequent changes (like `pnpm install`) before frequent ones (like `COPY . .`).
- **Volumes** — Persistent storage mechanism for containers, decoupled from the container lifecycle | `docker run -v /data:/app/data` | ⚠️ Use named volumes for production and bind mounts for development.
- **Networks** — Isolated communication channels between containers | `docker network create my-net` | ⚠️ Use the `bridge` driver for standalone containers and `overlay` for Swarm.
- **Registry** — Storage and distribution system for Docker images (e.g., Docker Hub, ECR) | `docker push my-repo/my-image` | ⚠️ Always tag your images with versions instead of just using `latest`.
- **Layers** — Successive changes made to an image, cached for efficiency | `RUN apt-get update && apt-get install -y ...` | ⚠️ Combine multiple `RUN` commands with `&&` to minimize the number of layers.
- **Build Context** — The set of files sent to the Docker daemon during the build process | `docker build .` | ⚠️ Use `.dockerignore` to exclude large, unnecessary files (like `node_modules` or `.git`).
- **Entrypoint** — The main command executed when a container starts | `ENTRYPOINT ["npm", "start"]` | ⚠️ Prefer `ENTRYPOINT` over `CMD` for executables that should always run.
- **Multi-stage Builds** — Optimization technique using multiple `FROM` statements to create smaller production images | `FROM node AS build ... FROM nginx` | ⚠️ Great for compiling source code and only copying the binary/assets to the final image.

---

## Section 2: Key Commands & Workflows

- `docker build -t <tag> .` — Builds an image from a Dockerfile in the current directory | _When creating a new image._
- `docker run <image>` — Creates and starts a container from an image | _When launching a service._
- `docker ps` — Lists all running containers | _When checking status._
- `docker stop <id>` — Gracefully stops a running container | _When shutting down a service._
- `docker rm <id>` — Removes a stopped container | _Cleanup._
- `docker rmi <id>` — Removes an image | _Cleanup._
- `docker exec -it <id> bash` — Executes an interactive shell inside a running container | _Debugging._
- `docker logs <id>` — Fetches the logs of a container | _Troubleshooting._
- `docker system prune` — Removes all unused containers, networks, and dangling images | _Freeing up disk space._
- `docker pull <image>` — Downloads an image from a registry | _Fetching dependencies._

---

## Section 3: Architecture & Component Relationships

Docker uses a client-server architecture. The Docker client talks to the Docker daemon, which does the heavy lifting of building, running, and distributing your Docker containers.

```text
Docker Client (CLI)  ↔  Docker Daemon (Host)  ↔  Registry (Remote)
                           ↓          ↓
                       Containers   Images
                           ↓          ↓
                        Volumes    Networks
```

---

## Section 4: Documentation Links

- [Official Documentation](https://docs.docker.com/) — _Core guides and architecture._
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/) — _Detailed command syntax._
- [Docker Hub](https://hub.docker.com/) — _Explore public images._
- [Best Practices for Build](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) — _Optimization tips._
- [Networking Overview](https://docs.docker.com/network/) — _How containers communicate._
