# Integration Testing Guide

---

## :material-map-marker: Where Things Live

=== "Backend (Jest + Docker)"
    ```
    apps/backend/test/integration-runner/
      run.ts                   ← manages the isolated full-stack tests
    ```
    The runner starts PostgreSQL, Redis, object storage, the backend and both workers in Docker.

=== "Worker and Process Contracts"
    ```
    apps/solver-worker/src/tests/
    apps/pdf_parser/worker/src/tests/
    packages/shared-types/tests/
    ```

---

## :material-flask: Tools

| Layer             | Tool                                                                                                                | Focus                                    |
| :---------------- | :------------------------------------------------------------------------------------------------------------------ | :--------------------------------------- |
| **API → DB**      | ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white) + **PostgreSQL**   | Controller, Service, and ORM integration |
| **Worker contracts** | Jest and shared schemas | Queue, command-line, callback, and process contracts |

---

## :material-console: What to Run

```bash
pnpm test:integration             # all integration tests
```

---

## :material-alert-circle: What to Worry About

??? warning "Test isolation"
    The runner removes its Compose volumes after the managed run. Reset scenario data where needed and never rely on test execution order.

??? warning "What belongs here vs unit tests"
    An integration test must cross a real boundary (HTTP → service, service → DB).
    If you're mocking the database, it's a unit test - move it.

??? warning "Fixtures"
    Keep seed data minimal. Only insert the exact rows your test needs.

---

## :material-check-decagram: Definition of Done

??? success "Integration Test Checklist"
    - [ ] Full path covered: Request → Service → DB → Response.
    - [ ] Each test file is fully isolated - no shared state.
    - [ ] Parser and solver workers run in the integration stack. Mock third-party APIs where required.
    - [ ] Suite passes locally (`pnpm test:integration`).