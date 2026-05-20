# Domain Model

!!! abstract "Section Brief"
    The domain model defines the core entities, relationships, and bounded contexts of UMTAS. It establishes the shared conceptual vocabulary between business stakeholders and the engineering team, and directly underpins all database schema decisions and service boundary definitions.

    Key entities include: **Student**, **Module**, **Venue**, **Timetable**, **Schedule Slot**, and **Preference**. Understanding how these relate is essential before reading the Functional Requirements or Architectural sections.

## Overview

The domain model describes every entity the system tracks, how those entities relate to each other, and what data each one carries. It is the shared vocabulary between the development team and the university - when the system talks about a *Module*, a *Timetable*, or a *Restriction*, this document defines exactly what that means.

The model is organised into four phases that mirror the planned build-out of the system. **Only Phase 1 is within the current implementation scope.** Phases 2–4 are preliminary sketches that will be revisited and likely redesigned as those features are built. They are included here to give clients a clear picture of the intended direction.

---

## How the Model is Structured

**Event-Calendar architecture.** Every item that can appear on a calendar - lectures, exams, labs, bootcamps - descends from a single abstract `Event` base. Academic events are linked to a `Module`; non-academic events (e.g. bootcamps, workshops) are not, and bypass the solver entirely.

**Calendar → Restrictions.** The abstract `Calendar` base owns a set of `Restriction` records (public holidays, recesses, exam periods, day-swaps). The `AcademicCalendar` extends `Calendar` and defines the valid scheduling window that the constraint solver must work within.

**Extensible JSONB fields.** Subtype-specific scheduling constraints are stored in a `criteria` field; supplementary resolved data in a `details` field. Both are schema-flexible - new constraint types can be added without a database migration.

**Phased migration.** Each phase diagram is additive - it shows only new entities and how they connect to existing ones. String fields that are promoted to proper foreign keys in later phases are noted explicitly.

---

## Phase 1 - Core Scheduling Domain

**Scope:** Demo 1 · Current implementation target

This phase captures the complete core of the system: users, the academic calendar, modules, events, enrolment, timetables, and the input/output pipeline. Everything the system needs to parse a timetable, solve it, and export it to a calendar is represented here.

![Core Domain Model](../diagrams/domain/Domain.drawio)

### Phase 1 - Entity Summary

| Package                    | Entities                                                       | Purpose                                                       |
| -------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| **User Management**        | User (abstract), Student, UniversityAdmin, SystemAdmin         | All actors in the system; role determines access rights       |
| **Institution & Calendar** | University, Calendar (abstract), AcademicCalendar, Restriction | Defines the valid scheduling framework per semester           |
| **Module**                 | Module                                                         | A taught subject; the anchor for all academic events          |
| **Events**                 | Event (abstract), Lecture, Tutorial, Lab, Test, Exam, Bootcamp | Everything that can appear on a timetable                     |
| **Enrolment**              | Enrollment, EnrollmentChoice                                   | Tracks which students are registered for which modules/groups |
| **Timetable**              | Timetable, TimetableEntry                                      | The solved or manually built schedule                         |
| **Export & Input**         | CalendarExport, ParseJob                                       | Handles PDF/API ingestion and calendar export output          |

---

## Phase 2 - Venue Entities

**Scope:** Planned future phase · Subject to redesign

This phase promotes the venue from a plain text string on a `TimetableEntry` to a first-class entity the solver can reason about - filtering venues by capacity, type, and equipment when assigning time slots.

**New entities:** `Venue`, `VenueCapacity`  
**Migration:** `TimetableEntry.resolvedVenue: String` → `resolvedVenueId: UUID (FK → Venue)`

**Figure 2 - Phase 2: Venue** 
- - -
## Phase 3 - Lecturer Entity & Student Preferences

**Scope:** Planned future phase · Subject to redesign

This phase adds two independent concerns: lecturer unavailability (hard constraints the solver must honour) and student scheduling preferences (soft and hard constraints the solver can optimise against).

**New entities:** `Lecturer`, `LecturerUnavailability`, `StudentPreference`, `PreferenceRule`  
**Migration:** Lecturer identifier in `Event.criteria` (JSONB) → `lecturerId: UUID (FK → Lecturer)` on Lecture, Tutorial, Lab, Test, Exam

---

## Phase 4 - Analytics

**Scope:** Rough sketch · Subject to redesign

This phase introduces derived reporting entities - data that is computed from Phase 1–3 records and stored for the university admin dashboard. Detailed attribute and relationship modelling is intentionally deferred until this subsystem is actively being built.

**New entities:** `VenueUtilization`, `LecturerWorkloadReport`, `AttendanceLog`
## Phase Overview

| Phase                    | Status                             | New Entities                                                                                                                                                                                                                                     | Key Migration                                                                                |
| ------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **1 - Core**             | Current scope                      | User, Student, UniversityAdmin, SystemAdmin, University, Calendar, AcademicCalendar, Restriction, Module, Event, Lecture, Tutorial, Lab, Test, Exam, Bootcamp, Enrollment, EnrollmentChoice, Timetable, TimetableEntry, CalendarExport, ParseJob | -                                                                                            |
| **2 - Venues**           | Future · subject to redesign       | Venue, VenueCapacity                                                                                                                                                                                                                             | `TimetableEntry.resolvedVenue: String` → `resolvedVenueId: UUID (FK → Venue)`                |
| **3 - Lecturer & Prefs** | Future · subject to redesign       | Lecturer, LecturerUnavailability, StudentPreference, PreferenceRule                                                                                                                                                                              | Lecturer identifier in `Event.criteria` → `lecturerId: UUID (FK)` on academic event subtypes |
| **4 -Analytics**         | Rough sketch · subject to redesign | VenueUtilization, LecturerWorkloadReport, AttendanceLog                                                                                                                                                                                          | -                                                                                            |

---

## Terminology Reference

| Term                  | Meaning                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Academic Calendar** | A semester-scoped calendar for one university. Defines the valid scheduling window and carries all restrictions.     |
| **Restriction**       | Any constraint on when events can be scheduled- public holidays, recesses, exam periods, day-swaps.                  |
| **Module**            | A taught subject (e.g. COS301). The anchor for all academic events.                                                  |
| **Event**             | Anything that can appear on a timetable. Academic events link to a Module; non-academic events do not.               |
| **TimetableEntry**    | A single resolved occurrence of an Event - a specific date, start time, duration, and venue.                         |
| **Timetable**         | A collection of TimetableEntries, owned by a Student, with a status (draft, generated, exported).                    |
| **ParseJob**          | A background job that processes a PDF or API data source and produces Module records.                                |
| **CalendarExport**    | A record of an export to Google Calendar or a downloaded `.ics` file.                                                |
| **EnrollmentChoice**  | A student's selection from the available groups or times for a module event (e.g. choosing Tutorial Group A over B). |
