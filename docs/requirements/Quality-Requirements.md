# Quality Requirements

!!! abstract "Section Brief"
    UMTAS has five primary, quantified quality requirements derived from the client success
    criteria. The authoritative six-part scenarios and measurement rules are maintained in the
    [SRS Non-Functional Requirements](../srs/NON-FUNCTIONAL_REQUIREMENTS.md). Architectural
    responses and current evidence status are maintained in the
    [SAS Quality Requirement Mapping](../sas/architecture/QUALITY_REQUIREMENT_MAPPING.md).

    **Primary dimensions:** Functional correctness · Confidentiality · Scalability · Modifiability

---

## Primary Quality Targets

| **ID** | **Target** | **Quantification** |
|---|---|---|
| **NFR-Corr-1** | Supported timetable PDF extraction correctness | Field-level precision and recall of **100%**, **0 omissions**, **0 invented records or values**, and a valid canonical parser result |
| **NFR-Corr-2** | Conflict-free schedule correctness | **100%** of results labelled `conflict-free` satisfy all hard constraints and contain **0 overlapping event pairs** |
| **NFR-Sec-1** | Student timetable confidentiality | **0 student identifiers** beyond the privacy boundary, **0 individual schedules** available to administrators, and **0 identities** recovered by the re-identification test |
| **NFR-Scale-1** | University-scale scheduling workload | **20,000 active virtual users** for 15 minutes, at least **99%** successful submission and status requests, **p95 <= 2 seconds**, and **0 accepted jobs lost** |
| **NFR-Maint-1** | University adapter modifiability | **0 changes** to protected core, schema, contract, orchestration, or existing-adapter files, with **100%** of contract and regression tests passing |

These values are acceptance targets. They shall not be represented as achieved until the complete
fitness function for the corresponding scenario has produced repeatable evidence in its specified
environment.

## Additional Client Constraints

The following constraints remain applicable even though they are not separate primary scenarios:

- Student-facing views target WCAG 2.2 AA and shall remain usable from a 375 px viewport without
  horizontal scrolling.
- The schedule-generation journey targets completion from login to calendar export in under
  3 minutes during a moderated usability test.
- Supported static PDF ingestion shall not depend on a live university API.
- Every supported backend endpoint shall appear in the generated OpenAPI 3 specification.
- Google Calendar authorisation shall request calendar-write access without requesting read access
  to the student's existing calendar events.
- The production system shall be reproducibly deployable in containers on the client-provided
  Ubuntu server.
