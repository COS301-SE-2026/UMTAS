# Quality Requirements

Quality requirements define non-functional expectations for system behaviour, performance, reliability, and maintainability across all subsystems. These requirements apply throughout the system's lifecycle and are measured continuously through automated testing, monitoring, and analysis.

---

## Performance

**Justification:** Slow timetable generation or sluggish user interface responses would reduce the system's utility to university administrators and students, particularly during peak scheduling periods.

| Metric | Threshold | Measurement Method |
|--------|-----------|-------------------|
| API Response Time (CRUD) | <300 ms at 95th percentile | Request timing via Prometheus |
| Solution Cache Hit | <500 ms | Cache lookup timing metrics |
| Timetable Generation | <60 seconds default timeout | Scheduler timeout configuration |
| PDF Parsing | <30 seconds per 100 pages | Job duration tracking |
| Solution Partial Result | Must return within configured timeout | Solver partial solution flag |

---

## Reliability

**Justification:** UMTAS manages university scheduling data; downtime or data loss directly impacts academic operations.

| Metric | Threshold | Measurement Method |
|--------|-----------|-------------------|
| System Uptime | ≥99.5% (measured monthly) | External uptime monitoring (NodePing/Uptime Robot) |
| Main Branch Deployability | Always deployable | CI gate on all merges |
| Background Job Retry | Exponential backoff (max 5 retries) | BullMQ job state tracking |
| Job Failure Recovery | Zero data loss on worker crash | Message broker acknowledgement verification |
| Database Backup | Daily automated backups | Backup job completion logs |

---

## Scalability

**Justification:** UMTAS must serve multiple universities concurrently, each potentially submitting PDF parsing jobs and timetable generation requests during peak periods.

| Metric | Threshold | Measurement Method |
|--------|-----------|-------------------|
| Concurrent Sessions | ≥10 active universities | Load testing with concurrent sessions |
| PDF Job Throughput | ≥50 jobs/hour per worker | BullMQ job completion metrics |
| Concurrent Solver Jobs | ≥5 parallel generations | Parallel job submission testing |
| Horizontal Scaling | Linear performance improvement | Load test with worker replicas |
| Core API Concurrency | ≥100 concurrent HTTP connections | k6 or Apache JMeter load testing |

---

## Security

**Justification:** UMTAS manages academic data (student enrolments, lecturer schedules, venue bookings) and authenticates users across multiple institutions.

| Metric | Threshold | Measurement Method |
|--------|-----------|-------------------|
| Password Hashing | Modern adaptive algorithm (bcrypt/argon2) | Codebase review + npm audit |
| JWT Expiry | <1 hour access token, <7 days refresh | Auth configuration review |
| HTTPS-Only | All production traffic encrypted | SSL certificate validation + HSTS headers |
| Role-Based Access Control | Enforced on all endpoints | Integration tests per role |
| OWASP Top 10 | Zero critical vulnerabilities | OWASP ZAP scanning in CI |
| Dependency Vulnerabilities | Zero high/critical severity | npm audit in CI/CD pipeline |
| OAuth 2.0 PKCE | Required for all OAuth flows | Integration test verification |

---

## Maintainability

**Justification:** UMTAS is expected to be extended over multiple academic years, onboarding new universities and adding scheduling constraints.

| Metric | Threshold | Measurement Method |
|--------|-----------|-------------------|
| Static Analysis Rating | Grade A | SonarCloud analysis on main branch |
| Cyclomatic Complexity | ≤10 per function | SonarCloud metrics |
| Code Coverage | ≥80% | Vitest coverage reports |
| Depth of Inheritance | ≤3 levels (Adapter pattern exception: 2 levels) | SonarCloud inheritance depth analysis |
| Circular Dependencies | None allowed | Dependency analysis tooling |
| Code Formatting | 100% consistent (auto-enforced) | Prettier + Husky pre-commit hooks |
| Technical Debt Ratio | <5% | SonarCloud debt calculation |

---

## Usability

**Justification:** UMTAS is used by students, lecturers, and university administrators with varying levels of technical experience.

| Metric | Threshold | Measurement Method |
|--------|-----------|-------------------|
| WCAG 2.1 Compliance | Level AA minimum | Automated accessibility testing (axe-core) |
| Mobile Responsiveness | Functional on phones, tablets, desktop | Responsive design testing framework |
| Colour Contrast | ≥4.5:1 for normal text, ≥3:1 for large text | Automated contrast testing |
| Touch Target Size | ≥44×44 px | Design review + Playwright E2E |
| Browser Support | Modern evergreen browsers (Chrome, Firefox, Safari, Edge) | Cross-browser testing (BrowserStack) |
| Load Time | <3 seconds first contentful paint | Lighthouse CI integration |
| Error Messages | Clear, actionable, non-technical language | UX review + user testing |

