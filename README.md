<div align="center">

<br>

<img src="docs/assets/images/VigilLogoOwl-animated.svg" width="300" alt="Team Vigil">

<br>

<img src="docs/assets/images/umtas-wordmark.svg" width="500" alt="UMTAS">

<br>

### University Management & Timetabling Automation System

**A Strategic Partnership between [Tyto Insights](https://tyto.africa/), [DNS Business](https://dns.africa/c/), and Team Vigil**

_Built by: Wilmar Smit, Michael Tomlinson, Johan Coetzer, Marcel Stoltz, & Aidan Dawson_

<br>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=18&duration=3500&pause=1000&color=3B82F6&center=true&vCenter=true&width=580&lines=Automated+timetabling%2C+powered+by+OR-Tools;PDF+schedule+ingestion+%E2%80%94+zero+manual+entry;University-agnostic+by+design;Up+to+20%2C000+concurrent+students)](https://cos301-se-2026.github.io/UMTAS/)

<br>

<!-- Status & CI — tracking dev branch where workflows live -->

[![Docs](https://img.shields.io/github/actions/workflow/status/COS301-SE-2026/UMTAS/deploy-docs.yml?branch=dev&style=for-the-badge&logo=readthedocs&logoColor=white&label=Docs)](https://cos301-se-2026.github.io/UMTAS/)
[![Issues](https://img.shields.io/github/issues/COS301-SE-2026/UMTAS?style=for-the-badge&logo=github&logoColor=white&labelColor=1e293b&color=1d4ed8)](https://github.com/COS301-SE-2026/UMTAS/issues)
[![Last Commit](https://img.shields.io/github/last-commit/COS301-SE-2026/UMTAS/dev?style=for-the-badge&logo=git&logoColor=white&labelColor=1e293b&color=1d4ed8)](https://github.com/COS301-SE-2026/UMTAS/commits/dev)
[![CI](https://img.shields.io/github/actions/workflow/status/COS301-SE-2026/UMTAS/ci.yml?branch=dev&style=for-the-badge&logo=githubactions&logoColor=white&label=CI)](https://github.com/COS301-SE-2026/UMTAS/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/COS301-SE-2026/UMTAS/dev?style=for-the-badge&logo=codecov&logoColor=white&label=Coverage)](https://codecov.io/gh/COS301-SE-2026/UMTAS)
[![Quality Gate](https://img.shields.io/badge/Quality_Gate-pending-3f3f46?style=for-the-badge&logo=sonarcloud&logoColor=white)](https://sonarcloud.io/dashboard?id=COS301-SE-2026_UMTAS)
[![Uptime](https://img.shields.io/uptimerobot/ratio/m803102764-591e06f9f3d70c1a4b161f6f?style=for-the-badge&logo=uptimerobot&logoColor=white&label=Uptime+30d&color=1d4ed8)](https://dashboard.uptimerobot.com/monitors/803102764)

<!-- Platform & Tooling -->

[![pnpm](https://img.shields.io/badge/pnpm-monorepo-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-16a34a?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-workspace-000000?style=for-the-badge&logo=turborepo&logoColor=white)](https://turborepo.com/)
[![Docker Pulls](https://img.shields.io/docker/pulls/vigilcs/umtas?style=for-the-badge&logo=docker&logoColor=white&label=Docker+Pulls&color=0db7ed)](https://hub.docker.com/u/vigilcs)
[![Release](https://img.shields.io/badge/Release-pre--release-3f3f46?style=for-the-badge&logo=github&logoColor=white)](https://github.com/COS301-SE-2026/UMTAS/releases)

<br>

<img src="docs/assets/images/sponsors-marquee.svg" width="900" alt="Tyto Insights · DNS Business · University of Pretoria">

<br>

<!-- Partners & Affiliation -->

[![Tyto Insights](https://img.shields.io/badge/Tyto_Insights-tyto.africa-0f172a?style=for-the-badge)](https://tyto.africa/)
[![DNS Business](https://img.shields.io/badge/DNS_Business-dns.africa-003366?style=for-the-badge)](https://dns.africa/c/)
[![University of Pretoria](https://img.shields.io/badge/University_of_Pretoria-COS_301-003B5C?style=for-the-badge)](https://www.up.ac.za/)

<br>

<!-- Documentation Links -->

[![Functional Requirements](<https://img.shields.io/badge/Functional_Requirements_(SRS)-View_Document-14532d?style=for-the-badge&logo=googledocs&logoColor=white>)](https://cos301-se-2026.github.io/UMTAS/requirements/Introduction/)
[![Full Documentation](https://img.shields.io/badge/Full_Documentation-Visit_Site-14532d?style=for-the-badge&logo=readthedocs&logoColor=white)](https://cos301-se-2026.github.io/UMTAS/)
[![Project Board](https://img.shields.io/badge/Project_Board-View_on_GitHub-14532d?style=for-the-badge&logo=github&logoColor=white)](https://github.com/orgs/COS301-SE-2026/projects)
[![Issue Tracker](https://img.shields.io/badge/Issue_Tracker-GitHub_Issues-14532d?style=for-the-badge&logo=github&logoColor=white)](https://github.com/COS301-SE-2026/UMTAS/issues)

</div>

---

<div align="center">

## <img src="https://api.iconify.design/mdi/information-outline.svg?color=%233B82F6" width="24" height="24" valign="middle"> Project Overview

</div>

UMTAS automates the full university timetabling lifecycle — from ingesting raw PDF schedules and extracting hard and soft scheduling constraints, through to delivering conflict-free, optimised timetables to up to **20,000 concurrent students**.

The system is **university-agnostic by design**: a Core-and-Adapter architecture cleanly separates the constraint-solving engine from institution-specific data formats. Onboarding a new university requires only a thin adapter — the core solver remains untouched.

<br>

<table width="100%">
  <tr>
    <td width="50%" valign="top">
      <h4><img src="https://api.iconify.design/mdi/file-pdf-box.svg?color=%233B82F6" width="18" height="18" valign="middle"> The Problem</h4>
      <p>Traditional timetabling is a multi-week manual process. Administrators juggle hundreds of constraints — venue capacities, lecturer availability, student group conflicts — in spreadsheets. A single room change cascades into hours of rescheduling.</p>
    </td>
    <td width="50%" valign="top">
      <h4><img src="https://api.iconify.design/mdi/lightbulb-outline.svg?color=%233B82F6" width="18" height="18" valign="middle"> The Solution</h4>
      <p>UMTAS ingests the university's existing PDF calendar, parses all constraints automatically, and invokes a CP-SAT constraint-programming solver to generate an optimal schedule in seconds — not weeks.</p>
    </td>
  </tr>
</table>

---

<div align="center">

## <img src="https://api.iconify.design/mdi/star-outline.svg?color=%233B82F6" width="24" height="24" valign="middle"> Features

</div>

<table width="100%">
  <tr>
    <td width="33%" valign="top" align="center">
      <h3><img src="https://api.iconify.design/mdi/file-document-outline.svg?color=%233B82F6" width="20" height="20" valign="middle"> PDF Ingestion</h3>
      <p>PyMuPDF-powered extraction parses structured and semi-structured university PDF calendars into machine-readable constraint sets — zero manual data entry.</p>
    </td>
    <td width="33%" valign="top" align="center">
      <h3><img src="https://api.iconify.design/mdi/calculator-variant-outline.svg?color=%233B82F6" width="20" height="20" valign="middle"> Constraint Solving</h3>
      <p>Google OR-Tools CP-SAT solver handles hard constraints (no double-booking, room capacity) and soft constraints (lecturer preferences, day-spread) with optimal solutions.</p>
    </td>
    <td width="33%" valign="top" align="center">
      <h3><img src="https://api.iconify.design/mdi/alert-circle-outline.svg?color=%233B82F6" width="20" height="20" valign="middle"> Conflict Detection</h3>
      <p>BullMQ-backed job queue processes re-solve requests asynchronously. Administrators receive conflict alerts and revised schedules without blocking the UI.</p>
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top" align="center">
      <h3><img src="https://api.iconify.design/mdi/domain.svg?color=%233B82F6" width="20" height="20" valign="middle"> University-Agnostic</h3>
      <p>A Core-and-Adapter architecture decouples the solver from any single institution's data format. New universities onboard by implementing a thin adapter — the core is never touched.</p>
    </td>
    <td width="33%" valign="top" align="center">
      <h3><img src="https://api.iconify.design/mdi/chart-bar.svg?color=%233B82F6" width="20" height="20" valign="middle"> Observability</h3>
      <p>Prometheus metrics, Grafana dashboards, and Loki log aggregation are provisioned out-of-the-box. PostHog captures product analytics for continuous UX improvement.</p>
    </td>
    <td width="33%" valign="top" align="center">
      <h3><img src="https://api.iconify.design/mdi/shield-lock-outline.svg?color=%233B82F6" width="20" height="20" valign="middle"> Secure by Default</h3>
      <p>OAuth 2.0 authentication, role-based access control, Redis-backed session management, and MinIO for isolated document storage. All traffic routed through Traefik with TLS termination.</p>
    </td>
  </tr>
</table>

---

<div align="center">

## <img src="https://api.iconify.design/mdi/layers-outline.svg?color=%233B82F6" width="24" height="24" valign="middle"> Technology Stack

</div>

**Frontend & UI**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Shadcn/UI](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161616?style=for-the-badge&logo=radix-ui&logoColor=white)

**Backend & Core**

![NestJS](https://img.shields.io/badge/NestJS-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![DrizzleORM](https://img.shields.io/badge/DrizzleORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-FF4500?style=for-the-badge&logo=bullmq&logoColor=white)
![OAuth 2.0](https://img.shields.io/badge/OAuth_2.0-eb5424?style=for-the-badge&logo=auth0&logoColor=white)

**Solver & AI**

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Google OR-Tools](https://img.shields.io/badge/Google_OR--Tools-4285F4?style=for-the-badge&logo=google&logoColor=white)
![PyMuPDF](https://img.shields.io/badge/PyMuPDF-41454a?style=for-the-badge&logo=python&logoColor=white)

**Infrastructure & DevOps**

![Docker](https://img.shields.io/badge/Docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Traefik](https://img.shields.io/badge/Traefik-%2324A1C1.svg?style=for-the-badge&logo=traefik&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-000000?style=for-the-badge&logo=Turborepo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)
![MinIO](https://img.shields.io/badge/MinIO-C72C48?style=for-the-badge&logo=minio&logoColor=white)

**Testing & QA**

![Jest](https://img.shields.io/badge/Jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![pytest](https://img.shields.io/badge/pytest-%230A9EDC.svg?style=for-the-badge&logo=pytest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-%232EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![act](https://img.shields.io/badge/act-2088FF?style=for-the-badge&logo=github&logoColor=white)

**Monitoring**

![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=Prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-%23F46800.svg?style=for-the-badge&logo=grafana&logoColor=white)
![Loki](https://img.shields.io/badge/Loki-fec006?style=for-the-badge&logo=grafana&logoColor=black)
![PostHog](https://img.shields.io/badge/PostHog-000000?style=for-the-badge&logo=posthog&logoColor=white)

---

<div align="center">

## <img src="https://api.iconify.design/mdi/file-tree-outline.svg?color=%233B82F6" width="24" height="24" valign="middle"> Repository Structure

</div>

This is a **pnpm monorepo** managed by Turborepo. All applications, shared packages, and infrastructure live in one repository to enable atomic commits and shared tooling across every workstream.

```mermaid
mindmap
  root((UMTAS))
    apps
      web
        Next.js Frontend
        React · Tailwind · Shadcn
      api
        NestJS Backend
        DrizzleORM · BullMQ
    packages
      database
        Schema & Migrations
      types
        Shared TypeScript
      config
        ESLint · TSConfig
    solver
      FastAPI Service
      OR-Tools · PyMuPDF
    infra
      Docker Compose
      Traefik · Grafana
      Prometheus · Loki
```

---

<div align="center">

## <img src="https://api.iconify.design/mdi/source-branch.svg?color=%233B82F6" width="24" height="24" valign="middle"> Branching Strategy

</div>

All development follows a **TDD Git Flow**. Feature work is done in short-lived branches and merged into `dev` via pull request. `main` only receives merges from `dev` at release points. Every pull request requires CI to pass and at least one peer review.

<div align="center">

[![Git Strategy Guide](https://img.shields.io/badge/Git_Strategy_Guide-Commit_Conventions_&_PR_Template-3f3f46?style=for-the-badge&logo=readthedocs&logoColor=white)](https://cos301-se-2026.github.io/UMTAS/developer-guides/git-strategy-guide/)

</div>

```mermaid
gitGraph LR:
   commit id: "v0.1.0"
   branch dev
   checkout dev
   commit id: "baseline"
   branch feat/pdf-parser
   checkout feat/pdf-parser
   commit id: "failing tests"
   commit id: "implementation"
   checkout dev
   merge feat/pdf-parser id: "PR #12"
   branch fix/auth-token
   checkout fix/auth-token
   commit id: "fix applied"
   checkout dev
   merge fix/auth-token id: "PR #15"
   checkout main
   merge dev id: "v0.2.0"
```

---

<div align="center">

## <img src="https://api.iconify.design/mdi/account-group-outline.svg?color=%233B82F6" width="24" height="24" valign="middle"> Team

</div>

Team Vigil comprises five University of Pretoria Computer Science students with complementary profiles across full-stack development, system architecture, DevOps, data engineering, and machine learning.

<br>

<table>
  <tr>
    <td width="140" align="center" valign="top">
      <img src="docs/assets/images/team/framed/Wilmar_smit_PFP_circle.svg" width="120" alt="Wilmar Smit">
    </td>
    <td valign="top">
      <strong>Wilmar Smit</strong> &nbsp;—&nbsp; Team Lead &amp; Integration Lead<br><br>
      <details>
        <summary>About</summary>
        <br>
        Third-year CS student and primary coordinator between frontend and backend workstreams. Ensures architectural alignment across the full stack and manages the integration of diverse components into a cohesive system. Professional experience at Tyto Insights informs his approach to building scalable, production-ready systems.
      </details>
      <br>
      <a href="https://www.linkedin.com/in/wilmar-smit-3b11842a3/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
      <a href="https://github.com/wilmar-smit"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="140" align="center" valign="top">
      <img src="docs/assets/images/team/framed/Michael_Tomlinson_PFP_circle.svg" width="120" alt="Michael Tomlinson">
    </td>
    <td valign="top">
      <strong>Michael Tomlinson</strong> &nbsp;—&nbsp; Lead Developer &amp; System Architect<br><br>
      <details>
        <summary>About</summary>
        <br>
        Third-year CS student and Software Developer Intern at Tyto Insights, with prior experience migrating legacy systems at DCS Engineering. Serves as System Architect, responsible for the Core-and-Adapter pattern that keeps UMTAS university-agnostic. His Tuks PDF Calendar project provides the foundational domain expertise for the platform's PDF parsing challenges.
      </details>
      <br>
      <a href="https://www.linkedin.com/in/michaeltomlinson"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
      <a href="https://github.com/michaeltomlinsontuks"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="140" align="center" valign="top">
      <img src="docs/assets/images/team/framed/Johan_Coetzer_PFP_circle.svg" width="120" alt="Johan Coetzer">
    </td>
    <td valign="top">
      <strong>Johan Coetzer</strong> &nbsp;—&nbsp; Frontend Lead &amp; Full-Stack Developer<br><br>
      <details>
        <summary>About</summary>
        <br>
        Third-year CS student and Software Developer Intern at Tyto Insights (Skunkworks). As Frontend Lead, manages the Next.js ecosystem with a focus on responsive component architecture and intuitive UX. Bridges complex system logic with the interface to ensure that the heavy data requirements of UMTAS are delivered through a high-performance, accessible dashboard.
      </details>
      <br>
      <a href="https://www.linkedin.com/in/johan-coetzer-01bb26401"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
      <a href="https://github.com/jcoet-gh"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="140" align="center" valign="top">
      <img src="docs/assets/images/team/framed/Marcel_Stoltz_PFP_circle.svg" width="120" alt="Marcel Stoltz">
    </td>
    <td valign="top">
      <strong>Marcel Stoltz</strong> &nbsp;—&nbsp; DevOps Lead &amp; Backend Specialist<br><br>
      <details>
        <summary>About</summary>
        <br>
        Third-year CS student and Software Developer Intern at Tyto Insights (Skunkworks). Leads the DevOps and infrastructure workstream, specialising in Docker environments and automated deployment pipelines. Ensures the NestJS backend and PostgreSQL services are optimised for high-performance delivery. Previous work at Gendac provides backend versatility across the stack.
      </details>
      <br>
      <a href="https://www.linkedin.com/in/marcel-stoltz/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
      <a href="https://github.com/marcelstoltz00"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="140" align="center" valign="top">
      <img src="docs/assets/images/team/framed/Aidan_Dawson_PFP_circle.svg" width="120" alt="Aidan Dawson">
    </td>
    <td valign="top">
      <strong>Aidan Dawson</strong> &nbsp;—&nbsp; Backend Developer &amp; Integration<br><br>
      <details>
        <summary>About</summary>
        <br>
        Third-year CS student focused on backend development and contract-driven integration. Responsible for core backend functionality, strict adherence to API contracts across all system components, data integrity and PDF extraction accuracy, and automated testing to maintain reliable interactions between the frontend, backend, and external adapters.
      </details>
      <br>
      <a href="https://www.linkedin.com/in/aidan-dawson-3514692ba"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
      <a href="https://github.com/sdcreek240"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
    </td>
  </tr>
</table>

---

<div align="center">

## <img src="https://api.iconify.design/mdi/console-line.svg?color=%233B82F6" width="24" height="24" valign="middle"> Getting Started

</div>

<div align="center">

[![Repo Setup Guide](https://img.shields.io/badge/Repo_Setup_Guide-Full_Environment_Walkthrough-3f3f46?style=for-the-badge&logo=readthedocs&logoColor=white)](https://cos301-se-2026.github.io/UMTAS/developer-guides/Repo-Setup-Guide/)

</div>

<details open>
<summary><strong>Bootstrap — First Time Setup</strong></summary>
<br>

```bash
pnpm run setup
```

Verifies tool versions, copies `.env.example` to `.env`, installs all workspace dependencies, and prepares the Python solver container.

</details>

<details>
<summary><strong>Local Development (Recommended)</strong></summary>
<br>

```bash
# Terminal 1 — infrastructure (Postgres, Redis, MinIO, Solver)
pnpm run dev:infra

# Terminal 2 — application (Next.js + NestJS via Turborepo)
pnpm run dev
```

Runs infrastructure in Docker and the application natively for the fastest hot-reload performance.

</details>

<details>
<summary><strong>Full Docker Stack</strong></summary>
<br>

```bash
pnpm run dev:docker
```

Boots the complete stack — frontend, backend, and all infrastructure — in containers. Use this to verify network flows and environment variables before a merge.

</details>

<details>
<summary><strong>With Monitoring (PLG Stack)</strong></summary>
<br>

```bash
pnpm run dev:monitor
```

Adds Grafana, Prometheus, and Loki to the stack for local observability testing.

</details>

---

<div align="center">

## <img src="https://api.iconify.design/mdi/bookshelf.svg?color=%233B82F6" width="24" height="24" valign="middle"> Documentation

</div>

<div align="center">

[![cos301-se-2026.github.io/UMTAS](https://img.shields.io/badge/cos301--se--2026.github.io%2FUMTAS-Visit_Docs-18181b?style=for-the-badge&logo=readthedocs&logoColor=white)](https://cos301-se-2026.github.io/UMTAS/)

</div>

<br>

<details>
<summary><strong>Requirements & Architecture</strong> &nbsp;—&nbsp; 10 documents</summary>
<br>
<div align="center">

[![Introduction](https://img.shields.io/badge/Introduction-14532d?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/requirements/Introduction/)
[![Domain Model](https://img.shields.io/badge/Domain_Model-14532d?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/requirements/Domain-Model/)
[![User Stories](https://img.shields.io/badge/User_Stories-14532d?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/requirements/User-Stories/)
[![Use Cases](https://img.shields.io/badge/Use_Cases-14532d?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/requirements/Use-Cases/)
[![Functional Requirements](https://img.shields.io/badge/Functional_Requirements-14532d?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/requirements/Functional-Requirements/)
[![Quality Requirements](https://img.shields.io/badge/Quality_Requirements-14532d?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/requirements/Quality-Requirements/)
[![Architectural Requirements](https://img.shields.io/badge/Architectural_Requirements-14532d?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/requirements/Architectural-Requirements/)
[![Technology Requirements](https://img.shields.io/badge/Technology_Requirements-14532d?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/requirements/Technology-Requirements/)
[![Traceability Matrix](https://img.shields.io/badge/Traceability_Matrix-14532d?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/requirements/Traceability-Matrix/)
[![API Service Contracts](https://img.shields.io/badge/API_Service_Contracts-14532d?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/requirements/API-Service-Contracts/)

</div>
</details>

<details>
<summary><strong>Design & Diagrams</strong> &nbsp;—&nbsp; 3 documents</summary>
<br>
<div align="center">

[![Brand Style Guide](https://img.shields.io/badge/Brand_Style_Guide-78350f?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/design/Brand-Style/)
[![Wireframes](https://img.shields.io/badge/Wireframes-78350f?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/design/Wireframes/)
[![Diagrams Repository](https://img.shields.io/badge/Diagrams_Repository-78350f?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/diagrams/README/)

</div>
</details>

<details>
<summary><strong>Developer Guides</strong> &nbsp;—&nbsp; 10 guides</summary>
<br>
<div align="center">

[![Repo Setup](https://img.shields.io/badge/Repo_Setup-3f3f46?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/developer-guides/Repo-Setup-Guide/)
[![Git Strategy](https://img.shields.io/badge/Git_Strategy-3f3f46?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/developer-guides/git-strategy-guide/)
[![Master Dev Guide](https://img.shields.io/badge/Master_Dev_Guide-3f3f46?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/developer-guides/master-development-guide/)
[![Backend Development](https://img.shields.io/badge/Backend_Development-3f3f46?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/developer-guides/backend-development-guide/)
[![Frontend Development](https://img.shields.io/badge/Frontend_Development-3f3f46?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/developer-guides/frontend-development-guide/)
[![Server Setup](https://img.shields.io/badge/Server_Setup-3f3f46?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/developer-guides/Server-Setup-Guide/)
[![Server Operations](https://img.shields.io/badge/Server_Operations-3f3f46?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/developer-guides/server-guide/)
[![Unit Testing](https://img.shields.io/badge/Unit_Testing-3f3f46?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/developer-guides/unit-testing-guide/)
[![Integration Testing](https://img.shields.io/badge/Integration_Testing-3f3f46?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/developer-guides/integration-testing-guide/)
[![Local CI/CD](https://img.shields.io/badge/Local_CI%2FCD-3f3f46?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/developer-guides/local-cicd-guide/)

</div>
</details>

<details>
<summary><strong>Reference</strong> &nbsp;—&nbsp; 2 documents</summary>
<br>
<div align="center">

[![API Reference](https://img.shields.io/badge/API_Reference-52525b?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/api/API-Reference/)
[![Team Profiles](https://img.shields.io/badge/Team_Profiles-52525b?style=for-the-badge)](https://cos301-se-2026.github.io/UMTAS/management/Team-Profiles/)

</div>
</details>

---

<div align="center">
<sub>Built by Team Vigil in partnership with Tyto Insights &amp; DNS Business &nbsp;·&nbsp; University of Pretoria &nbsp;·&nbsp; COS 301 Capstone 2026</sub>
</div>
