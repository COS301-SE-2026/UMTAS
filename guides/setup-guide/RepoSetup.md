# Repo Setup Guide

written by Marcel Stoltz
24 Apr 2026

## Purpose

This guide servers as a repo setup guide for the 2026 Vigil Capstone Team specifically for the UMTAS Project.

### Our approach to the ideal Developer Experience Monorepo

We will be using pnpm workspaces via root scripts such as TurboRepo.

The goal?
Frontend devs never need to worry about python dependencies and backend devs don't have to struggle with venv.
How do we approach this?
We split the architecture into two distinct sections:

- Docker Infrastructure:Databases,queues,Storage
- Native Application: Next, Nest

This setup ensures that devs have the benefit of containerized infrastructure to mimic the server whilst having the benefit of hot reload in the application themselves.

## The Motivation: One command for them all

### A: Bootstrap a New Dev

`pnpm run setup`

Steps:

1.  Checks Required tools
2.  Copies .env.example
3.  runs pnpm install
4.  Docker image for the solver section gets handled

DB seeding is handled inside the DB container without needing any manual scripts.

### B: Ready To Dev

We use a split strategy to give our devs the fastest possible dev setup.This requires two terminal tabs.

Everything is driven by a single docker compose file leveraging docker compose profiles which allows for multiple states.

- Terminal 1: Start the Infrastructure

      `pnpm run dev:infra`

  Docker Compose -> Postgres + Redis + MinIO + Python Solver

- Terminal 2: Start the actual code

      `pnpm run dev`

  Turborepo ->Next.js frontend + NestJS Backend

### C: Alternative & Deployment Modes

While the `B: Ready to Dev` is the best option for development, we do still retain the following docker profiles for testing + deployments

1.  Full docker dev -> Full Infrastructure + frontend + backend
    `pnpm run dev:docker`
    Useful to test everything before pushing to the server.
2.  Monitoring Mode -> Adding a monitoring flag to the previous command boots up
    - Grafana
    - Prometheus
    - Loki
3.  Production server mode -> Entire stack using docker-compose.prod.yml+ Traefik + WatchTower  
    `pnpm run start:prod`

### Testing and CI

1.  Unit & Integration: Powered by Vitest.
2.  E2E: Powered by Playwright.
3.  Pre-commit Hooks: Powered by Husky + Lint Staged.
4.  Local CI: We simulate the CI on github using ACT.
