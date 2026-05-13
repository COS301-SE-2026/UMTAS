# User Stories and User Characteristics

The system serves several distinct user types, each interacting with the platform in different ways with different expectations and technical capabilities. This section defines those roles and captures their primary user stories.

## User Roles Overview

| Role | Description | Access Level |
|---|---|---|
| **Student** | Enrolled learner accessing and managing personal timetables, viewing schedules, setting preferences, and exporting to external calendars | Basic |
| **Lecturer** | Academic staff member whose availability and preferences influence the timetable; can view assigned schedules and indicate unavailable time slots | Intermediate |
| **University Administrator** | Institutional manager responsible for uploading institutional data (PDFs), configuring constraints, monitoring analytics, and approving schedules | Advanced |
| **System Administrator** | Technical operator responsible for deploying new university adapter instances, maintaining infrastructure, and monitoring system health | Full |
| **University API Integration** | External actor representing institutional data systems; integrates via adapter pattern without direct UI access | API |

---

## Student

**Description:** A student enrolled at a university that uses the system to access and personalise their academic timetable.

**Characteristics:**

- Varying levels of technical proficiency; the interface must be simple and intuitive.
- Primarily interested in viewing their personalised schedule and exporting it to their preferred calendar application.
- May set preferences such as minimising gaps between classes or avoiding early morning lectures.

**User Stories:**

- As a student, I want to view my generated timetable so that I can plan my academic week.
- As a student, I want to export my timetable to Google Calendar so that I can receive reminders for my lectures.
- As a student, I want to export my timetable as an `.ics` file so that I can import it into any calendar application.
- As a student, I want to set personal preferences (e.g. prefer morning lectures, minimise gaps) so that the system generates the most suitable schedule for me.

---

## Lecturer

**Description:** An academic staff member whose availability and preferences influence the timetable.

**Characteristics:**

- Moderate technical proficiency.
- Interested in ensuring their scheduled lectures do not conflict with other commitments.
- May have venue or time preferences.

**User Stories:**

- As a lecturer, I want to view my assigned lecture schedule so that I can plan my week accordingly.
- As a lecturer, I want to indicate my unavailable time slots so that the system avoids scheduling lectures during those periods.

---

## University Administrator

**Description:** A staff member responsible for managing and approving the institutional timetable and monitoring resource usage.

**Characteristics:**

- High technical proficiency and familiarity with scheduling constraints.
- Responsible for configuring the system with venues, time slots, modules, and lecturer assignments.
- Interested in analytics such as venue utilisation, overcapacity alerts, and schedule conflict reports.

**User Stories:**

- As a university administrator, I want to upload an existing timetable PDF so that the system can parse and use it as input for schedule generation.
- As a university administrator, I want to view venue utilisation analytics so that I can identify underused or overbooked rooms.
- As a university administrator, I want to reallocate a venue for a lecture so that scheduling conflicts can be resolved.
- As a university administrator, I want to trigger timetable generation with defined constraints so that an optimised schedule is produced automatically.

---

## System Administrator

**Description:** A technical operator responsible for system health, access management, and configuration of adapters for new university deployments.

**Characteristics:**

- High technical proficiency.
- Responsible for deploying new university adapter instances and maintaining system infrastructure.

**User Stories:**

- As a system administrator, I want to configure a new university adapter so that a new institution can be onboarded to the platform.
- As a system administrator, I want to monitor system performance metrics so that I can proactively identify and resolve issues.

---

## University API Integration

**Description:** An external institutional system that provides timetable data to UMTAS for processing and integration.

**Interaction Points:**

The University API Integration actor does not have direct UI access but interacts via the API Input Adapter subsystem. The adapter pattern ensures that each university's unique data format and API specification is encapsulated in a dedicated child adapter class, allowing the core system to remain agnostic to institutional specifics.
