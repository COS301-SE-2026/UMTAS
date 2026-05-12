# Master Development Guide

!!! abstract "Purpose"
    This guide connects all project development guides into one shared workflow. It is the entry point for every developer joining the UMTAS project.

---

## :material-target: Core Philosophy: TDD First

Our guide system strongly emphasizes **Test-Driven Development (TDD)** to keep development correct, consistent, and easy to refactor.

!!! quote "The Golden Rule"
    **Write the test before you write the code.**

---

## :material-map: Guide Map

Use the following specialized guides based on your current task:

| Guide                                                            | Primary Focus                                    |
| :--------------------------------------------------------------- | :----------------------------------------------- |
| [:material-server: Backend Dev](./backend-development-guide.md)  | NestJS APIs, DrizzleORM, Python Solver, Swagger. |
| [:material-web: Frontend Dev](./frontend-development-guide.md)   | Next.js UI, Shadcn/UI, Radix state.              |
| [:material-cog: Server & Infra](./server-guide.md)               | Docker, Traefik, MinIO, Monitoring (PLG).        |
| [:material-test-tube: Unit Testing](./unit-testing-guide.md)     | Isolated logic, utilities, component behavior.   |
| [:material-flask: Integration](./integration-testing-guide.md)   | Cross-service communication, database flows.     |
| [:material-github: Local CI/CD](./local-cicd-guide.md)           | Running `act` and pre-push checks.               |
| [:material-source-branch: Git Strategy](./git-strategy-guide.md) | Branching, PRs, and naming conventions.          |

---

## :material-format-list-numbered: Recommended Reading Order

For new team members, we recommend the following onboarding path:

1.  **Master Development Guide** (You are here)
2.  **Git Strategy Guide** (Workflow foundation)
3.  **Local CI/CD Guide** (Quality foundation)
4.  **Domain-Specific Guide** (Backend, Frontend, or Server)
5.  **Testing Guides** (Quality assurance)

---

## :material-sign-direction: Which Guide to Use?

??? question "Quick Routing Model"
    - **Building APIs or DB logic?** :octicons-arrow-right-24: [Backend Guide](./backend-development-guide.md)
    - **Building UI screens or flows?** :octicons-arrow-right-24: [Frontend Guide](./frontend-development-guide.md)
    - **Changing Docker, Traefik, or MinIO?** :octicons-arrow-right-24: [Server Guide](./server-guide.md)
    - **Adding observability or logs?** :octicons-arrow-right-24: [Server Guide](./server-guide.md)
    - **Validating isolated logic?** :octicons-arrow-right-24: [Unit Testing Guide](./unit-testing-guide.md)
    - **Testing cross-service behavior?** :octicons-arrow-right-24: [Integration Testing Guide](./integration-testing-guide.md)
    - **Troubleshooting CI readiness?** :octicons-arrow-right-24: [Local CI/CD Guide](./local-cicd-guide.md)
    - **Creating branches or PRs?** :octicons-arrow-right-24: [Git Strategy Guide](./git-strategy-guide.md)

---

## :material-check-all: Shared Standards

These expectations apply to **all** developers, regardless of their role:

!!! tip "Standard Checklist"
    - [ ] Work in a dedicated feature branch.
    - [ ] PRs must target `dev`.
    - [ ] PRs must be clear and easy to review.
    - [ ] Link related issues (Closes #...).
    - [ ] CI must pass before merge.
    - [ ] Conflicts must be resolved before review.

---

## :material-flag-checkered: Definition of Done

??? success "Project-Level Readiness"
    - The correct guide workflow has been followed.
    - The feature is implemented and verified.
    - Required tests have been completed and passed.
    - Local `act` checks have been run.
    - The PR is complete, reviewed, and approved.
    - CI passes successfully on the remote.
