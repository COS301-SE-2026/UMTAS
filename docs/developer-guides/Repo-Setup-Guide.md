# Repo Setup Guide

_Written by Marcel Stoltz_  
_24 Apr 2026_

---

## Purpose

This guide serves as a repo setup guide for the **2026 Vigil Capstone Team**, specifically for the UMTAS Project.

### Our Approach to the Ideal Developer Experience Monorepo

We will be using `pnpm workspaces` via root scripts such as **TurboRepo**.

**The goal?**  
Frontend devs never need to worry about Python dependencies, and backend devs don't have to struggle with `venv`.

**How do we approach this?**  
We split the architecture into two distinct sections:

1. **Docker Infrastructure:** Databases, queues, storage
2. **Native Application:** Next.js, NestJS

This setup ensures that devs have the benefit of containerized infrastructure to mimic the server, whilst having the benefit of hot-reload in the application themselves.

---

## The Motivation: "One Command For Them All"

### A: Bootstrap a New Dev

```bash
pnpm run setup
```

**Steps:**

1. Checks required tools
2. Copies `.env.example` to `.env`
3. Runs `pnpm install`
4. Docker image for the solver section gets handled

> **Note:** DB seeding is handled inside the DB container without needing any manual scripts.

---

### B: Ready To Dev

We use a split strategy to give our devs the fastest possible dev setup. This requires two terminal tabs. Everything is driven by a single `docker-compose.yml` file leveraging Docker Compose profiles which allows for multiple states.

- **Terminal 1: Start the Infrastructure**

  ```bash
  pnpm run dev:infra
  ```

  _Docker Compose Boots -> Postgres + Redis + MinIO + Python Solver_

- **Terminal 2: Start the Actual Code**
  ```bash
  pnpm run dev
  ```
  _Turborepo Boots -> Next.js frontend + NestJS Backend_

---

### C: Alternative & Deployment Modes

While **`B: Ready to Dev`** is the best option for local development, we do still retain the following docker profiles for testing and deployments:

1. **Full Docker Dev** (`pnpm run dev:docker`)
   - Boots Full Infrastructure + frontend + backend.
   - Useful to test everything before pushing to the server.

2. **Monitoring Mode** (`pnpm run dev:monitor`)
   - Adding a monitoring flag to the previous command boots up the **PLG Stack**:
     - Grafana
     - Prometheus
     - Loki

3. **Production Server Mode** (`pnpm run start:prod`)
   - Boots the entire stack using `docker-compose.prod.yml` + Traefik + WatchTower.

---

### Testing and CI

1. **Unit & Integration:** Powered by Jest.
2. **E2E:** Powered by Playwright.
3. **Pre-commit Hooks:** Powered by Husky + Lint Staged.
4. **Local CI:** We simulate the CI on GitHub locally using `act`.
