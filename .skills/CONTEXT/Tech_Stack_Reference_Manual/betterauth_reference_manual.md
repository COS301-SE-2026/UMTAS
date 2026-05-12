# BetterAuth Reference Manual (v1.5.0)

## Section 0: Quick Start

Standard setup for a TypeScript-first authentication system.

```bash
# Install BetterAuth and the official database adapter
pnpm add better-auth @better-auth/db-adapter

# Initialize the auth instance
import { betterAuth } from "better-auth";
export const auth = betterAuth({
    database: adapter,
    emailAndPassword: { enabled: true }
});

# Usage in a route
const session = await auth.api.getSession({ headers });
```

Expected output: Active session object or `null` if unauthorized.

## Section 1: Key Language Terms & Features

- **Auth Instance** — The central object managing sessions, users, and plugins. | `const auth = betterAuth({...})` | ⚠️ Always export this as a singleton for your entire app.
- **Adapters** — Connectors that allow BetterAuth to communicate with various databases (Drizzle, Prisma, Kysely). | `database: prismaAdapter(db)` | ⚠️ Ensure your database schema matches the required BetterAuth tables.
- **Plugins** — Modules that extend core functionality (e.g., OAuth, Two-Factor, Magic Links). | `plugins: [organization(), twoFactor()]` | ⚠️ Some plugins require additional database columns or tables.
- **Session Management** — Built-in handling of cookie-based sessions with automatic rotation. | `auth.api.getSession()` | ⚠️ Use `headers()` in Next.js/Server Components to pass request context correctly.
- **Social Providers** — Pre-configured OAuth handlers for Google, GitHub, Apple, etc. | `google({ clientId, clientSecret })` | ⚠️ Redirect URIs must be correctly configured in the provider's dashboard.
- **Middleware** — Logic that runs before auth requests to handle CSRF and security headers. | `auth.handler(request)` | ⚠️ Crucial for protecting against cross-site request forgery.
- **Client SDK** — A lightweight, type-safe library for interacting with the auth server from the frontend. | `createAuthClient({ baseURL })` | ⚠️ Ensure the `baseURL` matches your API endpoint exactly.
- **Multi-Tenant (Orgs)** — First-class support for organizations, roles, and permissions. | `organization: { enabled: true }` | ⚠️ Roles are usually defined as strings; use TypeScript enums for safety.
- **Magic Links** — Passwordless authentication via time-limited email tokens. | `magicLink: { sendEmail: ... }` | ⚠️ Requires a configured email provider (Resend, SendGrid).
- **Hooks** — Lifecycle triggers that run before or after auth events (e.g., `afterSignUp`). | `hooks: { afterSignUp: async (user) => { ... } }` | ⚠️ Keep hooks lightweight to avoid blocking the authentication flow.

## Section 2: Key Commands & Workflows

- `pnpm add better-auth` — Installs the core library. | _Initial project setup._
- `auth.api.signUpEmail()` — Programmatically creates a new user. | _Custom registration flows._
- `auth.api.signInEmail()` — Authenticates a user with email and password. | _Standard login._
- `auth.api.signOut()` — Terminates the current session. | _User logout._
- `auth.api.listSessions()` — Retrieves all active sessions for a user. | _Security dashboards._
- `auth.api.revokeSession()` — Terminates a specific session by ID. | _Remote logout._
- `auth.api.updateUser()` — Updates user profile information. | _User settings pages._
- `auth.api.generateToken()` — Creates an API token for headless authentication. | _Mobile or CLI access._

## Section 3: Architecture & Component Relationships

```
Client (Browser/Mobile)
       ↓
BetterAuth Client SDK (Type-safe Fetch)
       ↓
API Routes (Next.js/Express/Hono)
       ↓
BetterAuth Server Instance (Logic & Security)
       ↓             ↓
Plugins (2FA, Org)  Adapters (SQL/NoSQL)
       ↓             ↓
Internal Logic      Database (Persistance)
```

**Key Flow:** The **Client SDK** sends signed requests to the **Server Instance**, which executes **Plugins**, validates data via the **Adapter**, and returns a secure **Session** cookie or token.

## Section 4: Documentation Links

- [Official Documentation](https://better-auth.com/docs) — _Comprehensive setup and API reference._
- [Plugin Directory](https://better-auth.com/plugins) — _Explore official and community plugins._
- [Database Adapters](https://better-auth.com/adapters) — _Configuration guides for various ORMs._
- [BetterAuth GitHub](https://github.com/better-auth/better-auth) — _Source code and issue tracker._
- [Discord Community](https://discord.gg/better-auth) — _Support and discussions._
