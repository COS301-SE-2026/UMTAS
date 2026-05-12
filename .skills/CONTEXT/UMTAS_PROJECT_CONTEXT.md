# UMTAS Project Context — Single Reference

**Team:** VIGIL | **Project:** University Modular Timetable Automation System

---

## What UMTAS Solves

Automate university timetable generation. Input: PDF course data + constraints. Output: N conflict-free timetable options. Replace manual scheduling chaos with solver-driven automation.

**Success Targets:**

- ✓ 100% PDF parsing accuracy (UP timetable)
- ✓ 0% schedule overlap in generated options
- ✓ Zero UUID leaks (POPIA compliance)
- ✓ 20,000+ concurrent users (stress tested)

---

## System Design (Microservices)

```
Frontend (Next.js/React) → Traefik → {Core Service, Auth, PDF Adapter, API Adapter, Analytics}
Core (NestJS) ↔ PostgreSQL + Redis + CP-SAT Solver
Adapters (stateless) → Core API (no DB writes)
```

**Tech Stack at a Glance:**

| Layer              | Tech                                    | Purpose                                         |
| ------------------ | --------------------------------------- | ----------------------------------------------- |
| **Frontend**       | Next.js, React, shadcn/ui, Tailwind     | Dashboard, timetable selection, calendar export |
| **Backend**        | NestJS, TypeORM, PostgreSQL             | Core service, multi-tenant isolation, API       |
| **Solver**         | FastAPI, Google OR-Tools (CP-SAT)       | Constraint-based scheduling logic               |
| **Adapters**       | NestJS                                  | PDF parsing, external API integration           |
| **Auth**           | Better Auth, JWT, OAuth                 | User management, session handling               |
| **Cache/Queue**    | Redis, Bull                             | Solution cache, background job queue            |
| **Infrastructure** | Docker Compose, Traefik, GitHub Actions | Orchestration, routing, CI/CD                   |
| **Testing**        | Vitest, Playwright, PGLite              | Unit, integration, E2E tests                    |
| **Package Mgr**    | pnpm                                    | Monorepo workspaces                             |

---

## Definition of Done (Checklist)

Work ready for merge when **all 12 points pass:**

1. ✓ Feature branch created (isolated work)
2. ✓ Tests written (unit + integration)
3. ✓ Tests passing locally (Vitest for BE, Playwright for FE)
4. ✓ API docs updated (Swagger/OpenAPI if backend)
5. ✓ No regressions to success criteria
6. ✓ Code linted & formatted (Prettier, ESLint)
7. ✓ PR description complete & issues linked
8. ✓ PR metadata filled (reviewer, labels, project, milestone)
9. ✓ Local CI checks green (build, test, lint)
10. ✓ Code review approved
11. ✓ CI/CD pipeline passed (GitHub Actions)
12. ✓ Ready to merge into `dev` (no conflicts)

**Validation Criteria (Hard Gates):**

- Vitest: All unit tests pass
- Playwright: E2E scenarios pass
- OpenAPI: Contract changes documented
- Success Criteria: PDF accuracy, overlap check, UUID isolation, user simulation all verified

---

## Development Flow (TDD-First)

```
1. Create feature branch from dev
2. Write failing test (unit or integration)
3. Implement feature (RED → GREEN → REFACTOR)
4. Update Swagger docs (if API change)
5. Run tests locally (pnpm test)
6. Push code & open PR
7. Await CI + code review
8. Merge when DoD checklist complete
```

---

## Tech Stack Reference (Compressed)

**Frontend:** Next.js (SSR/SSG), React (components), shadcn/ui (design system), Tailwind (styling), Playwright (E2E)

**Backend:** NestJS (modular REST API), TypeORM (data layer), PostgreSQL (prod DB), PGLite (test DB), Vitest (unit tests)

**Solver:** FastAPI (lightweight Python service), Google OR-Tools CP-SAT (constraint solver), request/response contract-driven

**Adapters:** NestJS (PDF parsing, API integration), stateless (no DB writes), event-driven to core

**Auth:** Better Auth (email/password, OAuth), JWT (token auth), Redis (session store)

**Infrastructure:** Docker Compose (local + dev), Traefik (edge router, SSL), GitHub Actions (CI/CD), Bull (async jobs)

**Monorepo:** pnpm workspaces (shared types, packages), `pnpm --filter` for targeted builds/tests

**Quality:** Vitest (UT), Playwright (E2E), PGLite (DB mocking), GitHub Actions (automated checks)

---

## Quick Commands

```bash
# Setup
pnpm install
docker-compose up

# Develop
pnpm dev                    # Start local dev
pnpm test                   # Run all tests
pnpm build && pnpm lint     # Build + check

# Git workflow
git checkout -b feat/feature-name
# ... make changes, pass tests ...
git push origin feat/feature-name
# → Open PR into dev
```

---

## Key Documents

| Doc                                               | Contains                                                    |
| ------------------------------------------------- | ----------------------------------------------------------- |
| `/UMTAS/DESIGN.md`                                | Architecture, ER diagram, service details, API contracts    |
| `/UMTAS/AgileProjectBreakdown.md`                 | 12 epics, story points, acceptance criteria                 |
| `/UMTAS/Timetable.md`                             | Domain model: events, venues, academic calendar, recurrence |
| `/RESOURCES/Guides/master-development-guide.md`   | Guide map, reading order, TDD philosophy                    |
| `/RESOURCES/Guides/backend-development-guide.md`  | NestJS, TypeORM, Swagger workflow                           |
| `/RESOURCES/Guides/frontend-development-guide.md` | Next.js, shadcn/ui, responsive design                       |
| `/RESOURCES/Guides/local-cicd-guide.md`           | Pre-push checks: tests, lint, build                         |
| `/RESOURCES/Guides/git-strategy-guide.md`         | Branch strategy, PR structure, merge workflow               |

---

## Three Core Use Cases

**1. PDF Import:** Admin uploads timetable PDF → system parses modules/events/venues → stored in core DB

**2. Timetable Generation:** Admin specifies constraints → solver generates N conflict-free options → stored in solution cache

**3. Student Selection:** Student picks lectures/practicals → system validates no conflicts → exports to Google Calendar
