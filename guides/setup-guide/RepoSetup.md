# Repo Setup Guide

written by Marcel Stoltz
24 Apr 2026

## Purpose

This guide servers as a repo setup guide for the 2026 Vigil Capstone Team specifically for the UMTAS Project.

### Our approach to the ideal Developer Experience Monorepo

We will be using pnpm workspaces via root scripts such as makefile/TurboRepo

The goal? Frontend devs never need to worry about python dependencies and backend devs don't have to struggle with venv. Traefik is also being used so developers can develop against a specific websites rather than random ports.

## The motivation: One command for them all

### A: Bootstrap a New Dev

make setup ->

1.  Check Required tools
2.  Copies .env.example
3.  runs pnpm install
4.  Docker image for the solver section gets handled

DB seeding is handled inside the DB container without needing any manual scripts.

### B: Ready To Dev

Everything is driven by a single docker compose file leveraging docker compose profiles which allows for multiple states.

1. Very quick dev mode: `pnpm run dev:pglite`->
   PGlite container+Traefik+Redis+Python Solver
2. Heavy duty dev mode: `pnpm run dev:docker`->
   Traefik+Redis+Python Solver+MinIO+Full Postgres
3. Optional monitor: Adding `,monitoring` boots up Grafana, Prometheus and Loki
4. server mode: `COMPOSE_PROFILES=server`
   Boots up the entire stack just like the normal server would.

### Testing and CI

1.  Unit Tests view Vitest+TurboRepo
2.  E2E via Playwright
3.  Local CI via ACT

## Repo Initialisation Log

### Docker compose file setup considerations:

Always using .env files for any environment values
This uses the profiles mentioned above

###
