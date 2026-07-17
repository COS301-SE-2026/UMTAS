# Backend Development Guide

!!! info "Purpose"
    This guide defines the expected workflow for building backend features and endpoints in a consistent, review-friendly way using our modern stack.

---

## :material-auto-fix: Workflow (Red-Green-Refactor)

1.  **Sync**: Pull latest from `dev` and create a feature branch.
2.  **Service**: Identify the owner (NestJS Core, parser worker, solver worker, Python parser, or C++ solver).
3.  **Red**: Write a failing unit/integration test in **Jest** or **pytest**.
4.  **Green**: Implement the logic. Use **PGLite** for ephemeral DB tests.
5.  **Refactor**: Clean up the code while keeping tests green.
6.  **Swagger**: Update or create the required API definitions.
7.  **PR**: Open a PR into `dev` once local checks pass.

---

## :material-server-network: Backend Technology Stack

| Component         | Technology                                                                                                   | Role                                      |
| :---------------- | :----------------------------------------------------------------------------------------------------------- | :---------------------------------------- |
| **API Framework** | ![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white) | Main core API & business logic            |
| **Data Access**   | ![DrizzleORM](https://img.shields.io/badge/drizzle-C5F74F.svg?style=for-the-badge&logo=drizzle&logoColor=black)  | Type-safe DB modelling and migrations     |
| **Job Queue**     | ![BullMQ](https://img.shields.io/badge/bullmq-FF4500?style=for-the-badge&logo=bullmq&logoColor=white)        | Async jobs (PDF Parsing, Solver triggers) |
| **Compute workers** | BullMQ workers with Python and C++ CLIs | PDF parsing and timetable solving outside request paths |
| **Auth**          | ![OAuth 2.0](https://img.shields.io/badge/oauth%202.0-eb5424?style=for-the-badge&logo=auth0&logoColor=white) | Session management & Google OAuth2        |

---

## :material-check-decagram: Definition of Done

??? success "Backend Checklist"
    - [ ] Work is isolated in a feature branch.
    - [ ] Swagger definitions are complete and tested.
    - [ ] Unit and Integration tests are passed.
    - [ ] Drizzle migrations are generated and tested.
    - [ ] CI passes successfully.
    - [ ] Code follows the [Core-and-Adapter](../diagrams/architecture/Adapter-Pattern.md) pattern.

---

## :material-database: Database Strategy

=== "DrizzleORM (Default)"
    Use Drizzle for all core entity management. Schemas are located in `apps/backend/src/entities`.

    ```typescript
    export const users = pgTable('users', {
      id: uuid('id').primaryKey().defaultRandom(),
      email: text('email').unique().notNull(),
    });
    ```

=== "PGLite (Testing)"
    Use PGLite for lightning-fast, isolated unit tests. No Docker required.

    ```bash
    pnpm run test:pglite
    ```
