# Non-Functional Requirements

Meeting a quality target requires measured evidence from a representative environment.

| **ID** | **Quality** | **Requirement** | **Measurement** |
|---|---|---|---|
| **NFR-1** | Performance | At least 95% of interactive requests shall complete within 2 seconds under normal operating conditions, with support for at least 500 concurrent users. | Load test reporting concurrency and p95 latency. |
| **NFR-2** | Scalability | The system shall support a workload increase of 200% without major architectural changes or more than a 10% performance decrease. | Comparative load test using the same dataset and environment. |
| **NFR-3** | Security | Sensitive user data shall use AES-256 encryption at rest, and administrative accounts shall use multi-factor authentication. | Configuration inspection and administrative authentication test. |
| **NFR-4** | Reliability | The system shall achieve 99.9% uptime and recover from a critical failure within 5 minutes. | Availability report and timed recovery exercise. |
| **NFR-5** | Maintainability | New features or defect fixes shall be deployable within 2 hours, and first-party code shall maintain at least 80% automated test coverage. | Timed deployment exercise and consolidated coverage report. |

## Measurement Rules

- Each result shall state the build, environment, dataset, load, and measurement date.
- Parsing and solving durations shall be reported separately from interactive request latency.
- A target shall not be marked as met without recorded evidence.
