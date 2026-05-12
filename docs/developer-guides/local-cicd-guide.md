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
| **act**        | Local GitHub Actions runner | `act -j build-and-test` |
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
    `act` allows you to run your GitHub Actions workflows inside Docker containers on your local machine.

    ```bash
    # Run the default push workflow
    act push
    ```

=== "PGLite Parity"
    Always use **PGLite** for local checks if the CI uses it. This ensures that database-dependent tests behave identically on your machine and the runner.

=== "CI as Confirmation"
    Treat remote CI as **confirmation**, not discovery. If CI fails, it usually means a local check was skipped.
