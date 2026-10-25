# Local CI/CD Guide

!!! info "CI is confirmation, not discovery."
    Run relevant checks locally before pushing. CI also validates the isolated integration and browser stacks.

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
pnpm run test:unit   # Runs workspace unit tests without E2E.
pnpm run act         # simulate the full CI job locally
```

!!! warning "Always use `pnpm run act`, not plain `act`"
    Plain `act` can queue image publication and deployment jobs that require secrets. `pnpm run act` scopes to `-j ci` only.

---

## :material-hook: Git Hooks

=== "Pre-Commit"
    1. **Blocks commits to `main`, `master`, `dev`** - use a feature branch.
    2. **Runs `lint-staged`** - Prettier, ESLint, secretlint on staged files.
    3. **Type-checks staged TypeScript** - only the app(s) with staged `.ts`/`.tsx` files.

=== "Pre-Push"
    1. **Passes protected branches through** (`main`, `master`, `dev`) - no checks.
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
    ci (lint → build → unit → integration → E2E)
      ├── docker-staging → image-scan → deploy-staging (dev pushes)
      └── docker-release → image-scan (v* tag pushes)
    ```
    Image publication requires `ci` to pass. PR image scans run independently. Production deployment uses the separate manual workflow.

    CI runs backend and shared worker unit suites. Run frontend Jest locally with `pnpm --filter frontend test` because it is not included in the CI unit step.

---

## :material-check-decagram: Definition of Done

??? success "Pre-Push Checklist"
    - [ ] Branch name follows `<type>/<description>`.
    - [ ] `pnpm run lint` passes.
    - [ ] `pnpm run build` passes.
    - [ ] `pnpm run test:unit` is fully green.
    - [ ] E2E tests pass locally (`pnpm --filter e2e run test`).
    - [ ] Branch is up-to-date with `dev`.
