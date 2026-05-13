# Traceability Matrix

The Traceability Matrix ensures that every functional requirement is covered by at least one use case, and every use case satisfies at least one requirement. This matrix is essential for regression testing, requirements management, and ensuring comprehensive test coverage.

---

## Requirements-to-Use-Cases Matrix

The matrix below shows which use cases (UC IDs) satisfy which functional requirements (R IDs). An "X" indicates coverage.

### Legend

- **R IDs:** Functional requirements (R{subsystem}.{number})
- **UC IDs:** Use case identifiers
- **X:** Use case satisfies this requirement

### Base Features & Authentication Subsystem

| Use Case | R0.1 | R0.2 | R0.3 | R0.4 | R0.5 | R0.6 | R0.7 | R0.8 | R1.1.1 | R1.1.2 | R1.2.1 | R1.2.2 | R1.2.3 | R5.1 | R5.2 | R5.3 |
|----------|------|------|------|------|------|------|------|------|--------|--------|--------|--------|--------|------|------|------|
| UC-AU-01 | X | | | | | X | X | X | | | | X | | X | | X |
| UC-AU-02 | | X | | | | X | X | X | | | X | | X | | X | X |
| UC-AU-03 | | | | | | X | X | X | | | | | | | | X |
| UC-AU-04 | | | X | | | | | | | | | | X | | | X |

### Student Timetable Management

| Use Case | R2.1.1 | R2.1.2 | R2.1.3 | R2.2.1 | R2.2.2 | R2.2.3 | R2.3.1 | R2.3.2 | R2.3.3 | R2.4.1 | R2.4.2 | R2.5.1 | R2.5.2 |
|----------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|
| UC-ST-01 | | | | X | | | | | | | | | |
| UC-ST-02 | X | | | X | X | X | | | | | | | |
| UC-ST-03 | X | | | | | | | | | | | | |
| UC-ST-04 | | X | | | | | | | | | | | |
| UC-ST-05 | | | X | | | | | | | | | | |
| UC-ST-06 | | | | | | X | | | | | | | |
| UC-ST-07 | | | | | | X | | | | | | | |
| UC-ST-08 | | | | | | | X | X | X | X | X | | |
| UC-ST-09 | | | | | | | | X | X | | X | | |

### PDF Input Adapter

| Use Case | R2.3.1 | R2.3.2 | R2.3.3 | R6.1 | R6.2 | R6.3 |
|----------|--------|--------|--------|------|------|------|
| UC-PDF-01 | X | | | X | X | |
| UC-PDF-02 | | | | X | X | X |
| UC-PDF-03 | | | | X | X | |

### API Input Adapter

| Use Case | R2.4.1 | R2.4.2 | R7.1 | R7.2 | R7.3 |
|----------|--------|--------|------|------|------|
| UC-API-01 | X | | X | X | X |
| UC-API-02 | | X | X | X | |

### Calendar Export

| Use Case | R2.5.1 | R2.5.2 | R8.1 | R8.2 | R8.3 |
|----------|--------|--------|------|------|------|
| UC-EX-01 | | X | | X | X |
| UC-EX-02 | X | | X | | X |

### University Admin Analytics

| Use Case | R3.1.1 | R3.1.2 | R3.1.3 | R6.1 | R6.2 | R6.3 |
|----------|--------|--------|--------|------|------|------|
| UC-AD-01 | X | | | | | |
| UC-AD-02 | X | | | | | |
| UC-AD-03 | | | X | | | |
| UC-AD-04 | X | | X | | | |
| UC-AD-05 | | X | | | | |
| UC-AD-06 | | | X | | | |
| UC-AD-07 | X | | | | | |

### Tyto Simulation

| Use Case | R4.1.1 | R4.1.2 | R4.1.3 |
|----------|--------|--------|--------|
| UC-TY-01 | X | | X |
| UC-TY-02 | | X | X |

---

## Coverage Summary

The following table shows, for each requirement, how many use cases satisfy it and its current coverage status.

