# Authentication Endpoints

Authentication uses Better Auth under `/api/auth`. The NestJS controller delegates authentication requests to Better Auth and adds application endpoints.

Use the [REST endpoint catalogue](../../../../docs/sas/architecture/REST_ENDPOINT_CATALOGUE.md) for routes and the [committed OpenAPI document](../../docs/openapi.json) for declared schemas. The [service contracts](../../../../docs/sas/architecture/SERVICE_CONTRACTS.md#google-authentication) describe Google sign-in and account linking.

The current session endpoint is `GET /api/auth/get-session`. Global account roles are `user` and `sys_admin`. University memberships supply student, lecturer and university admin permissions separately.

In-house accounts must verify their email before signing in. Sessions last seven days and can be revoked individually. Cookie prefixes come from `COOKIE_PREFIX`, which defaults to `umtas`.

Implementation behaviour is defined by `auth.controller.ts`, `auth.ts` and `auth.service.ts`. Better Auth handles additional delegated routes, including account deletion.
