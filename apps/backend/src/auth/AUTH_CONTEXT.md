## Goal

Update the auth/session layer so that:

- `SessionData.user.role` is reduced to only:

  - `user`

  - `sys_admin`

- Add `uniId` to `SessionData` to store the currently selected university.

- Add `uniRole` to `SessionData` as the university-scoped role for that selected university.

- Keep endpoint decorators working with university roles like `student`, `uni_admin`, `uni_admin_pending`, `lecturer`, and `lecturer_pending`.

The idea is:

1. Users log in with a global app role of `user` or `sys_admin`.

2. Users select a university to work with.

3. The selected `uniId` is saved into session state.

4. A lookup occurs in the `UniversityRole` table for that `userId` + `uniId`.

5. If no row exists, the user is treated as `student` for that university.

6. If the user applies for a role, `uniRole` becomes one of the pending values.

---

## Current implementation summary

Relevant files:

- `apps/backend/src/auth/session.decorator.ts`

- `apps/backend/src/auth/auth.guard.ts`

- `apps/backend/src/auth/roles.guard.ts`

- `apps/backend/src/auth/roles.ts`

- `apps/backend/src/auth/auth.ts`

- `apps/backend/src/auth/auth.controller.ts`

Current session shape:

- `session.user.role` is used by `RolesGuard`.

- `@CurrentSession()` returns `req.session`.

- `@Roles('student')` currently checks `session.user.role`.

- `AuthGuard` fetches session from BetterAuth and attaches it to the request.

Current role type in `apps/backend/src/auth/roles.ts`:

- `student`

- `lecturer`

- `uni_admin`

- `sys_admin`

---

## Desired new session shape

Update `apps/backend/src/auth/session.decorator.ts` to a shape like:

```ts
export interface SessionData {
  user: {
    id: string;

    name: string;

    email: string;

    emailVerified: boolean;

    image?: string;

    role: 'user' | 'sys_admin';

    banned: boolean;

    banReason?: string;

    banExpires?: string;

    createdAt: string;

    updatedAt: string;
  };

  session: {
    id: string;

    token: string;

    userId: string;

    expiresAt: string;

    ipAddress?: string;

    userAgent?: string;

    impersonatedBy?: string;

    createdAt: string;

    updatedAt: string;
  };

  uniId?: string;

  uniRole?:
    | 'student'
    | 'uni_admin'
    | 'uni_admin_pending'
    | 'lecturer'
    | 'lecturer_pending';
}
```

Notes:

- `uniId` should be a string when a university is currently selected.

- `uniRole` is the active university-scoped role for that `uniId`.

- `uniRole` should not replace the global session role; it is a separate, scoped value.

---

## What to change in the auth directory

### 1. Normalize the auth session before attaching to request

Update `apps/backend/src/auth/auth.guard.ts` so that the session returned from BetterAuth is normalized to the new `SessionData` shape.

Changes:

- Keep `session.user.role` as `sys_admin` when the user is a system admin.

- Map any other authenticated user role to `user`.

- Add optional `uniId` and `uniRole` into the session object if they are available.

Why:

- This preserves the global auth identity while moving university-specific permissions into `uniRole`.

- This also avoids leaking app-level university roles into the global session role.

### 2. Add `uniId` and `uniRole` support in `SessionData`

Update `apps/backend/src/auth/session.decorator.ts` and any tests that assert session properties.

Important test updates:

- `apps/backend/src/auth/session.decorator.spec.ts`

- any controller tests that create mock `SessionData`

### 3. Change role type definitions

Update `apps/backend/src/auth/roles.ts` to separate global app roles from university roles.

Suggested types:

```ts
export type AppRole = 'user' | 'sys_admin';

export type UniRole =
  | 'student'
  | 'uni_admin'
  | 'uni_admin_pending'
  | 'lecturer'
  | 'lecturer_pending';

export type AuthorizedRole = AppRole | UniRole;
```

Then adjust any helpers and guards accordingly.

### 4. Update `RolesGuard` logic

`apps/backend/src/auth/roles.guard.ts` currently checks only `session.user.role`.

New logic should be:

- If `session.user.role === 'sys_admin'`, allow.

- If the `@Roles(...)` metadata includes `user`, allow any authenticated session.

