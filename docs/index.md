<div align="center" markdown="1">

<div style="display: flex; justify-content: center; align-items: center; gap: 60px; margin-top: 40px; margin-bottom: 30px;">
  <img src="assets/images/VigilOWL.png" width="120">
  <img src="assets/images/Tytobanner.svg" width="280">
</div>

# UMTAS

### University Management & Timetabling Automation System

**A Strategic Partnership between [Tyto Insights](https://tyto.africa/) and Team Vigil**  
_Built by: Wilmar Smit, Michael Tomlinson, Johan Coetzer, Marcel Stoltz, & Aidan Dawson_

---

</div>

<br>

## :material-rocket-launch: Quick Start

Get up and running with the UMTAS platform in minutes.

<div class="grid cards" markdown>

- :material-presentation-play:{ .lg .middle } **Demo 1 Deliverables**

  ***

  Access the complete Requirements Specification (SRS), Design Specs, and Marking Guide.

  [:octicons-arrow-right-24: Marking Guide](management/Marking-Guide.md)

- :material-library-shelves:{ .lg .middle } **Documentation & Guides**

  ***

  Browse our collection of developer guides, setup manuals, and contribution workflows.

  [:octicons-arrow-right-24: Browse Guides](developer-guides/Repo-Setup-Guide.md)

- :material-rocket-launch:{ .lg .middle } **Getting Started**

  ***

  Setup your local environment, install dependencies, and run your first build.

  [:octicons-arrow-right-24: Setup Guide](developer-guides/Repo-Setup-Guide.md)

- :material-book-open-page-variant:{ .lg .middle } **API Reference**

  ***

  Explore the interactive Swagger documentation for the Core and Adapter services.

  [:octicons-arrow-right-24: View APIs](api/API-Reference.md)

- :material-sitemap:{ .lg .middle } **Architecture**

  ***

  Deep dive into the Core-and-Adapter pattern and system diagrams.

  [:octicons-arrow-right-24: System Diagrams](diagrams/README.md)

- :material-account-group:{ .lg .middle } **Team Vigil**

  ***

  Meet the team behind UMTAS and view our management documentation.

  [:octicons-arrow-right-24: Team Profiles](management/Team-Profiles.md)

</div>

---

## :material-tools: Technology Stack

The platform is built using a modern, high-performance stack designed for scale and reliability.

<div class="grid cards" markdown>

- **:material-web: Frontend & UI**

  ***

  ![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Shadcn/UI](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white) ![Radix UI](https://img.shields.io/badge/radix%20ui-161616?style=for-the-badge&logo=radix-ui&logoColor=white)

- **:material-server: Backend & Core**

  ***

  ![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white) ![DrizzleORM](https://img.shields.io/badge/drizzle-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
  ![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) ![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
  ![BullMQ](https://img.shields.io/badge/bullmq-FF4500?style=for-the-badge&logo=bullmq&logoColor=white) ![OAuth 2.0](https://img.shields.io/badge/oauth%202.0-eb5424?style=for-the-badge&logo=auth0&logoColor=white)

- **:material-brain: Solver & AI**

  ***

  ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white) ![Google OR-Tools](https://img.shields.io/badge/google%20ortools-4285F4?style=for-the-badge&logo=google&logoColor=white)
  ![PyMuPDF](https://img.shields.io/badge/pymupdf-41454a?style=for-the-badge&logo=python&logoColor=white) ![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)

- **:material-layers: Infra & DevOps**

  ***

  ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white) ![Traefik](https://img.shields.io/badge/traefik-%2324A1C1.svg?style=for-the-badge&logo=traefik&logoColor=white)
  ![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white) ![Turborepo](https://img.shields.io/badge/Turborepo-000000?style=for-the-badge&logo=Turborepo&logoColor=white)
  ![pnpm](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220) ![MinIO](https://img.shields.io/badge/minio-C72C48?style=for-the-badge&logo=minio&logoColor=white)

- **:material-test-tube: Testing & QA**

  ***

  ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white) ![pytest](https://img.shields.io/badge/pytest-%230A9EDC.svg?style=for-the-badge&logo=pytest&logoColor=white)
  ![Playwright](https://img.shields.io/badge/-playwright-%232EAD33?style=for-the-badge&logo=playwright&logoColor=white) ![act](https://img.shields.io/badge/act-2088FF?style=for-the-badge&logo=github&logoColor=white)

- **:material-monitor-eye: Monitoring**

  ***

  ![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=Prometheus&logoColor=white) ![Grafana](https://img.shields.io/badge/grafana-%23F46800.svg?style=for-the-badge&logo=grafana&logoColor=white)
  ![Loki](https://img.shields.io/badge/loki-fec006?style=for-the-badge&logo=grafana&logoColor=black) ![PostHog](https://img.shields.io/badge/posthog-000000?style=for-the-badge&logo=posthog&logoColor=white)

</div>

---

## :material-information-outline: Project Overview

The **University Management & Timetabling Automation System (UMTAS)** is a high-performance, university-agnostic platform designed to automate the ingestion, parsing, and optimisation of university timetables.

Built in partnership with **Tyto Insights**, UMTAS leverages a Core-and-Adapter architecture to ensure seamless integration with diverse university data sources while providing students with a modern, real-time scheduling interface.
