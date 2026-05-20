# Technology Requirements

!!! abstract "Section Brief"
    This section documents the approved technology stack for UMTAS. All choices are binding for contributing sub-teams and were selected to satisfy the architectural quality attributes defined in the [Architectural Requirements](Architectural-Requirements.md).

---

<div class="grid cards" markdown>

-   __:material-web: Frontend & UI__

    ---

    ![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
    ![Shadcn/UI](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white) ![Radix UI](https://img.shields.io/badge/radix%20ui-161616?style=for-the-badge&logo=radix-ui&logoColor=white)

    - **Next.js** for SSR and the React component model; **Shadcn/UI + Radix UI** for headless WCAG-compliant primitives.
    - University theming applied through Tailwind CSS custom properties only - no per-university code changes.

-   __:material-server: Backend & Core__

    ---

    ![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white) ![DrizzleORM](https://img.shields.io/badge/drizzle-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
    ![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) ![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
    ![BullMQ](https://img.shields.io/badge/bullmq-FF4500?style=for-the-badge&logo=bullmq&logoColor=white) ![BetterAuth](https://img.shields.io/badge/betterauth-7C3AED?style=for-the-badge&logo=auth0&logoColor=white)

    - **NestJS + DrizzleORM** enforce the layered architecture with compile-time type-safe SQL.
    - **PostgreSQL + Redis** for persistent relational storage and combined session cache / BullMQ broker.
    - **BetterAuth** for OAuth 2.0, JWT, and session management; supports both third-party OAuth and password-based flows.

-   __:material-brain: Solver & AI__

    ---

    ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white) ![Google OR-Tools](https://img.shields.io/badge/google%20ortools-4285F4?style=for-the-badge&logo=google&logoColor=white)
    ![PyMuPDF](https://img.shields.io/badge/pymupdf-41454a?style=for-the-badge&logo=python&logoColor=white) ![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)

    - **FastAPI + OR-Tools (CP-SAT)** for the async solver service with OpenAPI docs and partial result support at timeout.
    - **PyMuPDF** for spatially-aware PDF extraction; bounding-box positioning is required to interpret timetable grid layouts.

-   __:material-layers: Infra & DevOps__

    ---

    ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white) ![Traefik](https://img.shields.io/badge/traefik-%2324A1C1.svg?style=for-the-badge&logo=traefik&logoColor=white)
    ![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white) ![Turborepo](https://img.shields.io/badge/Turborepo-000000?style=for-the-badge&logo=Turborepo&logoColor=white)
    ![pnpm](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220) ![MinIO](https://img.shields.io/badge/minio-C72C48?style=for-the-badge&logo=minio&logoColor=white)

    - **Docker + Traefik** for containerised deployment with SSL termination and blue-green switching.
    - **pnpm + Turborepo** for monorepo workspace management; **MinIO** for S3-compatible PDF object storage.

-   __:material-test-tube: Testing & QA__

    ---

    ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white) ![pytest](https://img.shields.io/badge/pytest-%230A9EDC.svg?style=for-the-badge&logo=pytest&logoColor=white)
    ![Playwright](https://img.shields.io/badge/-playwright-%232EAD33?style=for-the-badge&logo=playwright&logoColor=white) ![act](https://img.shields.io/badge/act-2088FF?style=for-the-badge&logo=github&logoColor=white)

    - **Jest + pytest** for unit/integration tests; **Playwright** for E2E in headless CI mode.

-   __:material-monitor-eye: Monitoring__

    ---

    ![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=Prometheus&logoColor=white) ![Grafana](https://img.shields.io/badge/grafana-%23F46800.svg?style=for-the-badge&logo=grafana&logoColor=white)
    ![Loki](https://img.shields.io/badge/loki-fec006?style=for-the-badge&logo=grafana&logoColor=black) ![PostHog](https://img.shields.io/badge/posthog-000000?style=for-the-badge&logo=posthog&logoColor=white)

    - **Prometheus + Grafana + Loki** for metrics, dashboards, and structured log aggregation.

</div>