---

## Auditability

**Justification:** The system must maintain a clear audit trail of all significant operations to support debugging, compliance, and accountability.

| Metric | Threshold | Measurement Method |
|--------|-----------|-------------------|
| HTTP Request Logging | All requests logged with metadata | Application log configuration review |
| Job State Transitions | All changes logged (submitted, started, completed, failed) | BullMQ event listener verification |
| Authentication Events | Login, logout, token refresh, failures logged | Auth module test verification |
| Exception Logging | All exceptions logged with stack trace | Try-catch block review + test coverage |
| Log Searchability | Queryable by user, event type, timestamp | Structured JSON logging format |
| Log Retention | ≥90 days minimum | Log storage policy + rotation config |
| Log Verbosity Config | DEBUG/INFO/WARN configurable per environment | Environment variable configuration |

---

## Testability

**Justification:** All business logic must be testable in isolation without requiring a running database or external services.

| Metric | Threshold | Measurement Method |
|--------|-----------|-------------------|
| Unit Test Coverage | ≥80% of service layer | Vitest coverage reports |
| Unit Test Isolation | No external dependencies (DB, HTTP) | Mock/double verification in tests |
| Integration Tests | All repository interactions tested | Integration test suite against PGLite |
| End-to-End Tests | Critical user flows covered | Playwright E2E test suite |
| CI Test Execution | All tests run on every pull request | GitHub Actions CI workflow |
| CI Test Blocking | Merge blocked on failing tests | GitHub branch protection rules |
| Test Execution Time | <10 minutes for full suite | CI job duration monitoring |

---

## Observability

**Justification:** University admins and system administrators need operational visibility into system health and user activity.

| Metric | Threshold | Measurement Method |
|--------|-----------|-------------------|
| Metrics Exposure | Prometheus-compatible metrics endpoint | `/metrics` endpoint availability |
| Dashboard Availability | Real-time Grafana dashboard | Dashboard uptime monitoring |
| Alert Responsiveness | Alerts fired within 2 minutes of event | Alert evaluation latency testing |
| Monitoring Coverage | Request rate, error rate, queue depth, worker health | Prometheus metrics configuration |
| SLA Reporting | Monthly uptime and performance reports | CloudWatch / Prometheus aggregation |

---

## Integrability

**Justification:** UMTAS must integrate with Google Calendar for timetable export and with external university APIs for data ingestion, while remaining open to integration with additional systems.

| Metric | Threshold | Measurement Method |
|--------|-----------|-------------------|
| Adapter Pattern Adherence | All external integrations behind abstract interface | Code review + architecture analysis |
| Integration Tests | All adapters tested with test doubles | Integration test coverage per adapter |
| Regression Testing | Changes to one adapter cannot break others | Integration test suite completeness |
| New Adapter Onboarding | No Core Engine changes required | Adapter implementation guide + zero-change verification |
| API Contract Documentation | OpenAPI/Swagger specs for all endpoints | Swagger/OpenAPI generation from code |

---

## Cross-Cutting Quality Concerns

### Code Consistency

All code must be formatted consistently and follow project-wide style guidelines. Pre-commit hooks (Husky) run Prettier and ESLint on every commit to prevent style drift.

### Dependency Management

All dependencies must pass security scanning in the CI pipeline. Vulnerable dependencies must be identified and patched within 7 days of disclosure.

### Documentation

- API endpoints must have OpenAPI documentation
- All public classes and functions must have JSDoc comments
- Architecture and domain model diagrams must be maintained in version control
- Deployment and runbook documentation must be kept current

---

## Monitoring & Continuous Measurement

Quality requirements are not static compliance checkpoints but continuous measurements:

- **SonarCloud:** Daily static analysis on main branch
- **Vitest:** Automated test execution on every commit
- **Prometheus/Grafana:** Real-time performance and health metrics
- **External Uptime Monitoring:** Continuous endpoint availability verification
- **Dependency Scanning:** Automated security vulnerability checks
- **Accessibility Testing:** Automated WCAG compliance checks in CI

All metrics are displayed on operational dashboards and configured to alert development and operations teams when thresholds are violated.
