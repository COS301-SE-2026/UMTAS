# SRS Brief — UMTAS

!!! abstract "Quick Reference"
    The University Modular Timetable Analytics System (UMTAS) automates academic timetable generation via constraint programming. Universities upload timetable data (PDFs or APIs); the system parses, solves scheduling conflicts, and exports to external calendars. Students access personalised schedules; administrators monitor venue utilisation and attendance analytics. Designed for extensibility — a core engine plus modular adapters allow new university integrations with zero core modifications.

---

## Project Summary

### What UMTAS Does

- **Parse timetable data** from multiple sources: university PDFs, institutional APIs, or manual module/venue entry
- **Solve scheduling conflicts** automatically using Google OR-Tools CP-SAT constraint programming
- **Generate optimised timetables** respecting venue capacity, lecturer availability, time windows, and student preferences
- **Export to external calendars** — direct Google Calendar sync and iCalendar (.ics) file download
- **Track analytics** — venue utilisation, lecturer workload, attendance patterns, overcapacity alerts, demand forecasting

### Project Owner

**Tyto Insights** — COS301 2026 Capstone Project, University of Pretoria

### Team

Wilmar Smit (u24584216), Michael Tomlinson (u24569705), Aidan Dawson (u24593542), Marcel Stoltz (u24566552), Johan Coetzer (u24564584)

---

## Functional Requirements — Grouped

### Input Pipeline

Timetable data enters via three channels: PDFs (university scans), APIs (institutional data systems), or manual entry. The PDF parser (with university-specific implementations) and API adapter (with abstract parent/concrete children) normalise all data into a common Module/Event schema.

- **R2.3:** Automate timetable creation from PDF upload (R2.3.1), allow user modification of parsed data (R2.3.2), semester control (R2.3.3)
- **R2.4:** Automate timetable creation from institutional API (R2.4.1), allow user customisation (R2.4.2)
- **R1.2:** User login, registration, session management (R1.2.1–R1.2.3)

### Schedule Generation

Once modules and preferences are collected, the core scheduling engine receives the request, queries the constraint solver, and materialises the solution as a Timetable.

- **R2.1:** Timetable CRUD — view (R2.1.1), update (R2.1.2), delete (R2.1.3)
- **R2.2:** Timetable creation via builder with semester control (R2.2.1–R2.2.3)
- **R0.6, R0.7, R0.8:** Client/server input validation and clear error messaging

### User-Facing Features

Students and staff interact via web frontends offering simple, responsive interfaces for timetable viewing, customisation, and export.

- **R1.1:** Landing page and system overview (R1.1.1–R1.1.2)
- **R2.1–R2.2:** View, create, customise personal timetables
- **R2.5:** Export timetables as .ics files (R2.5.1) or direct Google Calendar sync (R2.5.2)
- **R0.4–R0.5:** Support light/dark theme with persistence

### Admin & Analytics

University administrators access a dashboard showing resource utilisation and usage patterns, enabling data-driven scheduling decisions.

- **R3.1:** View module registration (R3.1.1), actual attendance (R3.1.2), projected attendance (R3.1.3)
- **R4.1:** Simulation support for 20,000+ concurrent timetables to evaluate system capacity (R4.1.1–R4.1.3)
- Analytics dashboard with venue heatmaps, lecturer workload charts, demand forecasts

### Calendar & Export

After a timetable is generated or published, students and admins can export to external calendar systems for ongoing synchronisation and reminders.

- **R2.5.1:** Export timetables as iCalendar (.ics) for universal import into any calendar app
- **R2.5.2:** Direct Google Calendar integration — one-click sync of timetable events to student's Google Calendar

---

## Use Cases — Grouped

### Critical Path: Student Timetable Flow

A student registers (UC-AU-01) and authenticates (UC-AU-02). They then select modules and set preferences (UC-ST-06), trigger timetable generation (UC-ST-02), view the result (UC-ST-03), and export to their calendar (UC-EX-01 or UC-EX-02). The timetable is stored and can be modified later (UC-ST-04) or deleted (UC-ST-05). Preferences persist across semesters.

**Primary Use Cases:** UC-AU-01, UC-AU-02, UC-ST-01 through UC-ST-07, UC-EX-01, UC-EX-02

### Admin Flow

A university administrator registers and logs in, then uploads an institutional timetable PDF (UC-PDF-01). The system queues a parse job (UC-PDF-02) and automatically populates modules into the calendar (UC-PDF-03). The admin then views analytics (UC-AD-01 through UC-AD-07) to identify bottlenecks and approves the schedule for publication. Optional: suggest venue reallocations (UC-AD-04) to resolve overcapacity.

**Primary Use Cases:** UC-AU-01, UC-AU-02, UC-PDF-01, UC-PDF-02, UC-PDF-03, UC-AD-01 through UC-AD-07

### API Integration Flow

