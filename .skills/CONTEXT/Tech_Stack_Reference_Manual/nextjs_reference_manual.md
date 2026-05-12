# Next.js Reference Manual (v16.2.4)

## Section 0: Quick Start

Immediate hands-on path for Next.js development with App Router and Turbopack.

```bash
# Scaffold new project with Turbopack and App Router
npx create-next-app@latest hello-next --turbo --typescript --tailwind --eslint
cd hello-next && npm run dev
```

Visit `http://localhost:3000` → See the default Next.js starter page.

---

## Section 1: Key Language Terms & Features

- **App Router** — Modern routing system built on React Server Components, supporting layouts and nesting | `app/dashboard/page.tsx` | ⚠️ Avoid using `pages/` directory unless maintaining legacy code.
- **Server Components (RSC)** — Components that render on the server by default to reduce client-side JS | `export default async function Page() {}` | ⚠️ You cannot use hooks like `useState` in Server Components; use `'use client'` if needed.
- **Client Components** — Components marked with `'use client'` that enable interactivity and React hooks | `'use client'; import { useState } from 'react';` | ⚠️ Keep the client boundary as low in the tree as possible to optimize performance.
- **Partial Prerendering (PPR)** — Combines static shell with dynamic "holes" in a single request | `<Suspense fallback={<Skeleton />}><DynamicComponent /></Suspense>` | ⚠️ Requires enabling `ppr: true` in `next.config.js`.
- **`use cache` Directive** — Explicitly caches the result of a function or component at the data layer | `'use cache'; async function getData() {}` | ⚠️ Replaces older patterns like `unstable_cache`.
- **Server Actions** — Asynchronous functions executed on the server, callable from the client for form submissions | `'use server'; export async function create() {}` | ⚠️ Always perform authorization checks inside the action.
- **Dynamic Routes** — Routes created using folder names in brackets to match variable segments | `app/blog/[slug]/page.tsx` | ⚠️ Use `generateStaticParams()` to pre-render paths for better performance.
- **Layouts** — Shared UI between multiple pages that preserves state on navigation | `export default function Layout({ children }) { ... }` | ⚠️ Layouts do not re-render on navigation between child pages.
- **Loading UI** — Built-in support for showing a loading state while a segment's content is fetching | `app/dashboard/loading.tsx` | ⚠️ Uses React Suspense under the hood to stream content.
- **Error Boundaries** — Gracefully handle runtime errors in specific route segments | `app/dashboard/error.tsx` | ⚠️ Error components must be Client Components.
- **Route Handlers** — Custom request handlers for a given route using Web Request/Response APIs | `export async function GET(request: Request) {}` | ⚠️ Replaces API Routes from the `pages/` directory.
- **Metadata API** — Configurable metadata (titles, descriptions, icons) for better SEO | `export const metadata = { title: 'Home' };` | ⚠️ Can be dynamic using `generateMetadata()`.

---

## Section 2: Key Commands & Workflows

- `npx create-next-app@latest` — Interactive CLI to scaffold a new project with modern defaults | _Starting a new project._
- `next dev --turbo` — Starts the development server with Turbopack for ultra-fast HMR | _Daily development and debugging._
- `next build` — Optimizes the application for production, creating a static and dynamic build | _Before deploying to production._
- `next start` — Starts the production server using the optimized build from `next build` | _Running in a production environment._
- `next lint` — Runs ESLint for all files in the project to ensure code quality | _Pre-commit checks or CI/CD pipelines._
- `next info` — Prints system information for debugging purposes | _Reporting bugs or checking environment setup._
- `next telemetry disable` — Opt-out of anonymous usage data collection | _Privacy-focused setups._

---

## Section 3: Architecture & Component Relationships

Next.js 16 leverages the App Router and React Server Components for a "Server-First" architecture.

```text
User Browser (Client)
      ↓
[ Turbopack / Edge Runtime ] (Routing & Rendering)
      ↓
[ Root Layout ] (Global State, HTML/Body)
      ↓
[ Middleware ] (Auth, Redirects, Headers)
      ↓
[ Page Segment ] (Server Component)
      ↙               ↘
[ Server Action ]   [ Client Component ] (Interactivity)
      ↓               ↓
[ Data Fetching ]   [ Browser APIs / Hooks ]
      ↓
[ Database / API ]
```

---

## Section 4: Documentation Links

- [Official Documentation](https://nextjs.org/docs) — _Primary source for App Router and RSC guides._
- [Deployment Guide (Vercel)](https://nextjs.org/docs/app/building-your-application/deploying) — _Best practices for hosting Next.js apps._
- [Next.js GitHub](https://github.com/vercel/next.js) — _Release notes, issue tracking, and discussions._
- [Turbopack Documentation](https://turbo.build/pack/docs) — _Deep dive into the Rust-based bundler._
- [Learn Next.js](https://nextjs.org/learn) — _Interactive course for beginners and advanced developers._
