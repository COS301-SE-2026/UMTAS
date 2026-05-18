# UMTAS — Developer Setup

## Prerequisites

| Tool             | Version | Install                            |
| ---------------- | ------- | ---------------------------------- |
| Node.js          | ≥ 20    | https://nodejs.org or `nvm`        |
| pnpm             | ≥ 10    | `npm i -g pnpm`                    |
| Docker + Compose | ≥ 24    | https://docs.docker.com/get-docker |
| Git              | any     | https://git-scm.com                |

---

## Quick Start

```bash
# 1. Clone
git clone <repo-url>
cd UMTAS

# 2. Bootstrap — copies .env files, installs deps
pnpm bootstrap

# 3. Configure env files (see section below)
#    Edit .env, apps/backend/.env.local, apps/frontend/.env.local

# 4. Reset — kills ports, starts infra, generates migrations
pnpm reset

# 5. Start dev servers
pnpm dev
```

---

## Env Files

Three env files control the stack:

| File                       | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `.env`                     | Docker Compose vars + shared backend config |
| `apps/backend/.env.local`  | NestJS / Drizzle / auth config              |
| `apps/frontend/.env.local` | Next.js config                              |

`pnpm setup` copies each `.env.example` → `.env.local` automatically. See the example files for documentation on each variable.

### Minimum changes after bootstrap

1. **`apps/backend/.env.local`** — set `BETTER_AUTH_SECRET` to a random 32+ character string
2. Leave everything else as-is for local PGLITE mode (no postgres needed)

### Google OAuth (optional)

Add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` to both `.env` and `apps/backend/.env.local` to enable Google sign-in.

---

## Database Modes

### PGLITE (default)

- `DB_MODE=PGLITE` in `apps/backend/.env.local`
- No postgres container needed — DB runs in-process
- Migrations run automatically on app startup
- Data resets on app restart (ephemeral)

### DATABASE

- `DB_MODE=DATABASE` in `apps/backend/.env.local`
- Requires docker postgres container (started by `pnpm reset` or `pnpm dev:infra`)
- Set `DATABASE_URL` to match `DB_USER` / `DB_PASSWORD` / `DB_NAME` from `.env`
- Run `pnpm db:migrate` to apply migrations manually

---

## Scripts Reference

| Script             | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `pnpm bootstrap`   | Copy .env files + install deps (first-time only)                       |
| `pnpm reset`       | Kill ports → docker down → install → start infra → generate migrations |
| `pnpm reset:hard`  | Same as reset but also wipes docker volumes (drops all data)           |
| `pnpm dev`         | Start frontend + backend dev servers                                   |
| `pnpm dev:infra`   | Start postgres, redis, minio, mailhog in background                    |
| `pnpm db:generate` | Generate Drizzle migration files from schema                           |
| `pnpm db:migrate`  | Apply pending migrations (DATABASE mode only)                          |
| `pnpm db:studio`   | Open Drizzle Studio                                                    |
| `pnpm build`       | Build all apps                                                         |
| `pnpm test`        | Run all tests                                                          |
| `pnpm lint`        | Lint all apps                                                          |

---

## Services

| Service       | URL                   | Notes                       |
| ------------- | --------------------- | --------------------------- |
| Frontend      | http://localhost:3001 | Next.js                     |
| Backend       | http://localhost:3000 | NestJS + Swagger at `/api`  |
| Mailhog       | http://localhost:8025 | Catches all outgoing emails |
| Minio Console | http://localhost:9001 | Object storage UI           |
| Postgres      | localhost:5432        | DATABASE mode only          |

---

## Troubleshooting

**Port already in use** — run `pnpm reset` to kill all dev ports and restart cleanly.

**Migrations out of sync** — run `pnpm db:generate` to regenerate, or `pnpm reset` for a full refresh.

**Docker containers failing** — run `pnpm reset:hard` to wipe volumes and start fresh.

**PGLITE migration errors on startup** — delete the PGlite data directory (check `DB_PGLITE_DIR` env if set) and restart.

**Auth errors** — ensure `BETTER_AUTH_SECRET` is ≥ 32 characters in `apps/backend/.env.local`.
