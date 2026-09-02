
## 3.3 Non-Functional Requirement (NFR) Testing


### 3.3.1 Quality Requirement Mapping Verification

<!-- Aidan and Michael I think you guys will fill in these sections  -->

### 3.3.2 NFR Traceability Matrix


| **ID** | **Quantified requirement** | **Tactic in SAS** | **Test / Tool** | **Target / Actual** |
|:---:|---|---|---|---|
| **NFR-Corr-1** | 100% field precision and recall for every supported PDF; 0 omitted or invented records/fields | UP adapter isolation and canonical contract validation | Manually reviewed manifest + `test_up_ground_truth.py` in CI | 100% / 100% on all 9 fixtures; 0 omissions; 0 inventions (2026-09-02) |
| **NFR-Sec-3** | 0 `pnpm audit` findings of moderate or higher severity on `main` | Strict dependency management | `pnpm audit` in CI pipeline | 0 findings / 0 findings |
| **NFR-Avail-1** | ≥99.5% uptime on public endpoints prior to Demo 3 | Automated health checks / Process supervisors | UptimeRobot | ≥99.5% / >99.95 |
| **NFR-Sec-2** | 0 alerts of High severity or higher | Input validation / Authorisation middleware | OWASP ZAP | 0 alerts / O alerts |

The NFR-Corr-1 oracle is
[`apps/pdf_parser/parser/tests/ground_truth/up_supported_fixtures.json`](../../apps/pdf_parser/parser/tests/ground_truth/up_supported_fixtures.json).
It records the review method, date, canonical normalisation rules, and complete expected output for
all nine fixtures. The acceptance test compares complete records, counts leaf-field matches to
calculate precision and recall, rejects omitted or invented records and values, and finally requires
exact result equality. On 2026-09-02, the complete parser suite passed **69 tests** with five
non-failing dependency deprecation warnings.
