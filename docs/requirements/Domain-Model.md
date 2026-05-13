# System Domain Model

The domain model provides a unified view of the UMTAS application domain. It describes every entity the system tracks, how those entities relate to each other, and what data each one carries. The model is shared vocabulary between the development team and the university — when we talk about a *Module*, a *Timetable*, or a *Restriction*, this document defines exactly what that means.

The model is organised into four phases that mirror the planned build-out of the system. **Only Phase 1 is within the current implementation scope** (Demo 1). Phases 2–4 are preliminary sketches that will be revisited and likely redesigned as those features are built. They are included here to give stakeholders a clear picture of the intended direction.

## Event-Calendar Architecture

Every item that can appear on a calendar — lectures, exams, labs, bootcamps, personal events — descends from a single abstract `Event` base class. This unified approach provides several key benefits:

**Academic events** (Lecture, Tutorial, Lab, Test, Exam) are linked to a `Module` via a foreign key and are governed by the `AcademicCalendar` and its `Restriction`s. The calendar defines the valid scheduling window — public holidays, exam periods, recesses, and even day-swaps — which the constraint solver must respect when generating a timetable.

**Non-academic events** (e.g. Bootcamp, personal events) extend `Event` without a module link and bypass the solver entirely, placed directly into timetables by users. This extensibility allows the system to handle institutional events (bootcamps, workshops, guest lectures) and personal student events without complex special-casing.

**Extensible JSONB fields** (`criteria` and `details`) store subtype-specific scheduling constraints and supplementary resolved data. New constraint types can be added without database migrations, supporting future phases and university-specific requirements.

---

## Phase 1 — Core Domain Model (Current Implementation)

**Scope:** Demo 1 · Current implementation target

This phase captures the complete core of the system: users, the academic calendar, modules, events, enrolment, timetables, and the input/output pipeline. Everything the system needs to parse a timetable, solve it, and export it to a calendar is represented here.

### Phase 1 Domain Model Diagram