- Otherwise, if `session.uniRole` exists, allow when `session.uniRole` matches one of the required roles.

- If `session.uniRole` is missing but `session.uniId` exists, perform a `UniversityRole` lookup and populate `session.uniRole` before validating.

- If `session.uniId` is missing and the route requires a university role, reject with `UnauthorizedException` or `ForbiddenException`.

This preserves existing decorator usage such as:

- `@Roles('student')`

- `@Roles('uni_admin', 'sys_admin')`

- `@Roles('student', 'uni_admin', 'sys_admin')`

### 5. Add explicit university selection flow

The key state change is when the user selects a university.

Recommended implementation:

- Add a backend endpoint such as `POST /api/auth/select-university` or `PATCH /api/auth/session`.

- Input: `{ uniId: string }`.

- Action:

  1. Validate the authenticated user session.

  2. Confirm the university exists.

  3. Query `UniversityRole` for the current user and the selected `uniId`.

  4. If a row exists, set `uniRole` to that row's role.

  5. If no row exists, set `uniRole = 'student'`.

  6. Persist `uniId` and `uniRole` into the session payload.

Why this should be explicit:

- `uniId` must be chosen by the user before any university-scoped authorization can happen.

- `uniRole` depends on the combination of `userId` + `uniId`.

- Without this, `@Roles('student')` cannot know which university scope to validate against.

### 6. Persist the selected university in session storage

There are two main options:

1. Persist `uniId`/`uniRole` inside the BetterAuth session payload itself.

   - This is ideal because `@CurrentSession()` will get the enriched session automatically.

   - It requires a session-update operation through BetterAuth or your own session storage layer.

2. Persist `uniId`/`uniRole` in a separate table keyed by session ID or user ID.

   - Then enrich `req.session` on every request in `AuthGuard`.

   - This is slightly more work, but still valid if BetterAuth cannot store custom session fields easily.

In either case, the auth layer should ensure:

- `req.session.uniId` is available for controller handlers.

- `req.session.uniRole` is available for guard checks.

### 7. Keep `sys_admin` as an override

The sys admin path remains simple:

- `session.user.role === 'sys_admin'` always bypasses university-scoped checks.

- System admin can still call any endpoint annotated with `@Roles('sys_admin')` or `@Roles('student', 'uni_admin', 'sys_admin')`.

If you want, you can also allow sys admin to retain a `uniId`/`uniRole` for consistency, but it is not required for permission checks.

---

## Recommended request/session flow

### 1. Login

- User logs in via BetterAuth.

- Backend returns auth session via `GET /api/auth/session`.

- At this point, `SessionData.user.role` is normalized to `user` or `sys_admin`.

- `uniId` and `uniRole` are empty.

### 2. User selects a university

- Frontend calls `POST /api/auth/select-university` with the chosen `uniId`.

- Backend queries the `UniversityRole` table:

  - If found, use that role.

  - If not found, use default `'student'`.

- Backend updates the stored session state.

- Backend returns the enriched session to the frontend.

### 3. Subsequent requests

- `AuthGuard` loads the session and attaches it to the request.

- `@CurrentSession()` returns `SessionData` including `uniId` and `uniRole`.

- `RolesGuard` checks `session.uniRole` for university-scoped routes.

Example `CurrentSession` data after selection:

```ts

{

  user: {

    id: 'abc',

    name: 'Alice',

    email: 'alice@example.com',

    emailVerified: true,

    role: 'user',

    banned: false,

    createdAt: '2025-01-01T00:00:00Z',

    updatedAt: '2025-01-01T00:00:00Z',

  },

  session: {

    id: 'sess-123',

    token: '...',

    userId: 'abc',

    expiresAt: '2025-01-08T00:00:00Z',

    createdAt: '2025-01-01T00:00:00Z',

    updatedAt: '2025-01-01T00:00:00Z',

  },

  uniId: 'uni-789',

  uniRole: 'lecturer_pending',

}

```

---

## How decorators should behave after the change

### `@CurrentSession()`

- Still returns the active session object from `req.session`.

- The only difference is the new fields `uniId` and `uniRole` are now available.

- Existing controller code that reads `session.user.id` keeps working.

### `@Roles(...)` semantics

Update `roles.guard.ts` so it can validate both global and university-scoped roles.

