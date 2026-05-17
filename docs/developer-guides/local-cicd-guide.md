# Local CI/CD Guide

!!! info "Purpose"
    This guide defines the checks developers should run locally before pushing code. The goal is to catch issues in the "inner loop" before they reach the remote GitHub Actions pipeline.

---

## :material-auto-fix: Workflow (Inner Loop)

As a core part of **TDD**, your local validation loop is the fastest feedback you have.

1.  **Sync**: Pull latest `dev` and rebase.
2.  **Lint & Build**: Ensure code style and type safety.
3.  **Test**: Run **Jest** (Unit) and **Playwright** (E2E).
4.  **Simulate**: Use `act` to run GitHub Actions workflows locally.
5.  **Push**: Only push once the local "CI" passes.

---

## :material-github: Local CI Tools

| Tool           | Role                        | Command                 |
| :------------- | :-------------------------- | :---------------------- |
| **act**        | Local GitHub Actions runner | `pnpm run act` |
| **pnpm**       | Monorepo task runner        | `pnpm run check`        |
| **ESLint**     | Static code analysis        | `pnpm run lint`         |
| **TypeScript** | Type safety check           | `pnpm run typecheck`    |

---

## :material-check-decagram: Definition of Done

??? success "Pre-Push Checklist"
    - [ ] All linting issues resolved.
    - [ ] `pnpm build` succeeds for all affected packages.
    - [ ] Unit and Integration tests are 100% green.
    - [ ] Relevant `act` workflows pass locally.
    - [ ] Branch is up-to-date with `dev`.

---

## :material-layers: Best Practices

=== "Using `act`"
    `act` runs GitHub Actions workflows inside Docker containers on your local machine.
    Configuration lives in `.actrc` (image pinning, architecture, socket path).

    ```bash
    # Run the CI job (lint → build → test) — safe locally, no secrets needed
    pnpm run act

    # List all jobs that will run without executing them
    act push -j ci -l
    ```

    !!! warning "Avoid running the full workflow"
        Omitting `-j ci` will also queue the `docker`, `deploy`, and `notify` jobs, which
        require DockerHub and SSH secrets and will fail or push images unintentionally.

=== "PGLite Parity"
    Always use **PGLite** for local checks if the CI uses it. This ensures that database-dependent tests behave identically on your machine and the runner.

=== "CI as Confirmation"
    Treat remote CI as **confirmation**, not discovery. If CI fails, it usually means a local check was skipped.
