# Infrastructure as Code (IaC)

!!! abstract "Section Brief"
    This section outlines the containerisation and automation strategy. We utilise Docker Compose for declarative container orchestration and Just as our unified command center, completely eliminating manual "click-ops."

---

## Overview

Managing infrastructure as code through Docker Compose ensures strict reproducibility. The `justfile` abstracts the complex, multi-step docker commands for an operating system agnostic setup.

!!! success "IAC succesfully implemented"
    Full containerisation of all system components (Frontend, Backend, Solver, Postgres, Redis, MinIO) orchestrated via environment-specific `docker-compose` files.

### Technology Stack Reference

| Tool | Purpose | Scope |
| :--- | :--- | :--- |
| **Traefik v3.6** | Reverse Proxy & SSL Termination | Global Ingress(For now) |
| **Docker Compose** | Declarative Orchestration | All Environments |
| **Justfile** | Automation & Task Runner | CI/CD & Local Dev |
| **Watchtower** | Automated Image Pulling & Restarts | Staging Only |

