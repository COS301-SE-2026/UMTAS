# Local CI/CD Guide

!!! info "CI is confirmation, not discovery."
    Catch everything locally first. If remote CI fails, a local check was skipped.

---

## :material-map-marker: Where Things Live

```
.husky/
  pre-commit   ← fires on every git commit
  pre-push     ← fires on every git push
.actrc         ← act image + architecture config
.github/workflows/ci.yml   ← the real pipeline (lint → build → test → docker → deploy)
```

---

## :material-console: What to Run

```bash
pnpm run lint        # ESLint across all apps
pnpm run build       # Turborepo build (dependency order respected)
pnpm run test:unit   # Jest unit + integration (no e2e)
pnpm run act         # simulate the full CI job locally
```

!!! warning "Always use `pnpm run act`, not plain `act`"
    Plain `act` queues the `docker`, `deploy`, and `notify` jobs which require secrets and will fail or push images. `pnpm run act` scopes to `-j ci` only.

---

## :material-hook: Git Hooks

=== "Pre-Commit"
    1. **Blocks commits to `main`, `master`, `dev`** — use a feature branch.
    2. **Runs `lint-staged`** — Prettier, ESLint, secretlint on staged files.
    3. **Type-checks staged TypeScript** — only the app(s) with staged `.ts`/`.tsx` files.

=== "Pre-Push"
    1. **Passes protected branches through** (`main`, `master`, `dev`) — no checks.
    2. **Enforces branch naming** on all other branches:

    ```
    <type>/<description>
    ```

    | **type**        | `feat`, `fix`, `chore`, `refactor`, `hotfix`, `docs`, `test` |
    | :-------------- | :------------------------------------------------------------ |
    | **description** | Lowercase, digits, hyphens. No leading/trailing hyphens.      |

    ✅ `feat/add-user-auth` &nbsp; ✅ `fix/login-redirect`

    ❌ `feature/AddUserAuth` &nbsp; ❌ `myBranch`

---

## :material-alert-circle: What to Worry About

??? warning "CI job order"
    ```
    ci (lint → build → test)
      └── docker   ← push events only, needs ci to pass
            └── deploy   ← dev branch only
                  └── notify (Discord)
    ```
    Fix lint/build/test failures first — nothing else runs until `ci` passes.

---

## :material-check-decagram: Definition of Done

??? success "Pre-Push Checklist"
    - [ ] Branch name follows `<type>/<description>`.
    - [ ] `pnpm run lint` passes.
    - [ ] `pnpm run build` passes.
    - [ ] `pnpm run test:unit` is fully green.
    - [ ] E2E tests pass locally (`pnpm --filter e2e run test`).
    - [ ] Branch is up-to-date with `dev`.
