# Functional Requirements

## Authentication and Accounts

| **ID** | **Requirement** |
|---|---|
| **FR-1** | The system shall allow a user to register with a supported email address and password. |
| **FR-2** | The system shall create an authenticated session when a registered user supplies valid credentials. |
| **FR-3** | The system shall invalidate the active session when an authenticated user signs out. |
| **FR-4** | The system shall support email verification and password reset. |
| **FR-5** | The system shall support Google sign-in and account linking. |
| **FR-6** | The system shall allow an authenticated user to list and revoke their sessions. |
| **FR-7** | The system shall allow an authenticated user to select a university context. |

## Universities and Roles

| **ID** | **Requirement** |
|---|---|
| **FR-8** | The system shall list universities available to the authenticated user. |
| **FR-9** | The system shall return the authenticated user's role for a selected university. |
| **FR-10** | The system shall allow a user to apply for a student, lecturer, or university-administrator role. |
| **FR-11** | The system shall allow an authorised university administrator to list and decide university role applications. |
| **FR-12** | The system shall allow a system administrator to create, update, and delete universities. |

## Courses, Modules, and Builder

| **ID** | **Requirement** |
|---|---|
| **FR-13** | The system shall allow an authorised user to create, update, list, and delete courses. |
| **FR-14** | The system shall allow an authorised user to create, update, list, and delete modules. |
| **FR-15** | The system shall allow modules to be organised into reusable groupings. |
| **FR-16** | The system shall preserve course-to-module metadata, including core status, semester of study, and year of study. |
| **FR-17** | The system shall allow a student to create, update, list, and delete student-owned modules. |
| **FR-18** | The system shall allow a user to store personal styling for a module. |
| **FR-19** | The system shall allow an authorised university administrator to mark imported modules as validated. |

## Events and Timetables

| **ID** | **Requirement** |
|---|---|
| **FR-20** | The system shall allow an authenticated user to create personal events with valid scheduling criteria. |
| **FR-21** | The system shall allow authorised users to create university events linked to a module. |
| **FR-22** | The system shall list events visible to the authenticated user and support filtering by module. |
| **FR-23** | The system shall allow an authorised user to update or delete an event. |
| **FR-24** | The system shall allow an authorised university administrator to mark imported events as validated. |
| **FR-25** | The system shall allow a user to create a named timetable containing selected events. |
| **FR-26** | The system shall list timetables owned by the authenticated user. |
| **FR-27** | The system shall allow a timetable owner to retrieve, update, or delete a timetable. |

## Attendance

| **ID** | **Requirement** |
|---|---|
| **FR-28** | The system shall allow a student to record an attendance state for an event on a specific date. |
| **FR-29** | The system shall allow a student to list, retrieve, update, and delete attendance records. |

## PDF Import

| **ID** | **Requirement** |
|---|---|
| **FR-30** | The system shall accept a PDF of no more than 25 MiB for an authenticated user and selected university. |
| **FR-31** | The system shall reject an invalid file, university identifier, adapter, or fingerprint with a descriptive error. |
| **FR-32** | The system shall enqueue valid parsing work and return a job identifier without holding the request open. |
| **FR-33** | The system shall expose queued, completed, and failed parse states with structured failure details. |
| **FR-34** | The system shall reuse a matching queued or completed import for the same user and university. |
| **FR-35** | The system shall import parser output immediately after a successful authenticated worker callback. |
| **FR-36** | The system shall create or reuse matching modules, events, venues, and a module grouping without duplicating equivalent data. |
| **FR-37** | The system shall mark newly imported modules and events as unvalidated until administrator approval. |

## Timetable Solver

| **ID** | **Requirement** |
|---|---|
| **FR-38** | The system shall accept a solver profile, solve mode, and engine choice from an authenticated user. |
| **FR-39** | The system shall support independent CP-SAT and genetic algorithm engines. |
| **FR-40** | In automatic mode, the system shall run CP-SAT first and run the genetic algorithm only when CP-SAT reports infeasibility. |
| **FR-41** | The system shall enqueue valid solver work and return a job identifier without holding the request open. |
| **FR-42** | The system shall expose queued, completed, and failed solver states with structured failure details. |
| **FR-43** | The system shall reuse an equivalent current solver job for the same user. |
| **FR-44** | CP-SAT shall return a conflict-free result or report that no feasible result exists. |
| **FR-45** | Genetic search shall return a single-objective best-effort result and identify any remaining conflicts. |

## Calendar Export

| **ID** | **Requirement** |
|---|---|
| **FR-46** | The frontend shall generate and download an iCalendar file from the displayed timetable. |

## Future Scope

- Persisted student and lecturer scheduling preferences.
- Dedicated lecturer, venue, semester, academic-calendar, and invitation workflows.
- Private university workspaces.
- Google Calendar, live-feed, and provider-reconciliation workflows.
- Advanced analytics, Tyto simulation, institutional master scheduling, and persisted audit records.