```kroki-plantuml
@startuml UMTAS_Phase1_DomainModel
skinparam classAttributeIconSize 0
skinparam shadowing false
skinparam classBorderColor #4A90D9
skinparam classHeaderBackgroundColor #D6E8FF
skinparam packageBackgroundColor #FAFAFA
skinparam packageBorderColor #BBBBBB
skinparam arrowColor #555555
skinparam noteBorderColor #AAAAAA
skinparam noteBackgroundColor #FFFDE7

title UMTAS — Phase 1 Domain Model (Demo 1 Scope)

' ─── ENUMERATIONS ────────────────────────────────────────────────────────────

enum EventType {
    LECTURE
    TUTORIAL
    LAB
    TEST
    EXAM
    BOOTCAMP
}

enum RestrictionType {
    PUBLIC_HOLIDAY
    RECESS
    CLOSURE
    EXAM_PERIOD
    DAY_SWAP
}

enum TimetableStatus {
    DRAFT
    GENERATED
    MANUAL
    EXPORTED
}

enum TimetableSource {
    SOLVER
    MANUAL
    PDF_IMPORT
    API_IMPORT
}

enum ExportType {
    GOOGLE_CALENDAR
    ICS
}

enum JobStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
}

' ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

package "User Management" #EDE7F6 {

    abstract class User {
        +UUID id
        +String email
        +String displayName
        +String timezone
        +Timestamp createdAt
    }

    class Student {
        +String studentNumber
    }

    class UniversityAdmin {
        +String department
    }

    class SystemAdmin {
        +String accessLevel
    }

    User <|-- Student
    User <|-- UniversityAdmin
    User <|-- SystemAdmin
}

' ─── INSTITUTION & CALENDAR ──────────────────────────────────────────────────

package "Institution & Calendar" #E8F5E9 {

    class University {
        +UUID id
        +String name
        +String country
        +String emailDomain
    }

    abstract class Calendar {
        +UUID id
        +String name
        +String timezone
        +String regionCode
    }

    class AcademicCalendar {
        +Date semesterStart
        +Date semesterEnd
    }

    class Restriction {
        +UUID id
        +RestrictionType type
        +Date dateStart
        +Date dateEnd
        +Int sourceDayOfWeek
        +Int targetDayOfWeek
        +Object criteria
        +String label
    }

    Calendar <|-- AcademicCalendar
    Calendar "1" *-- "0..*" Restriction : restricts
    University "1" --> "1..*" AcademicCalendar : hosts
}

' ─── MODULE ──────────────────────────────────────────────────────────────────

package "Module" #FFFDE7 {

    class Module {
        +UUID id
        +String code
        +String name
        +String faculty
        +String semesterLabel
        +Int year
    }
}

AcademicCalendar "1" --> "0..*" Module : frames

' ─── EVENTS ──────────────────────────────────────────────────────────────────

package "Events" #FFF8E1 {

    abstract class Event {
        +UUID id
        +String title
        +EventType type
        +Boolean isCancelled
        +Object criteria
        +Object details
        +Timestamp createdAt
    }

    class Lecture {
        +UUID moduleId
    }

    class Tutorial {
        +UUID moduleId
    }

    class Lab {
        +UUID moduleId
    }

    class Test {
        +UUID moduleId
    }

    class Exam {
        +UUID moduleId
    }

    class Bootcamp {
    }

    Event <|-- Lecture
    Event <|-- Tutorial
    Event <|-- Lab
    Event <|-- Test
    Event <|-- Exam
    Event <|-- Bootcamp
}

Lecture "0..*" --> "1" Module : linkedTo
Tutorial "0..*" --> "1" Module : linkedTo
Lab "0..*" --> "1" Module : linkedTo
Test "0..*" --> "1" Module : linkedTo
Exam "0..*" --> "1" Module : linkedTo

' ─── ENROLMENT ───────────────────────────────────────────────────────────────

package "Enrolment" #F3E5F5 {

    class Enrollment {
        +UUID id
        +Timestamp enrolledAt
    }

    class EnrollmentChoice {
        +UUID id
        +ChoiceStatus status
        +Timestamp chosenAt
    }

    Enrollment "1" *-- "0..*" EnrollmentChoice : records
}

' ─── TIMETABLE ───────────────────────────────────────────────────────────────

package "Timetable" #E3F2FD {

    class Timetable {
        +UUID id
        +String title
        +TimetableStatus status
        +TimetableSource source
        +Timestamp createdAt
    }

    class TimetableEntry {
        +UUID id
        +Date resolvedDate
        +Time resolvedStartTime
        +Int resolvedDurationMins
        +String resolvedVenue
    }

    Timetable "1" *-- "0..*" TimetableEntry : contains
}

' ─── EXPORT & INPUT ──────────────────────────────────────────────────────────

package "Export & Input" #FBE9E7 {

    class CalendarExport {
        +UUID id
        +ExportType exportType
        +ExportStatus status
        +String exportUrl
        +Timestamp createdAt
    }

    class ParseJob {
        +UUID id
        +String sourceType
        +String sourceFile
        +JobStatus status
        +String errorMessage
        +Timestamp createdAt
    }
}

' ─── CROSS-PACKAGE RELATIONSHIPS ─────────────────────────────────────────────

Student "1" --> "0..*" Enrollment : enrolledIn
Module "1" --> "0..*" Enrollment : attracts
EnrollmentChoice "0..*" --> "1" Event : selects
Student "1" --> "0..*" Timetable : owns
Timetable "0..*" --> "1" AcademicCalendar : within
TimetableEntry "0..*" --> "1" Event : places
Timetable "1" --> "0..*" CalendarExport : exportedAs
AcademicCalendar "1" --> "0..*" ParseJob : populatedBy
ParseJob "1" --> "0..*" Module : produces

@enduml
```

### Phase 1 — Entity Summary

| Package | Entities | Purpose |
|---------|----------|---------|
| **User Management** | User (abstract), Student, UniversityAdmin, SystemAdmin | All actors in the system; role determines access rights |
| **Institution & Calendar** | University, Calendar (abstract), AcademicCalendar, Restriction | Defines the valid scheduling framework per semester |
| **Module** | Module | A taught subject; the anchor for all academic events |
| **Events** | Event (abstract), Lecture, Tutorial, Lab, Test, Exam, Bootcamp | Everything that can appear on a timetable |
| **Enrolment** | Enrollment, EnrollmentChoice | Tracks which students are registered for which modules/groups |
| **Timetable** | Timetable, TimetableEntry | The solved or manually built schedule |
| **Export & Input** | CalendarExport, ParseJob | Handles PDF/API ingestion and calendar export output |

