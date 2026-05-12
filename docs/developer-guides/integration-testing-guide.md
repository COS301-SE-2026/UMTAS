# Integration Testing Guide

!!! info "Purpose"
This guide defines how we test the interaction between parts of the system so features work together as expected across database and service boundaries.

---

## :material-auto-fix: Workflow (Interaction Focus)

Testing endpoint-to-database behavior and external services should be done **test-first** to guarantee reliable architecture interaction boundaries.

1.  **Identify**: Pinpoint the cross-service flow or system interaction to validate.
2.  **Prepare**: Set up the environment and test data (fixture/seed).
3.  **Red**: Write the failing integration test asserting the correct HTTP response or database state.
4.  **Green**: Write the minimal code to satisfy the integration bounds.
5.  **Refactor**: Clean up the interaction logic while keeping the test suite green.
6.  **Verify**: Confirm CI passes and the feature can be reviewed with confidence.

---

## :material-flask: Tools & Environment

| Layer             | Tool                                                                                                                  | Focus                                      |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- |
| **API to DB**     | ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white) + **PGLite**      | Controller, Service, and ORM integration   |
| **E2E / Browser** | ![Playwright](https://img.shields.io/badge/-playwright-%232EAD33?style=for-the-badge&logo=playwright&logoColor=white) | Full user-facing flows (Login, Scheduling) |
| **Microservices** | ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)              | NestJS ↔ FastAPI communication contracts   |

---

## :material-check-decagram: Definition of Done

??? success "Integration Checklist" - [ ] Full interaction path is covered (Request → Logic → DB → Response). - [ ] Test data (Fixtures) are reliable and version-controlled. - [ ] External dependencies are stubbed or mocked in the approved way. - [ ] Suite passes in the local ephemeral environment. - [ ] No fragile shared state exists between tests.

---

## :material-layers: Best Practices

=== "PGLite (Database)"
Use **PGLite** for database integration tests. It allows you to spin up a fresh, in-memory Postgres instance for every test file, ensuring total isolation.

    ```bash
    pnpm run test:pglite
    ```

=== "Playwright (E2E)"
Use Playwright for user-facing flows where browser behavior matters. Focus on high-value paths like "Student can upload PDF and view schedule."

=== "Seed Data"
Keep your seed data / fixtures minimal. Large fixtures make tests slow and hard to maintain. Prefer programmatic setup in `beforeEach`.
