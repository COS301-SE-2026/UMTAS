
## 3.3 Non-Functional Requirement (NFR) Testing


### 3.3.1 Quality Requirement Mapping Verification

<!-- Aidan and Michael I think you guys will fill in these sections  -->

### 3.3.2 NFR Traceability Matrix


| **ID** | **Quantified requirement** | **Tactic in SAS** | **Test / Tool** | **Target / Actual** |
| **NFR-Sec-3** | 0 `pnpm audit` findings of moderate or higher severity on `main` | Strict dependency management | `pnpm audit` in CI pipeline | 0 findings / 0 findings |
| **NFR-Avail-1** | ≥99.5% uptime on public endpoints prior to Demo 3 | Automated health checks / Process supervisors | UptimeRobot | ≥99.5% / >99.95 |
| **NFR-Sec-2** | 0 alerts of High severity or higher | Input validation / Authorisation middleware | OWASP ZAP | 0 alerts / O alerts |


