# Domain Model

!!! abstract "Section Brief"
    The domain model defines the core entities, relationships, and bounded contexts of UMTAS. It establishes the shared conceptual vocabulary between business stakeholders and the engineering team, and directly underpins all database schema decisions and service boundary definitions.

    Key entities include: **User** (Student, UniversityAdmin, SystemAdmin), **Module**, **Event**, **Lecture**, and **Timetable**. Understanding how these relate is essential before reading the Functional Requirements or Architectural sections.

## Overview

The domain model describes every entity the system tracks, how those entities relate to each other, and what data each one carries. It is the shared vocabulary between the development team and the university — when the system talks about a *Module*, a *Timetable*, or a *Lecture*, this document defines exactly what that means.

The model is organised into four phases that mirror the planned build-out of the system. **Only Phase 1 is within the current implementation scope.** Phases 2–4 are preliminary sketches that will be revisited and likely redesigned as those features are built. They are included here to give clients a clear picture of the intended direction.

---

## How the Model is Structured

**Event hierarchy.** Every item that can appear on a timetable descends from a single abstract `Event` base. The `Event` carries an embedded `EventCriteria` value object that stores the scheduling details (day, start/end time, venue). Only `Lecture` is implemented as a concrete subtype in Phase 1. Future phases will add Tutorial, Lab, Test, and Exam.

**Extensible JSONB criteria.** The `criteria` field on `Event` is stored as JSONB and is schema-flexible — new constraint types or scheduling metadata can be added without a database migration.

**Role-based user model.** The `User` entity carries a `role` discriminator (`STUDENT`, `UNI_ADMIN`, `SYS_ADMIN`) that is enforced at the API boundary. Specialized roles are modelled as subtypes of the abstract `User` base, each with their own access rights.

**Phased migration.** Each phase diagram is additive — it shows only new entities and how they connect to existing ones. String fields that are promoted to proper foreign keys in later phases are noted explicitly.

---

## Phase 1 — Core Scheduling Domain

**Scope:** Demo 1 · Current implementation

This phase establishes the core user, module, event, and timetable model. A user creates `Module` records representing their enrolled courses, attaches `Lecture` events to those modules, and groups events into named `Timetable` collections.
![Domain Model Diagram](/docs/diagrams/domain/Domain.drawio)

### Phase 1 — Entity Summary

| Package             | Entities                                               | Purpose                                                                             |
| ------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| **User Management** | User (abstract), Student, UniversityAdmin, SystemAdmin | All actors in the system. Role determines access rights                             |
| **Module**          | Module                                                 | A taught subject (e.g. COS301). The anchor for academic events                      |
| **Events**          | Event (abstract), EventCriteria (value object), Lecture | Everything that can appear on a timetable. Criteria stores scheduling constraints   |
| **Timetable**       | Timetable                                              | A named collection of events that forms a student's personal schedule               |

---

??? failure "Phase 2 — Venue Entities · Planned future phase"

    **Scope:** Planned future phase · Subject to redesign

    This phase promotes the venue from a plain text string on `Lecture` and `EventCriteria` to a first-class entity the solver can reason about — filtering venues by capacity, type, and equipment when assigning time slots.

    **New entities:** `Venue`, `VenueCapacity`  
    **Migration:** `Lecture.venue : String` → `resolvedVenueId : UUID (FK → Venue)`

??? failure "Phase 3 — Lecturer Entity & Student Preferences · Planned future phase"

    **Scope:** Planned future phase · Subject to redesign

    This phase adds two independent concerns: lecturer unavailability (hard constraints the solver must honour) and student scheduling preferences (soft and hard constraints the solver can optimise against). It also expands the `Event` hierarchy with Tutorial, Lab, Test, and Exam subtypes.

    **New entities:** `Lecturer`, `LecturerUnavailability`, `StudentPreference`, `PreferenceRule`, `Tutorial`, `Lab`, `Test`, `Exam`  
    **Migration:** Lecturer identifier in `EventCriteria` (JSONB) → `lecturerId : UUID (FK → Lecturer)` on academic event subtypes

??? failure "Phase 4 — Analytics · Rough sketch"

    **Scope:** Rough sketch · Subject to redesign

    This phase introduces derived reporting entities — data that is computed from Phase 1–3 records and stored for the university admin dashboard. Detailed attribute and relationship modelling is intentionally deferred until this subsystem is actively being built.

    **New entities:** `VenueUtilization`, `LecturerWorkloadReport`, `AttendanceLog`

---

## Phase Overview

| Phase                    | Status                             | New Entities                                                                                    | Key Migration                                                                                      |
| ------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **1 — Core**             | Current scope                      | User, Student, UniversityAdmin, SystemAdmin, Module, Event, EventCriteria, Lecture, Timetable   | —                                                                                                  |
| **2 — Venues**           | Future · subject to redesign       | Venue, VenueCapacity                                                                            | `Lecture.venue : String` → `resolvedVenueId : UUID (FK → Venue)`                                  |
| **3 — Lecturer & Preferences** | Future · subject to redesign       | Lecturer, LecturerUnavailability, StudentPreference, PreferenceRule, Tutorial, Lab, Test, Exam  | Lecturer identifier in `EventCriteria` → `lecturerId : UUID (FK)` on academic event subtypes      |
| **4 — Analytics**        | Rough sketch · subject to redesign | VenueUtilization, LecturerWorkloadReport, AttendanceLog                                         | —                                                                                                  |

---

## Terminology Reference

| Term              | Meaning                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **User**          | Any authenticated actor in the system. Carries a role (`STUDENT`, `UNI_ADMIN`, `SYS_ADMIN`) that governs access rights.       |
| **Module**        | A taught subject (e.g. COS301). The anchor for all academic events, owned by a user.                                          |
| **Event**         | The abstract base for anything that can appear on a timetable. Carries an embedded `EventCriteria` value object.              |
| **EventCriteria** | A JSONB value object embedded in `Event`. Stores the scheduling details: type, day, start/end time, venue, and module code.    |
| **Lecture**       | The concrete event subtype implemented in Phase 1. Links an `Event` to a `Module` and carries a resolved venue string.        |
| **Timetable**     | A named collection of events owned by a user (e.g. "Semester 1"). Groups events into a personal schedule.                     |
| **UserRole**      | Enumeration of actor types: `STUDENT`, `UNI_ADMIN`, `SYS_ADMIN`. Enforced at the API boundary via role guards.                |
| **EventType**     | Enumeration stored inside `EventCriteria`. Currently only `LECTURE`. Extended in Phase 3 with Tutorial, Lab, Test, Exam.       |
