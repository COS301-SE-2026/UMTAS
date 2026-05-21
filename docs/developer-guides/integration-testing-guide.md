# Integration Testing Guide

!!! info "Write the failing integration test first."
    Integration tests verify that pieces of the system work together: HTTP → service → database → response.

---

## :material-map-marker: Where Things Live

=== "Backend (Jest + PGLite)"
    ```
    apps/backend/src/
      some.controller.spec.ts   ← integration test next to the controller
    ```
    Each test file gets a fresh in-memory Postgres - no Docker needed.

=== "Microservices (FastAPI)"
    ```
    apps/solver/tests/
      test_contract.py   ← NestJS ↔ FastAPI contract tests
    ```

---

## :material-flask: Tools

| Layer             | Tool                                                                                                                | Focus                                    |
| :---------------- | :------------------------------------------------------------------------------------------------------------------ | :--------------------------------------- |
| **API → DB**      | ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white) + **PGLite**   | Controller, Service, and ORM integration |
| **Microservices** | ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)           | NestJS ↔ FastAPI contracts               |

---

## :material-console: What to Run

```bash
pnpm run test:int             # all integration tests
```

---

## :material-alert-circle: What to Worry About

??? warning "Test isolation"
    PGLite is fresh per file, but state leaks between tests within the same file.
    Always use `beforeEach` to reset data. Never rely on test execution order.

??? warning "What belongs here vs unit tests"
    An integration test must cross a real boundary (HTTP → service, service → DB).
    If you're mocking the database, it's a unit test - move it.

??? warning "Fixtures"
    Keep seed data minimal. Only insert the exact rows your test needs.

---

## :material-check-decagram: Definition of Done

??? success "Integration Test Checklist"
    - [ ] Failing test written before the feature.
    - [ ] Full path covered: Request → Service → DB → Response.
    - [ ] Each test file is fully isolated - no shared state.
    - [ ] External HTTP calls (solver, third-party) are mocked.
    - [ ] Suite passes locally (`pnpm run test:int`).
