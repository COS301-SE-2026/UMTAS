# Quality Requirements

!!! abstract "Section Brief"
    Quality requirements define the non-functional constraints UMTAS must satisfy. All requirements are measurable and testable. They directly inform the architectural patterns and technology choices documented in the [Architectural Requirements](Architectural-Requirements.md).

    **Dimensions covered:** Flexibility · Maintainability · Scalability · Performance · Reliability · Security · Auditability · Testability · Usability · Integrability

---

## Flexibility

- New university formats shall be supported by adding a concrete adapter without modifying the Core Engine.

## Maintainability

- Cyclomatic complexity ≤ 10 per function.
- SonarCloud maintainability rating of A.

## Scalability

- Minimum 10 concurrent university sessions.
- 50 PDF parse jobs per hour per worker instance.

## Performance

- Standard CRUD responses ≤ 300 ms at p95.
- Solver timeout of 60 seconds with partial result fallback.

## Reliability

- All merges gated on passing CI.
- Failed jobs retried with exponential backoff and dead-lettered on exhaustion.

## Security

- HTTPS enforced in production.
- RBAC on every endpoint.
- OWASP Top 10 review in CI.

## Auditability

- Structured logs for all HTTP requests, job state transitions, and auth events.

## Testability

- 80% minimum code coverage.
- all tests executable in CI without external service dependencies.

## Usability

- WCAG 2.1 AA compliance.
- University branding configurable via theming layer without code changes.

## Integrability

- New university integrations achievable by implementing the abstract adapter interface only.