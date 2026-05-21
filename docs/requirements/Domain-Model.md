# Domain Model

!!! abstract "Section Brief"
    The domain model defines the core entities, relationships, and bounded contexts of UMTAS. It establishes the shared conceptual vocabulary between the development team and the university, and directly underpins all database schema and service boundary decisions.

    Key entities: **User**, **Module**, **Event**, **EventCriteria**, **Lecture**, **Timetable**.

---

## Overview

The domain model describes every entity the system tracks, how those entities relate, and what data each carries. **The core scheduling domain is within the current implementation scope.** Future phases covering venues, lecturers, preferences, and analytics are preliminary sketches that will be revisited as those features are built.

**Event hierarchy.** Every item that can appear on a timetable descends from a single abstract `Event` base, which carries an embedded `EventCriteria` value object storing scheduling details. Only `Lecture` is implemented in the current scope.

**Role-based user model.** `User` carries a `role` discriminator (`STUDENT`, `UNI_ADMIN`, `SYS_ADMIN`) enforced at the API boundary.

**Extensible criteria.** `EventCriteria` is stored as JSONB - new scheduling metadata can be added without a database migration.

---

## Implemented - Core Scheduling Domain

!!! success "Demo 1 - Implemented"
    A user creates `Module` records for their enrolled courses, attaches `Lecture` events carrying an `EventCriteria` value object, and groups events into named `Timetable` collections.

![Domain Model](../diagrams/domain/Domain.svg)

### Entity Summary

| Package | Entities | Purpose |
| :--- | :--- | :--- |
| **User Management** | User (abstract), Student, UniversityAdmin, SystemAdmin | All actors in the system; role governs access rights |
| **Module** | Module | A taught subject (e.g. COS301); the anchor for academic events |
| **Events** | Event (abstract), EventCriteria (value object), Lecture | Everything that can appear on a timetable |
| **Timetable** | Timetable | A named collection of events forming a student's personal schedule |

---

## Future Plans

!!! failure "Not Implemented - Subject to Redesign"
    The following extensions are planned for future phases. They are included here to give clients a clear picture of the intended direction.

??? failure "Venue Entities"

    Promotes venue from a plain text string to a first-class `Venue` entity the solver can filter by capacity, type, and equipment.

    **New entities:** `Venue`, `VenueCapacity`  
    **Migration:** `EventCriteria.venue : String` → `resolvedVenueId : UUID (FK → Venue)`

??? failure "Lecturer & Preferences"

    Adds lecturer unavailability (hard solver constraints) and student scheduling preferences (soft/hard constraints). Expands the event hierarchy with Tutorial, Lab, Test, and Exam subtypes.

    **New entities:** `Lecturer`, `LecturerUnavailability`, `StudentPreference`, `PreferenceRule`, `Tutorial`, `Lab`, `Test`, `Exam`  
    **Migration:** Lecturer identifier in `EventCriteria` (JSONB) → `lecturerId : UUID (FK → Lecturer)`

??? failure "Analytics"

    Introduces derived reporting entities computed from existing data for the admin dashboard. Detailed modelling is deferred until this subsystem is built.

    **New entities:** `VenueUtilization`, `LecturerWorkloadReport`, `AttendanceLog`

---

## Terminology Reference

| Term | Meaning |
| :--- | :--- |
| **User** | Any authenticated actor. Role (`STUDENT`, `UNI_ADMIN`, `SYS_ADMIN`) governs access at the API boundary. |
| **Module** | A taught subject (e.g. COS301). The anchor for all academic events. |
| **Event** | Abstract base for anything that appears on a timetable. Carries an embedded `EventCriteria` value object. |
| **EventCriteria** | JSONB value object embedded in `Event`. Stores type, day, start/end time, venue, and module code. |
| **Lecture** | The only concrete `Event` subtype in the current implementation. Identified by `EventCriteria.type = LECTURE`. |
| **Timetable** | A named collection of events owned by a user (e.g. "Semester 1"). |
| **EventType** | Enumeration inside `EventCriteria`. Currently `LECTURE` only; extended in future phases. |