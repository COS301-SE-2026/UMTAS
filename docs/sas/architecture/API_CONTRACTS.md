# API Contracts

## Purpose

The API Contracts section records the main integration boundaries in UMTAS and identifies the source
of truth for each contract. Endpoint-level request bodies, response bodies, status codes, and schema
details are maintained in Swagger/OpenAPI rather than duplicated in this document.

## Authoritative API Reference

The live Core API Swagger document is the primary endpoint reference for Demo 2:

<swagger-ui src="https://api.capstone-vigil.dns.net.za/api/docs-json" />

The Swagger contract must describe the implemented Core API endpoints, including authentication,
authorization, request and response schemas, validation errors, and protected route behaviour.

## Contract Boundaries

| Boundary | Consumer | Transport | Contract Source |
|---|---|---|---|
| Browser to Core API | Web application | HTTPS JSON and multipart upload where required | Core Swagger/OpenAPI |
| Browser to auth routes | Web application | HTTPS session and OAuth flow | Better Auth route configuration and Core Swagger where exposed |
| Core API to job queue | Core-owned workers | Redis-backed queue messages | Shared job payload schema |
| Worker to parser service | Parse worker | Internal HTTP JSON | Parser service contract |
| Worker to solver service | Solve worker | Internal HTTP JSON | Solver service contract |
| Core API to university adapters | Core domain services | In-process or HTTPS integration | Adapter interface and provider schema |
| Core API to Google Calendar | Calendar integration service | HTTPS OAuth 2.0 API calls | Google API plus internal calendar adapter |

## Common Contract Rules

- External browser-facing APIs use HTTPS.
- JSON is the default payload format; PDF import may use multipart form data.
- Identifiers are opaque strings and must not expose database implementation details.
- Timestamps use UTC ISO 8601.
- Protected endpoints require an authenticated session and the relevant global or workspace
  permission.
- Validation failures, authorization failures, missing resources, conflicts, and server errors must
  return safe client-facing errors without leaking stack traces, secrets, tokens, or another tenant's
  private data.
- Long-running operations return a job reference instead of blocking the request until parsing or
  solving completes.

## Asynchronous Job Contract

Parse and solve workflows follow the same high-level contract:

1. The browser submits work to the Core API.
2. The Core validates access, creates a job record, and enqueues work for a Core-owned worker.
3. The worker calls the parser or solver service over an internal service boundary.
4. The worker persists the terminal result.
5. The browser polls the Core API for job status.

Job states exposed to the browser are `queued`, `running`, `succeeded`, and `failed`. Parser and
solver services do not receive browser sessions or arbitrary callback URLs.

## Integration Scope

University source variation is handled by adapters, not by browser clients. Calendar integration is
also Core-owned: OAuth handling, token storage, Google Calendar writes, and `.ics` export generation
stay behind the Core API.

Bidirectional calendar reconciliation and full external university API integration are outside the
Demo 2 contract scope unless separately implemented and documented in Swagger.