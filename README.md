# UMTAS Platform

**UMTAS** (University-agnostic Core-and-Adapter platform) is designed to fix scheduling and venue allocation at universities. It provides preference-driven student schedules, an anonymised real-time analytics dashboard, and a reusable simulation service.

## Tech Stack

- **Frontend**: Next.js (React + TypeScript) + Tailwind CSS
- **Backend Core**: Nest.js + DrizzleORM + PostgreSQL
- **Microservices**: FastAPI + pdfplumber + Google OR-Tools
- **Infrastructure**: Docker + pnpm monorepo + Traefik

For more detailed project planning and architecture design, please refer to the `UMTAS Initial Planning Doc.md`.

## Development

- `pnpm run dev` starts the local Turbo workspace.
- `pnpm run dev:pglite` starts the lightweight Docker-backed profile.
- `pnpm run dev:docker` starts the Postgres Docker-backed profile.

For local auth dev, `DB_MODE=PGLITE` is the quickest setup. The backend also needs `REDIS_URL` in production and SMTP on port `1025` for Mailpit-style mail capture.
