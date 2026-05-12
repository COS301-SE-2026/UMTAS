# BetterAuth Implementation Spec — UMTAS

> **Scope:** Full implementation guide for BetterAuth v1.x with the Admin plugin (three custom roles), Redis secondary storage for sessions, Google OAuth, and email/password with self-hosted SMTP password reset.
>
> **Stack context:** NestJS backend · DrizzleORM · PostgreSQL · Redis · Next.js frontend

---

## Table of Contents

1. [Package Installation](#1-package-installation)
2. [SMTP Package Recommendation](#2-smtp-package-recommendation)
3. [Environment Variables](#3-environment-variables)
4. [Redis Secondary Storage Adapter](#4-redis-secondary-storage-adapter)
5. [Drizzle Schema](#5-drizzle-schema)
6. [Permissions & Access Control](#6-permissions--access-control)
7. [auth.ts — Full Configuration](#7-authts--full-configuration)
8. [NestJS Integration](#8-nestjs-integration)
9. [Google OAuth Setup](#9-google-oauth-setup)
10. [Email Service (SMTP)](#10-email-service-smtp)
11. [Database Hooks](#11-database-hooks)
12. [Next.js Client Setup](#12-nextjs-client-setup)
13. [Schema Generation & Migration](#13-schema-generation--migration)
14. [Key Behaviours & Gotchas](#14-key-behaviours--gotchas)

---

## 1. Package Installation

Run from the **NestJS app** workspace root (or monorepo root with `-F` filter):

```bash
# BetterAuth core + Drizzle adapter
pnpm add better-auth

# Redis client (ioredis preferred over node-redis for BetterAuth secondary storage)
pnpm add ioredis
pnpm add -D @types/ioredis

# NestJS mailer (wraps nodemailer) + Handlebars templates
pnpm add @nestjs-modules/mailer nodemailer handlebars
pnpm add -D @types/nodemailer @types/handlebars

# Google OAuth is built into BetterAuth — no extra package needed
```

> **Why ioredis over node-redis?** ioredis has a synchronous-style API (`await redis.get(key)` returns `string | null` directly) which matches BetterAuth's `secondaryStorage` interface exactly. node-redis returns `string | null | undefined` and requires more ceremony.

---

## 2. SMTP Package Recommendation

### Recommended Stack: `@nestjs-modules/mailer` + `nodemailer` + `handlebars`

| Package                  | Role                                                                       |
| ------------------------ | -------------------------------------------------------------------------- |
| `nodemailer`             | Core SMTP transport — sends email over any SMTP server                     |
| `@nestjs-modules/mailer` | NestJS-native module wrapping nodemailer; injects `MailerService` anywhere |
| `handlebars`             | Template engine for HTML email bodies (`.hbs` files)                       |

**Why this combination?**

- `@nestjs-modules/mailer` gives you `MailerService.sendMail({ template, context })` which handles template compilation and rendering automatically.
- Handlebars is the most widely supported template adapter in `@nestjs-modules/mailer` and requires zero extra config beyond pointing at your templates directory.
- nodemailer is the Node.js SMTP standard — works with any SMTP server (Postfix, Postal, Mailpit for dev, Gmail relay, etc.).

### Self-hosted SMTP Server Recommendations

| Environment           | Tool                                    | Notes                                                                                        |
| --------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Local dev**         | [Mailpit](https://mailpit.axllent.org/) | Catches all outgoing mail, web UI at port 8025, Docker image `axllent/mailpit`. Zero config. |
| **Production**        | [Postal](https://postal.atech.media/)   | Full MTA with web dashboard, bounce handling, DKIM/SPF tooling. Runs as a Docker stack.      |
| **Simple production** | Postfix + `nodemailer`                  | Classic, battle-tested. Harder to configure correctly (DKIM, PTR records). Postal is easier. |

**Mailpit dev compose snippet:**

```yaml
# docker-compose.dev.yml
mailpit:
  image: axllent/mailpit
  ports:
    - "1025:1025" # SMTP
    - "8025:8025" # Web UI
  environment:
    MP_MAX_MESSAGES: 500
```

Set `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `SMTP_SECURE=false` in `.env.local` and all reset emails appear in the Mailpit UI.

---

## 3. Environment Variables

Create `apps/api/.env` (and `.env.example` for the repo). Never commit real secrets.

```bash
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://umtas:password@localhost:5432/umtas_dev"

# ── Redis ─────────────────────────────────────────────────────────────────────
REDIS_URL="redis://:password@localhost:6379"

# ── BetterAuth ────────────────────────────────────────────────────────────────
BETTER_AUTH_SECRET="generate-with: openssl rand -base64 32"
BETTER_AUTH_URL="http://localhost:3001"           # Base URL of the NestJS API
NEXT_PUBLIC_APP_URL="http://localhost:3000"       # Base URL of the Next.js app

# ── Google OAuth ──────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# ── SMTP ──────────────────────────────────────────────────────────────────────
SMTP_HOST="localhost"
SMTP_PORT=1025
SMTP_SECURE=false                                 # true for port 465 (SSL); false for 587 (STARTTLS) or dev
SMTP_USER=""                                      # blank for Mailpit / Postfix local relay
SMTP_PASS=""
SMTP_FROM="UMTAS <noreply@umtas.co.za>"
```

> **`BETTER_AUTH_SECRET`** must be a cryptographically random string of at least 32 characters. Generate it once per environment and treat it like a database password — rotating it invalidates all active sessions.

---

## 4. Redis Secondary Storage Adapter

BetterAuth's `secondaryStorage` option accepts any object implementing this interface:

```ts
interface SecondaryStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}
```

Create `libs/auth/src/redis-storage.ts` (or `src/auth/redis-storage.ts` in the NestJS app):

```ts
// redis-storage.ts
import Redis from "ioredis";

/**
 * BetterAuth-compatible secondary storage adapter backed by Redis.
 *
 * BetterAuth uses this for fast session lookups — the session record is
 * still persisted to PostgreSQL (primary source of truth) but Redis
 * is checked first on every request, dramatically reducing DB load.
 *
 * Key format used by BetterAuth: "session:<token>"
 * TTL is driven by the session's expiresAt field (passed in seconds).
 */
export function createRedisSecondaryStorage(redis: Redis) {
  return {
    async get(key: string): Promise<string | null> {
      return redis.get(key);
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      if (ttl) {
        await redis.setex(key, ttl, value);
      } else {
        await redis.set(key, value);
      }
    },

    async delete(key: string): Promise<void> {
      await redis.del(key);
    },
  };
}
```

Instantiate the Redis client once and pass it to both BetterAuth and BullMQ so they share the same connection pool:

```ts
// redis.ts  (shared singleton)
import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on("error", (err) => console.error("[Redis] connection error:", err));
```

---

## 5. Drizzle Schema

### 5.1 Auth Schema (Better Auth–owned tables)

Better Auth generates the SQL for these tables via `npx @better-auth/cli generate`. However, you **must** define matching Drizzle table objects so your own queries (e.g., joining `student_details` → `users`) are type-safe.

Create `src/db/schema/auth.schema.ts`:

```ts
import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

// ─── users ───────────────────────────────────────────────────────────────────
// Owned by Better Auth + Admin plugin.
// UMTAS adds: timezone (additionalField)
// Admin plugin adds: role, banned, ban_reason, ban_expires
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"), // nullable — OAuth avatar
  role: text("role").notNull().default("student"), // student | uni_admin | sys_admin
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
  timezone: text("timezone").notNull().default("Africa/Johannesburg"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── sessions ────────────────────────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  impersonatedBy: uuid("impersonated_by"), // nullable FK → users.id
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── accounts ────────────────────────────────────────────────────────────────
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(), // e.g. "google", "credential"
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"), // bcrypt hash for credential provider
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── verifications ───────────────────────────────────────────────────────────
export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(), // email or phone
  value: text("value").notNull(), // hashed OTP / token
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
```

### 5.2 UMTAS Extension Tables

Create `src/db/schema/umtas-users.schema.ts`:

```ts
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { users } from "./auth.schema";

// 1:1 extension for students
export const studentDetails = pgTable("student_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  studentNumber: text("student_number").notNull().unique(),
});

// 1:1 extension for university admins
export const universityAdminDetails = pgTable("university_admin_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  department: text("department"),
});

// 1:1 extension for system admins
export const systemAdminDetails = pgTable("system_admin_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  accessLevel: text("access_level"),
});
```

### 5.3 Schema Index

Export everything from a central `src/db/schema/index.ts`:

```ts
export * from "./auth.schema";
export * from "./umtas-users.schema";
// export * from "./modules.schema";   ← add remaining tables as you build them
```

---

## 6. Permissions & Access Control

Create `src/auth/permissions.ts`:

```ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

// ─── Statement definitions ───────────────────────────────────────────────────
// These are the resource types and their allowed actions across the system.
const statement = {
  ...defaultStatements, // user, session (from Better Auth core)
  timetable: ["create", "view", "delete", "export"],
  module: ["create", "update", "delete", "view"],
  venue: ["create", "update", "delete", "view"],
  analytics: ["view"],
  parseJob: ["create", "view"],
  university: ["create", "update", "view"],
} as const;

export const ac = createAccessControl(statement);

// ─── Role definitions ─────────────────────────────────────────────────────────

/**
 * student — can manage their own timetables only.
 * All other resources are blocked at the service layer.
 */
export const student = ac.newRole({
  timetable: ["create", "view", "delete", "export"],
});

/**
 * uni_admin — full user management within their university,
 * plus venue/module/parse job administration.
 * Cannot manage universities themselves (sys_admin only).
 */
export const uniAdmin = ac.newRole({
  ...adminAc.statements, // grants: user.create/update/delete/ban, session.revoke
  module: ["create", "update", "delete", "view"],
  venue: ["create", "update", "delete", "view"],
  timetable: ["view"], // can view but not create student timetables
  analytics: ["view"],
  parseJob: ["create", "view"],
});

/**
 * sys_admin — full platform access including university provisioning.
 */
export const sysAdmin = ac.newRole({
  ...adminAc.statements,
  timetable: ["create", "view", "delete", "export"],
  module: ["create", "update", "delete", "view"],
  venue: ["create", "update", "delete", "view"],
  analytics: ["view"],
  parseJob: ["create", "view"],
  university: ["create", "update", "view"],
});
```

---

## 7. auth.ts — Full Configuration

Create `src/auth/auth.ts`. This is the **single auth instance** shared across the entire NestJS app.

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

import { db } from "../db/db"; // your Drizzle db instance
import { redis } from "../redis"; // shared ioredis singleton
import { createRedisSecondaryStorage } from "./redis-storage";
import { ac, student, uniAdmin, sysAdmin } from "./permissions";
import * as schema from "../db/schema";

export const auth = betterAuth({
  // ── Core ────────────────────────────────────────────────────────────────────
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,

  // ── Database (primary storage — PostgreSQL via Drizzle) ──────────────────
  database: drizzleAdapter(db, {
    provider: "pg",
    schema, // pass the full schema so the adapter can find all tables
  }),

  // ── Session secondary storage (Redis) ────────────────────────────────────
  // Redis is checked first on every request; PostgreSQL remains the source of truth.
  secondaryStorage: createRedisSecondaryStorage(redis),

  // ── Advanced ─────────────────────────────────────────────────────────────
  advanced: {
    database: {
      generateId: false, // PostgreSQL gen_random_uuid() handles all IDs
    },
    crossSubDomainCookies: {
      enabled: false, // set true if frontend and API are on different subdomains in prod
    },
  },

  // ── User model ────────────────────────────────────────────────────────────
  user: {
    modelName: "users",
    fields: {
      name: "display_name",
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      timezone: {
        type: "string",
        required: false,
        defaultValue: "Africa/Johannesburg",
        // fieldAttributes: { notNull: true } — enforced at DB level
      },
    },
  },

  // ── Session model ─────────────────────────────────────────────────────────
  session: {
    modelName: "sessions",
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh session cookie if > 1 day old
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  // ── Account model ─────────────────────────────────────────────────────────
  account: {
    modelName: "accounts",
    fields: {
      userId: "user_id",
      accountId: "account_id",
      providerId: "provider_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  // ── Verification model ────────────────────────────────────────────────────
  verification: {
    modelName: "verifications",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  // ── Email + Password ──────────────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // user must verify email before signing in
    minPasswordLength: 8,
    maxPasswordLength: 128,

    /**
     * Called when a user requests a password reset link.
     * `url` is the full signed reset URL — send it as-is.
     */
    sendResetPassword: async ({ user, url }) => {
      // Import is deferred to avoid circular dependency with auth.ts
      const { mailerService } = await import("../mail/mailer.service");
      await mailerService.sendMail({
        to: user.email,
        subject: "Reset your UMTAS password",
        template: "reset-password", // maps to src/mail/templates/reset-password.hbs
        context: {
          name: user.name,
          resetUrl: url,
          expiresInHours: 1,
        },
      });
    },
  },

  // ── Email Verification ────────────────────────────────────────────────────
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { mailerService } = await import("../mail/mailer.service");
      await mailerService.sendMail({
        to: user.email,
        subject: "Verify your UMTAS account",
        template: "verify-email",
        context: {
          name: user.name,
          verifyUrl: url,
        },
      });
    },
  },

  // ── Social Providers ──────────────────────────────────────────────────────
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // redirectURI is auto-derived from baseURL: {baseURL}/api/auth/callback/google
    },
  },

  // ── Trusted Origins ───────────────────────────────────────────────────────
  // The Next.js frontend must be listed here for CORS and CSRF to work correctly.
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],

  // ── Plugins ───────────────────────────────────────────────────────────────
  plugins: [
    admin({
      defaultRole: "student",
      adminRoles: ["uni_admin", "sys_admin"],
      ac,
      roles: { student, uniAdmin, sysAdmin },
      schema: {
        user: {
          fields: {
            role: "role",
            banned: "banned",
            banReason: "ban_reason",
            banExpires: "ban_expires",
          },
        },
        session: {
          fields: {
            impersonatedBy: "impersonated_by",
          },
        },
      },
    }),
  ],

  // ── Lifecycle Hooks ───────────────────────────────────────────────────────
  // See Section 11 for the full hook implementation.
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Automatically provision a student_details row for new students.
          // See Section 11 for the full implementation.
          if (user.role === "student") {
            const { provisionStudentDetails } =
              await import("./hooks/provision-student");
            await provisionStudentDetails(user);
          }
        },
      },
    },
  },
});

// Export the inferred type — use this in NestJS guards and decorators
export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

---

## 8. NestJS Integration

### 8.1 Auth Module

Create `src/auth/auth.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";

@Module({
  controllers: [AuthController],
  exports: [], // auth instance is imported directly — no provider needed
})
export class AuthModule {}
```

### 8.2 Auth Controller (catch-all handler)

Better Auth handles all its own routes (`/api/auth/**`). NestJS needs a single wildcard controller that forwards every request to the auth instance.

Create `src/auth/auth.controller.ts`:

```ts
import { All, Controller, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { auth } from "./auth";
import { toWebRequest, toExpressResponse } from "./auth-adapter"; // see below

@Controller("api/auth")
export class AuthController {
  /**
   * Forward every request under /api/auth/* to Better Auth's handler.
   * Better Auth expects a Web API Request; we adapt Express req/res.
   */
  @All("*")
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    const webRequest = toWebRequest(req);
    const webResponse = await auth.handler(webRequest);
    await toExpressResponse(webResponse, res);
  }
}
```

Create `src/auth/auth-adapter.ts` to bridge Express ↔ Web API:

```ts
import { Request, Response } from "express";

/**
 * Convert an Express Request to a Web API Request.
 * Better Auth (and most modern auth libs) works with the Fetch API's
 * Request/Response — not Node's IncomingMessage.
 */
export function toWebRequest(req: Request): Request {
  const protocol = req.secure ? "https" : "http";
  const url = `${protocol}://${req.headers.host}${req.url}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value)
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  return new globalThis.Request(url, {
    method: req.method,
    headers,
    body: hasBody ? JSON.stringify(req.body) : undefined,
  });
}

/**
 * Write a Web API Response back into an Express Response.
 */
export async function toExpressResponse(
  webRes: globalThis.Response,
  res: Response,
): Promise<void> {
  res.status(webRes.status);
  webRes.headers.forEach((value, key) => res.setHeader(key, value));
  const body = await webRes.text();
  res.send(body);
}
```

### 8.3 Auth Guard

Create `src/auth/auth.guard.ts` — protects any route that needs an authenticated session:

```ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { auth } from "./auth";
import { toWebRequest } from "./auth-adapter";

// Decorator to mark routes as public (no auth required)
import { SetMetadata } from "@nestjs/common";
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const webRequest = toWebRequest(req);
    const session = await auth.api.getSession({ headers: webRequest.headers });

    if (!session) throw new UnauthorizedException("No active session");

    // Attach session to request so controllers can access it
    (req as any).session = session;
    return true;
  }
}
```

**Register globally in `AppModule`:**

```ts
// app.module.ts
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth/auth.guard";

@Module({
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
```

### 8.4 Session Decorator

Create `src/auth/session.decorator.ts` to cleanly inject the session into controller methods:

```ts
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Session } from "./auth";

export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Session => {
    const req = ctx.switchToHttp().getRequest();
    return req.session;
  },
);
```

**Usage in a controller:**

```ts
@Get("me")
getMe(@CurrentSession() session: Session) {
  return session.user;
}
```

### 8.5 Role Guard

Create `src/auth/roles.guard.ts` for role-based endpoint protection:

```ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SetMetadata } from "@nestjs/common";

export type UmtasRole = "student" | "uni_admin" | "sys_admin";
export const ROLES_KEY = "roles";
export const Roles = (...roles: UmtasRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UmtasRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const req = context.switchToHttp().getRequest();
    const role: UmtasRole = req.session?.user?.role;

    if (!requiredRoles.includes(role)) {
      throw new ForbiddenException(
        `Role '${role}' is not permitted. Required: ${requiredRoles.join(" | ")}`,
      );
    }
    return true;
  }
}
```

**Usage:**

```ts
@Get("analytics")
@Roles("uni_admin", "sys_admin")
getAnalytics() { ... }
```

---

## 9. Google OAuth Setup

### 9.1 Google Cloud Console Steps

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth 2.0 Client ID**.
3. Application type: **Web application**.
4. Set the **Authorised redirect URI** to:
   ```
   http://localhost:3001/api/auth/callback/google   ← development
   https://api.umtas.co.za/api/auth/callback/google ← production
   ```
   The path `/api/auth/callback/google` is derived by Better Auth from `baseURL + /api/auth/callback/google`. Do not change this.
5. Copy the **Client ID** and **Client Secret** into your `.env`.

### 9.2 OAuth Flow Summary

```
User clicks "Sign in with Google"
  → Frontend calls: authClient.signIn.social({ provider: "google" })
  → Better Auth redirects to Google's OAuth consent screen
  → Google redirects back to: /api/auth/callback/google
  → Better Auth:
      1. Exchanges code for tokens
      2. Fetches Google profile (name, email, picture)
      3. Checks if a user with that email exists:
         - YES → links the Google account, signs in
         - NO  → creates user (role = "student" by default), creates session
      4. Redirects to: BETTER_AUTH_URL (your app's post-login page)
```

### 9.3 Account Linking Behaviour

By default, if a user who signed up with email/password later signs in with Google **using the same email address**, Better Auth will **link the Google account** to their existing user record rather than creating a duplicate. This is the correct behaviour — no extra config needed.

---

## 10. Email Service (SMTP)

### 10.1 Mailer Module Setup

Create `src/mail/mail.module.ts`:

```ts
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { Module } from "@nestjs/common";
import { join } from "path";

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined, // skip auth for local relay / Mailpit
      },
      defaults: {
        from: process.env.SMTP_FROM,
      },
      template: {
        dir: join(__dirname, "templates"), // src/mail/templates/
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      },
    }),
  ],
  exports: [MailerModule],
})
export class MailModule {}
```

### 10.2 Email Templates

Create `src/mail/templates/reset-password.hbs`:

```handlebars
<html>
  <head>
    <meta charset="utf-8" />
    <title>Reset your password</title>
  </head>
  <body
    style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;"
  >
    <h2>Password Reset</h2>
    <p>Hi {{name}},</p>
    <p>We received a request to reset your UMTAS password. Click the button
      below to set a new password:</p>
    <p style="margin: 32px 0;">
      <a
        href="{{resetUrl}}"
        style="background:#1e40af;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;"
      >
        Reset Password
      </a>
    </p>
    <p style="color:#6b7280;font-size:0.875rem;">
      This link expires in
      {{expiresInHours}}
      hour(s). If you did not request a password reset, you can safely ignore
      this email.
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />
    <p style="color:#9ca3af;font-size:0.75rem;">UMTAS — University Modular
      Timetable Analytics System</p>
  </body>
</html>
```

Create `src/mail/templates/verify-email.hbs`:

```handlebars
<html>
  <head>
    <meta charset="utf-8" />
    <title>Verify your email</title>
  </head>
  <body
    style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;"
  >
    <h2>Verify your email address</h2>
    <p>Hi {{name}},</p>
    <p>Thanks for registering with UMTAS. Please verify your email address to
      activate your account:</p>
    <p style="margin: 32px 0;">
      <a
        href="{{verifyUrl}}"
        style="background:#1e40af;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;"
      >
        Verify Email
      </a>
    </p>
    <p style="color:#6b7280;font-size:0.875rem;">
      If you did not create a UMTAS account, you can safely ignore this email.
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />
    <p style="color:#9ca3af;font-size:0.75rem;">UMTAS — University Modular
      Timetable Analytics System</p>
  </body>
</html>
```

---

## 11. Database Hooks

The `student_details` row must be created atomically when a new student user is created. This is enforced via Better Auth's `databaseHooks.user.create.after` hook (already wired in `auth.ts` above).

Create `src/auth/hooks/provision-student.ts`:

```ts
import { db } from "../../db/db";
import { studentDetails } from "../../db/schema";

/**
 * Provision a student_details row for a newly created student user.
 *
 * Called from the databaseHooks.user.create.after hook in auth.ts.
 * The student_number is not known at registration time, so it is
 * left empty. The student must complete their profile on first login.
 *
 * ⚠️  If student_number is required (NOT NULL), either:
 *   a) Collect it during registration via a custom sign-up form
 *      and pass it as additionalFields, then use it here.
 *   b) Make the column nullable and enforce completion via a
 *      "profile incomplete" UI state.
 */
export async function provisionStudentDetails(user: { id: string }) {
  await db.insert(studentDetails).values({
    userId: user.id,
    studentNumber: "", // placeholder — update when student completes profile
  });
}
```

> **Important:** `student_number` in the ERD is a `UK` (unique key) and `text` (not nullable). You have two options:
>
> - **Recommended for Demo 1:** Make `studentNumber` nullable in the schema temporarily; enforce completion on first login via a redirect.
> - **Cleaner long-term:** Add `studentNumber` as an `additionalField` on the `user` model in Better Auth so it is collected at registration, then write the confirmed value here.

---

## 12. Next.js Client Setup

Create `lib/auth-client.ts` in the Next.js app:

```ts
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!, // e.g. http://localhost:3001
  plugins: [
    adminClient(), // enables client-side admin API methods
  ],
});

// Re-export typed hooks for convenience
export const { signIn, signOut, signUp, useSession, getSession } = authClient;
```

**Usage examples:**

```ts
// Email + Password sign-up
await authClient.signUp.email({
  email: "student@example.com",
  password: "securepassword",
  name: "Jane Student",
});

// Email + Password sign-in
await authClient.signIn.email({
  email: "student@example.com",
  password: "securepassword",
});

// Google OAuth sign-in
await authClient.signIn.social({ provider: "google" });

// Password reset (triggers the sendResetPassword hook)
await authClient.requestPasswordReset({ email: "student@example.com" });

// Session hook in a React component
const { data: session, isPending } = authClient.useSession();
```

---

## 13. Schema Generation & Migration

### Step 1 — Generate Better Auth tables

```bash
# From the NestJS app root
npx @better-auth/cli generate --config src/auth/auth.ts --output src/db/migrations/better-auth
```

This creates SQL migration files for all Better Auth–owned tables. Review the output before applying.

### Step 2 — Generate UMTAS extension tables

```bash
# Drizzle Kit picks up your schema from drizzle.config.ts
pnpm drizzle-kit generate
```

### Step 3 — Apply migrations

```bash
pnpm drizzle-kit migrate      # applies all pending migrations to the DB
```

### Step 4 — Verify with Drizzle Studio

```bash
pnpm drizzle-kit studio       # opens the DB browser at localhost:4444
```

### drizzle.config.ts

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

---

## 14. Key Behaviours & Gotchas

### Session Strategy

| Layer          | Role                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| **PostgreSQL** | Source of truth — all sessions persisted here                              |
| **Redis**      | Fast lookup cache — checked first on every request; keyed by session token |

When a session is created, Better Auth writes it to both PostgreSQL and Redis (with TTL matching the session's `expiresAt`). On every subsequent request, Redis is checked first. If the key is missing (expired or evicted), Better Auth falls back to PostgreSQL. This means session lookups are typically sub-millisecond.

### Role Assignment

- New users always get `role = "student"` (set by `admin({ defaultRole: "student" })`).
- To promote a user to `uni_admin` or `sys_admin`, a `sys_admin` must call:

```ts
await authClient.admin.setRole({ userId: "...", role: "uni_admin" });
// or server-side:
await auth.api.setRole({ body: { userId: "...", role: "uni_admin" }, headers });
```

### Google OAuth — Role for New Users

Users who sign up via Google OAuth will also receive `role = "student"` by default (driven by `defaultRole`). If you need to auto-assign `uni_admin` based on email domain matching, add logic inside `databaseHooks.user.create.after`:

```ts
after: async (user) => {
  const domain = user.email.split("@")[1];
  // Example: auto-promote @cs.up.ac.za addresses to uni_admin
  if (domain === "cs.up.ac.za") {
    await auth.api.setRole({
      body: { userId: user.id, role: "uni_admin" },
      headers: {},
    });
  }
};
```

### CSRF & Cookies

Better Auth uses **SameSite=Lax** cookies by default. This works correctly when the frontend and API share the same top-level domain (e.g., `umtas.co.za` and `api.umtas.co.za`). If your dev setup has the frontend on `:3000` and API on `:3001`, cookies will still be sent because both are on `localhost`.

If you deploy the frontend to a completely different domain (not a subdomain), set `crossSubDomainCookies.enabled: true` in `advanced` and configure `cookieDomain`.

### Email Verification

With `requireEmailVerification: true`, unverified users **cannot sign in**. Better Auth blocks them and returns a `403` with `"Please verify your email"`. Make sure your sign-in UI handles this response and prompts the user to check their inbox.

### Password Reset Token Expiry

Better Auth's default password reset token expiry is **1 hour**. This is not configurable without a custom plugin in v1.x. Set user expectations in the email template accordingly.

---

_Spec written for UMTAS Demo 1 implementation — 2026-05-11_
