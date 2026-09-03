## 3.3 Non-Functional Requirement (NFR) Testing

### 3.3.1 Quality Requirement Mapping Verification

<!-- Aidan and Michael I think you guys will fill in these sections  -->

??? note "NFR-Corr-1 - Supported Timetable PDF Extraction Correctness"

    The nine supported UP lecture, semester-test, and exam fixtures pass complete comparisons against the [manually reviewed ground-truth manifest](https://github.com/COS301-SE-2026/UMTAS/blob/main/apps/pdf_parser/parser/tests/ground_truth/up_supported_fixtures.json). The acceptance test calculates 100% field-level precision and recall for each fixture, reports zero omitted and zero invented records or fields, and checks exact canonical-result equality. The Python parser suite is an active CI gate; see the [NFR test matrix](NON-FUNCTIONAL_TESTING.md#332-nfr-traceability-matrix) for the recorded result.

??? note "NFR-Corr-2 - Conflict-Free Schedule Correctness"

    For an input whose hard constraints admit no conflict-free schedule, the system returns a clearly labelled `best-effort` result and identifies every remaining overlap. This is functional behaviour and does not weaken the conflict-free acceptance measure above.

??? note "NFR-Scale-1 - University-Scale Scheduling Workload"

    The synchronous latency target applies to job submission and status retrieval, not to completion of all compute-intensive scheduling work. A job is accepted when the API has persisted its job record, successfully enqueued it, and returned its identifier.

??? note "NFR-Maint-1 - University Adapter Modifiability"

    The University API Adapter architecture isolates university-specific API communication and data transformation behind a stable internal contract. The adapter pattern, abstraction, and dependency inversion ensure that adding support for a new university requires modifications only within the adapter boundary. The [case study](API_ADAPTER_CASE_STUDY.md) provides detailed verification that existing non-adapter components remain unchanged when a new university integration is introduced.

### 3.3.2 NFR Traceability Matrix

| **ID** | **Requirement Measure** | **Strategy / Implementation** | **Tool / Environment** | **Target / Actual** |
| --- | --- | --- | --- | --- |
| **NFR-Sec-3** | 0 `pnpm audit` findings of moderate or higher severity on `main` | Strict dependency management | `pnpm audit` in CI pipeline | 0 findings / 0 findings |
| **NFR-Avail-1** | ≥99.5% uptime on public endpoints prior to Demo 3 | Automated health checks / Process supervisors | UptimeRobot | ≥99.5% / >99.95 |
| **NFR-Sec-2** | 0 alerts of High severity or higher | Input validation / Authorisation middleware | [OWASP ZAP](Owasp.md) | 0 alerts / 0 alerts |
| **NFR-Por-1** | 0 test failures for repeated tests across all provided browsers | Automated cross-browser E2E testing targeting Chromium, Edge, and Firefox | Playwright in CI/CD pipeline | 0 failures / TBD |
| **NFR-Acc-1** | Lighthouse Accessibility score exceeds 90 out of 100 | Accessibility audits across key frontend application pages | [Lighthouse](Lighthouse.md) | >90 score / TBD |
| **NFR-Maint-1** | 0 existing production components outside the University API Adapter layer modified when adding a new university API | Adapter pattern, abstraction, dependency inversion | Code review / [Case Study](API_ADAPTER_CASE_STUDY.md) | 0 non-adapter components / 0 non-adapter components |

The NFR-Corr-1 acceptance test uses
`apps/pdf_parser/parser/tests/ground_truth/up_supported_fixtures.json`
which records the review method, date, canonical normalisation rules, and complete expected output for
all nine fixtures. The test compares complete records, counts leaf-field matches to
calculate precision and recall, rejects omitted or invented records and values, and finally requires
exact result equality. On 2026-09-02, the complete parser suite passed **69 tests** with five
non-failing dependency deprecation warnings.