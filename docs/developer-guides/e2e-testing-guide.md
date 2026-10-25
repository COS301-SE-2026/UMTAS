# E2E Testing Guide

!!! info "E2E tests verify real user flows in a real browser."
    Use them for high-value journeys only - login, scheduling, file upload. Logic that fits in a unit or integration test belongs there instead.

---

## :material-map-marker: Where Things Live

```
apps/e2e/
  playwright.config.ts   ← Playwright configuration
  tests/
    some.spec.ts         ← test files go here
```

---

## :material-test-tube: Tools

| Tool                                                                                                                  | Role                          |
| :-------------------------------------------------------------------------------------------------------------------- | :---------------------------- |
| ![Playwright](https://img.shields.io/badge/-playwright-%232EAD33?style=for-the-badge&logo=playwright&logoColor=white) | Browser automation across Chromium, Firefox and Microsoft Edge. |

---

## :material-cog: Local vs CI

| Setting         | Local                   | CI                              |
| :-------------- | :---------------------- | :------------------------------ |
| **Workers**     | Single worker          | Single worker                   |
| **Retries**     | 0                       | 2                               |
| **Reporter**    | HTML (opens on failure) | List + HTML (never auto-opens)  |
| **Base URL**    | `http://localhost:3001` | `$PLAYWRIGHT_BASE_URL` env var  |
| **`test.only`** | Allowed                 | **Breaks the build**            |

---

## :material-console: What to Run

```bash
# App must be running first (pnpm run dev)
pnpm --filter e2e run test

# Against a different URL
PLAYWRIGHT_BASE_URL=http://localhost:4000 pnpm --filter e2e run test

# Single file
pnpm --filter e2e exec playwright test tests/login.spec.ts

# View the HTML report
pnpm --filter e2e exec playwright show-report

# First-time browser install
pnpm --filter e2e exec playwright install
```

!!! info "E2E runs in CI"
    The pipeline runs `pnpm test:e2e`. Its runner manages an isolated Docker stack. Local `pnpm --filter e2e run test` uses an already running app.

---

## :material-alert-circle: What to Worry About

??? warning "The app must be running"
    Start infrastructure and the app before running tests:
    ```bash
    just dev-infra       # Starts infrastructure and both workers.
    just both            # Starts the frontend and backend.
    ```

??? warning "`test.only` will break CI"
    `forbidOnly` is enabled when `CI` is set. Remove any `test.only` before committing.

---

## :material-check-decagram: Definition of Done

??? success "E2E Checklist"
    - [ ] Test covers a real user journey - not logic that belongs in a unit test.
    - [ ] Test file is in `apps/e2e/tests/`.
    - [ ] No `test.only` left in the file.
    - [ ] App is running and tests pass locally.
    - [ ] Test name describes the user action: `test('student can upload PDF and view schedule')`