Suggested behavior:

- `@Roles('user')` = any authenticated user.

- `@Roles('sys_admin')` = only sys admin.

- `@Roles('student')` = university-scoped student role on selected `uniId`.

- `@Roles('uni_admin')` = university-scoped admin role on selected `uniId`.

- `@Roles('student', 'uni_admin', 'sys_admin')` = allow student/uni admin on the selected university, or sys admin globally.

This means the guard must:

1. Allow if `session.user.role === 'sys_admin'`.

2. Allow if `requiredRoles` contains `user` and the session is authenticated.

3. Otherwise, compare `requiredRoles` against `session.uniRole`.

If you choose to keep the rest of the `@Roles()` strings unchanged, the guard is the only place that needs adaptation.

---

## Practical implementation notes

### University role lookup location

The lookup should happen once per university selection and/or once per request when `uniId` exists.

Possible placement:

- In `AuthGuard.canActivate` after session fetch.

- In a dedicated `SessionEnrichmentGuard` that runs after `AuthGuard`.

- In the university selection endpoint before writing the session.

### Default `student` behavior

When there is no `UniversityRole` row for `userId` + `uniId`:

- Treat the session as `uniRole = 'student'`.

- Optionally, do not create a DB row until the user applies for a role.

- If you want explicit persistence, insert a `UniversityRole` row with `role = 'STUDENT'` at selection time.

### Applying and approving roles

Role application and approval should remain in university endpoints:

- `UniversityService.applyForUniRole(...)`

- `UniversityService.approveUserRole(...)`

After `applyForUniRole` succeeds:

- refresh the session or selected-university session payload

- set `session.uniRole = 'uni_admin_pending'` or `lecturer_pending`

After approval:

- refresh session payload to `uniRole = 'uni_admin'` or `lecturer'`.

---

## Recommended code changes summary

1. `apps/backend/src/auth/session.decorator.ts`

   - add `uniId` and `uniRole`

   - restrict `user.role` to `user | sys_admin`

2. `apps/backend/src/auth/roles.ts`

   - change `AppRole` to `user | sys_admin`

   - add `UniRole`

   - add a combined role type if needed by guards

3. `apps/backend/src/auth/roles.guard.ts`

   - update guard semantics to validate `session.uniRole`

   - allow sys admins globally

   - support `@Roles('user')`

4. `apps/backend/src/auth/auth.guard.ts`

   - normalize raw BetterAuth session role to `user` unless sys admin

   - attach `uniId` and `uniRole` when available

5. `apps/backend/src/auth/auth.controller.ts`

   - add endpoint for selecting current university and refreshing session payload

6. `apps/backend/src/auth/auth.service.ts` or a dedicated helper

   - perform `UniversityRole` lookup for the selected `uniId`

   - compute default `student` when no row exists

   - persist the selected `uniId` state into session storage or an external session table

7. `apps/backend/src/University/university.service.ts`

   - keep apply/approve role behavior unchanged

   - add support to fetch current user role by `uniId` if needed by session enrichment

---

## Example guard logic sketch

```ts
const session = request.session;

if (!session || !session.user) throw new UnauthorizedException();

if (session.user.role === 'sys_admin') return true;

if (requiredRoles.includes('user')) return true;

const uniRole = session.uniRole;

if (!uniRole)
  throw new ForbiddenException('University not selected or role missing');

if (requiredRoles.includes(uniRole)) return true;

throw new ForbiddenException('Insufficient permissions');
```

---

## Important caveat

This design assumes `@Roles(...)` is now a mixed global / university-scoped guard marker. If you want to keep a clean separation, consider introducing a second decorator such as `@UniRoles(...)` for university-specific permissions. But the minimal migration is to keep `@Roles(...)` and update the guard.

---

## Final recommendation

Use the auth directory as the single place to normalize session shape and evaluate permissions.

- `AuthGuard` = raw session fetch + normalization

- `SessionData` = new structure with `uniId` and `uniRole`

- `RolesGuard` = enforce global and university roles

- `auth.controller.ts` = explicit current-university selection endpoint

- `UniversityRole` lookup = the source of truth for `uniRole`

With that in place, endpoint decorators can stay mostly unchanged, and `@CurrentSession()` will expose the selected university and scoped role automatically.
