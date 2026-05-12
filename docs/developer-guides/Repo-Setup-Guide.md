# Repo Setup Guide

_Written by Marcel Stoltz_  
:material-calendar: _24 Apr 2026_

---

## :material-target: Purpose

This guide serves as a repo setup guide for the **2026 Vigil Capstone Team**, specifically for the UMTAS Project.

### Our Approach to the Ideal Developer Experience

We use `pnpm workspaces` via root scripts such as **TurboRepo**.

**The goal?**  
Frontend devs never need to worry about Python dependencies, and backend devs don't have to struggle with `venv`.

---

## :material-auto-fix: The "One Command" Workflow

### A: Bootstrap a New Dev

```bash
pnpm run setup
```

??? note "What happens during setup?" 1. **Tool Check**: Verifies `docker`, `pnpm`, and `node` versions. 2. **Env Config**: Copies `.env.example` to `.env`. 3. **Install**: Runs `pnpm install` across all workspaces. 4. **Solver Prep**: Pulls or builds the Docker image for the Python solver.

---

### B: Development Lifecycle

We use a split strategy for the fastest hot-reload performance.

=== "Terminal 1: Infrastructure"

    ```bash
    pnpm run dev:infra # (1)
    ```

    1.  Starts **Postgres**, **Redis**, **MinIO**, and the **Python Solver** container.

=== "Terminal 2: Application"

    ```bash
    pnpm run dev # (2)
    ```

    2.  Boots **Turborepo** to run the Next.js frontend and NestJS backend natively.

---

## :material-layers: Deployment & Advanced Modes

While local native dev is fastest, we maintain Docker profiles for full system testing.

??? abstract "Full Docker Stack"
**Command**: `pnpm run dev:docker`

    Boots the full infrastructure PLUS the frontend and backend in containers. Use this to verify network flows and environment variables before a merge.

??? abstract "Monitoring Mode (PLG Stack)"
**Command**: `pnpm run dev:monitor`

    Adds the observability layer:

    - **Grafana**: Dashboards
    - **Prometheus**: Metrics
    - **Loki**: Log Aggregation

---

## :material-flask: Quality Assurance

1. **Unit & Integration**: Powered by **Jest**.
2. **E2E**: Powered by **Playwright**.
3. **Pre-commit Hooks**: Managed by **Husky** + **Lint Staged**.
4. **Local CI Simulation**: Run your GitHub Actions locally using `act`.

---

## :material-help-circle: Troubleshooting

??? bug "Docker Permission Denied"
Ensure your user is part of the `docker` group:

    ```bash
    sudo usermod -aG docker $USER
    ```

??? bug "PNPM Lockfile Conflicts"
If you encounter lockfile issues after a heavy merge, run:

    ```bash
    pnpm install --no-frozen-lockfile
    ```