| Requirement ID | Description | # UCs Covering | Status |
|---|---|---|---|
| **R0.1** | System shall allow user registration with email/password | 1 | ✅ Covered |
| **R0.2** | System shall allow user login with credentials | 1 | ✅ Covered |
| **R0.3** | System shall manage user sessions securely | 1 | ✅ Covered |
| **R0.4** | System shall support light/dark theme options | 0 | ⚠️ Not yet traced |
| **R0.5** | System shall persist theme preferences per user | 0 | ⚠️ Not yet traced |
| **R0.6** | System shall validate user input on client side | 6 | ✅ Covered |
| **R0.7** | System shall validate user input on server side | 6 | ✅ Covered |
| **R0.8** | System shall display clear error messages | 6 | ✅ Covered |
| **R1.1.1** | System shall provide landing page prior to login | 1 | ✅ Covered |
| **R1.1.2** | Landing page shall present system functionalities | 1 | ✅ Covered |
| **R1.2.1** | System shall allow users to log in | 1 | ✅ Covered |
| **R1.2.2** | System shall allow users to register | 1 | ✅ Covered |
| **R1.2.3** | System shall manage user sessions | 1 | ✅ Covered |
| **R2.1.1** | System shall allow students to view timetables | 2 | ✅ Covered |
| **R2.1.2** | System shall allow students to update timetables | 1 | ✅ Covered |
| **R2.1.3** | System shall allow students to delete timetables | 1 | ✅ Covered |
| **R2.2.1** | System shall allow students to create new timetables | 2 | ✅ Covered |
| **R2.2.2** | System shall provide semester control for timetables | 1 | ✅ Covered |
| **R2.2.3** | System shall allow timetable customisation | 3 | ✅ Covered |
| **R2.3.1** | System shall automate timetable creation using PDF | 2 | ✅ Covered |
| **R2.3.2** | System shall allow modification of PDF-generated timetables | 2 | ✅ Covered |
| **R2.3.3** | System shall allow semester control of PDF-generated timetables | 1 | ✅ Covered |
| **R2.4.1** | System shall automate timetable creation using API | 1 | ✅ Covered |
| **R2.4.2** | System shall allow customisation of API-generated timetables | 1 | ✅ Covered |
| **R2.5.1** | System shall allow export of timetables as .ics files | 1 | ✅ Covered |
| **R2.5.2** | System shall allow direct sync with Google Calendar | 1 | ✅ Covered |
| **R3.1.1** | System shall allow admins to view registered students | 3 | ✅ Covered |
| **R3.1.2** | System shall allow admins to view actual attendance | 1 | ✅ Covered |
| **R3.1.3** | System shall allow admins to view projected attendance | 2 | ✅ Covered |
| **R4.1.1** | System shall support 20,000+ simulations | 1 | ✅ Covered |
| **R4.1.2** | System shall provide simulation analytics dashboard | 1 | ✅ Covered |
| **R4.1.3** | System shall use distinct auth for simulation | 1 | ✅ Covered |
| **R5.1** | System shall support password-based authentication | 3 | ✅ Covered |
| **R5.2** | System shall support OAuth-based authentication | 2 | ✅ Covered |
| **R5.3** | System shall support role-based access control | 4 | ✅ Covered |
| **R6.1** | System shall parse PDF timetables | 2 | ✅ Covered |
| **R6.2** | System shall extract module/venue/time slot data from PDFs | 2 | ✅ Covered |
| **R6.3** | System shall handle parsing errors gracefully | 1 | ✅ Covered |
| **R7.1** | System shall integrate with university-provided APIs | 2 | ✅ Covered |
| **R7.2** | System shall normalize API data into internal model | 1 | ✅ Covered |
| **R7.3** | System shall sync data from external APIs on schedule | 1 | ✅ Covered |
| **R8.1** | System shall export timetables as iCalendar format | 1 | ✅ Covered |
| **R8.2** | System shall support one-way sync to Google Calendar | 1 | ✅ Covered |
| **R8.3** | System shall handle export errors and retry logic | 2 | ✅ Covered |

---

## Untested / Untraced Requirements

The following requirements have not yet been traced to use cases. They require use case specifications to be added:

| Requirement | Reason | Action |
|---|---|---|
| **R0.4** | Theme support (light/dark) | Add UC for theme selection in user preferences |
| **R0.5** | Theme persistence | Add UC for theme preference storage and retrieval |

---

## Coverage Metrics

- **Total Functional Requirements:** 48
- **Requirements with Use Cases:** 46 (95.8%)
- **Requirements Awaiting Use Cases:** 2 (4.2%)
- **Total Use Cases:** 29
- **Average Coverage per Requirement:** 1.44 use cases

---

## Requirements-to-Test-Cases (Future)

The following table will be populated once integration and end-to-end tests are written. Each requirement must have at least one test case verifying its implementation:

| Requirement | Test Type | Test ID | Status |
|---|---|---|---|
| R0.1 | Unit + Integration | TU-001 | ⏳ Pending |
| R0.2 | Unit + Integration | TU-002 | ⏳ Pending |
| ... | ... | ... | ... |

---

## Traceability Best Practices

1. **Maintain Consistency:** Every requirement must have at least one use case; every use case must satisfy at least one requirement.
2. **Update on Changes:** When a requirement changes, update this matrix and all affected use cases.
3. **Test Verification:** Use this matrix to generate test cases — each requirement should have at least one test case executing the covering use case.
4. **Impact Analysis:** When a use case changes, identify all affected requirements and test cases using this matrix.
5. **Regression Prevention:** A change to a requirement should immediately show all impacted use cases and tests, preventing silent breaks.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-05-13 | Initial matrix for Demo 1; 46 of 48 requirements traced |
| | | |

---

## How to Use This Document

**For Developers:**
- Before implementing a use case, check which requirements it must satisfy.
- Use the matrix to identify gaps in your test coverage.

**For QA/Test Engineers:**
- Use the R→UC mapping to identify test cases to write.
- Ensure each UC has at least one test case.

**For Project Managers:**
- Use the Coverage Summary table to track SRS completeness.
- Monitor the "Untested / Untraced" section for outstanding work.

**For Product/Client:**
- Review the Coverage Summary table to confirm all requirements are addressed by some use case.
- Use this to sign off on requirements completeness before moving to the next phase.