A university's external system provides timetable data via a REST API. The system's API adapter (UC-API-01) fetches and normalises the data, automatically populating modules. A scheduled or manual trigger runs the solver (core scheduling) to generate the timetable, which is then published to students. The process requires no manual intervention and repeats automatically on a configured schedule.

**Primary Use Cases:** UC-API-01, UC-API-02, Core scheduling (UC-CE-01 through UC-CE-04)

---

## Domain Model Overview

### Architecture in One Paragraph

UMTAS employs an **Event-Calendar architecture** where all calendar-visible items — lectures, tutorials, labs, tests, exams, bootcamps — descend from a single abstract `Event` base class. Academic events link to a `Module` and must fit within the `AcademicCalendar` and respect its `Restriction`s (public holidays, exam periods, day-swaps, recesses). Non-academic events (e.g. bootcamps, personal events) have no module link and are placed directly into timetables without constraint solving. The design uses extensible JSONB fields (`criteria`, `details`) to store subtype-specific constraints without schema migrations. Each subsystem owns its entities; cross-subsystem interactions are realised as foreign-key references (database) or NestJS service calls (inter-module communication).

### Key Entities (Phase 1)

- **Event** — Abstract base class for all timetable items; concrete subtypes: Lecture, Tutorial, Lab, Test, Exam, Bootcamp
- **Module** — Academic subject (e.g. COS301); anchor for academic events; belongs to AcademicCalendar
- **Timetable** — Container of TimetableEntry records; status: DRAFT, GENERATED, MANUAL, EXPORTED; source: SOLVER, MANUAL, PDF_IMPORT, API_IMPORT
- **AcademicCalendar** — Defines scheduling window per semester; owns Restrictions (holidays, exam blocks, day-swaps)
- **Restriction** — Scheduling constraint (PUBLIC_HOLIDAY, RECESS, EXAM_PERIOD, CLOSURE); type-specific rules in JSONB
- **User** — Abstract class; concrete subtypes: Student, Lecturer, UniversityAdmin, SystemAdmin
- **TimetableEntry** — Single resolved occurrence of an Event; resolvedDate, resolvedTime, resolvedVenue
- **CalendarExport** — Export record (type: ICS, GOOGLE_CALENDAR); tracks export job status

### Cross-Subsystem Boundaries

- **Core ↔ Authentication:** Timetable owned by User; solver queries User.role for access control; session tokens managed separately
- **Core ↔ Input Adapters:** PDF and API parsers produce Module and Event records; they write directly to Core's database tables
- **Core ↔ Calendar Export:** After timetable generation, export service reads Timetable/TimetableEntry and converts to iCalendar or Google Calendar format
- **Core ↔ Admin Analytics:** Analytics subsystem queries Timetable, Venue, Lecturer, and Attendance tables; computes aggregates for dashboard visualisation

---

## Traceability Summary

The table below shows a sample of the full requirements-to-use-case matrix. Each requirement is satisfied by at least one use case, ensuring comprehensive coverage. See [Traceability Matrix](Traceability-Matrix.md) for the complete 48 × 29 mapping.

| Requirement | Description | Primary Use Case | Coverage |
|---|---|---|---|
| R1.2.1 | Users shall login | UC-AU-02 | ✅ |
| R1.2.2 | Users shall register | UC-AU-01 | ✅ |
| R2.1.1 | Students view timetables | UC-ST-03 | ✅ |
| R2.3.1 | PDF-based timetable creation | UC-PDF-01 | ✅ |
| R2.5.1 | Export as .ics file | UC-EX-02 | ✅ |
| R2.5.2 | Google Calendar sync | UC-EX-01 | ✅ |
| R3.1.1 | Admin view module registration | UC-AD-07 | ✅ |
| R4.1.1 | Support 20,000+ simulations | UC-TY-01 | ✅ |

**Coverage:** 46 of 48 requirements mapped (95.8%)  
**Outstanding:** R0.4, R0.5 (theme support — use cases pending)

For the complete matrix showing all 48 requirements and 29 use cases, refer to [Traceability Matrix](Traceability-Matrix.md).

---

## Quick Links

- **Full SRS:** [Introduction](Introduction.md) → [Functional Requirements](Functional-Requirements.md) → [User Stories](User-Stories.md) → [Use Cases](Use-Cases.md)
- **Design & Architecture:** [Domain Model](Domain-Model.md) → [Quality Requirements](Quality-Requirements.md) → [Architectural Requirements](Architectural-Requirements.md)
- **Technical Details:** [Technology Requirements](Technology-Requirements.md) → [API Service Contracts](API-Service-Contracts.md)
- **Traceability & Coverage:** [Traceability Matrix](Traceability-Matrix.md)

---

**Document Version:** 1.0  
**Last Updated:** 2024-05-13  
**Team:** Vigil (COS301 2026, University of Pretoria)  
**Status:** Demo 1 SRS Release