---

!!! info "Implementation scope"
    
    Only Phase 1 is implemented for Demo 1. Phases 2, 3, and 4 below represent planned future work and are subject to redesign as features are developed.

---

## Phase 2 — Extended Domain (Planned)

**Scope:** Planned future phase · Subject to redesign

This phase promotes the venue from a plain text string on a `TimetableEntry` to a first-class entity the solver can reason about — filtering venues by capacity, type, and equipment when assigning time slots.

**New entities:** `Venue`, `VenueCapacity`

**Database migration:** `TimetableEntry.resolvedVenue: String` → `resolvedVenueId: UUID (foreign key → Venue)`

This allows the constraint solver to apply venue-specific constraints such as capacity requirements, accessibility needs, and equipment availability.

---

## Phase 3 — Analytics Domain (Planned)

**Scope:** Planned future phase · Subject to redesign

This phase adds lecturer management and student scheduling preferences as first-class entities.

**New entities:** `Lecturer`, `LecturerUnavailability`, `StudentPreference`, `PreferenceRule`

**Database migration:** Lecturer identifier in `Event.criteria` (JSONB) → `lecturerId: UUID (foreign key)` on academic event subtypes

This enables the solver to honour lecturer availability constraints and optimise student schedules against preferences (e.g. minimise gaps, prefer morning lectures, avoid early starts).

---

## Phase 4 — Simulation Domain (Planned)

**Scope:** Rough sketch · Subject to redesign

This phase introduces derived reporting entities — data computed from Phase 1–3 records and stored for the university admin dashboard.

**New entities:** `VenueUtilization`, `LecturerWorkloadReport`, `AttendanceLog`

Detailed attribute and relationship modelling is intentionally deferred until this subsystem is actively being built.

---

## Cross-Subsystem Relationships

The domain model enforces a core design rule: **each class belongs to exactly one subsystem (package)**. Any interaction a subsystem requires on a class from another subsystem is realised as a directed association (cross-package arrow in the diagram) and, at runtime, by a NestJS service call or database join.

**Key cross-package dependencies:**

- **User → Timetable:** Students own zero or more timetables; these are private to the user until exported
- **Module → Event:** Academic events (Lecture, Tutorial, Lab, Test, Exam) are always linked to a module via foreign key
- **AcademicCalendar → Module:** Each calendar frames the modules valid for its semester
- **AcademicCalendar → Restriction:** Restrictions define the scheduling boundaries (holidays, recesses, exam periods) the solver must respect
- **Timetable ↔ Event:** TimetableEntry is the junction — it associates a resolved calendar occurrence of an Event to a specific Timetable
- **ParseJob → Module:** A completed parse job produces Module records that populate the calendar's module set
- **CalendarExport ← Timetable:** Export records track where a Timetable has been sent (Google Calendar, downloaded .ics file, etc.)

---

## Terminology Reference

| Term | Meaning |
|------|---------|
| **AcademicCalendar** | A semester-scoped calendar for one university. Defines the valid scheduling window and carries all restrictions. |
| **Restriction** | Any constraint on when events can be scheduled — public holidays, recesses, exam periods, day-swaps. |
| **Module** | A taught subject (e.g. COS301). The anchor for all academic events. |
| **Event** | Anything that can appear on a timetable. Academic events link to a Module; non-academic events do not. |
| **TimetableEntry** | A single resolved occurrence of an Event — a specific date, start time, duration, and venue. |
| **Timetable** | A collection of TimetableEntries, owned by a Student, with a status (draft, generated, exported). |
| **ParseJob** | A background job that processes a PDF or API data source and produces Module records. |
| **CalendarExport** | A record of an export to Google Calendar or a downloaded `.ics` file. |
| **EnrollmentChoice** | A student's selection from the available groups or times for a module event (e.g. choosing Tutorial Group A over B). |
