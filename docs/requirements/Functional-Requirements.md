# Functional Requirements

The functional requirements define the core capabilities and features of the UMTAS system. Requirements are organized by subsystem and assigned unique identifiers (R{subsystem}.{number}) for traceability against use cases and test cases. Each requirement is mapped to the Traceability Matrix to ensure comprehensive test coverage.

## Base Features

These features are fundamental to all user roles and must be implemented by all development teams.

### Registration & Login

- **R0.1:** The system shall allow users to register with email and password.
- **R0.2:** The system shall allow users to log in with registered credentials.
- **R0.3:** The system shall manage user sessions securely and allow logout.

### Basic Themes

- **R0.4:** The system shall support light and dark theme options.
- **R0.5:** The system shall persist theme preferences per user.

### Form Validation

- **R0.6:** The system shall validate all user input on the client side before submission.
- **R0.7:** The system shall validate all user input on the server side for security.
- **R0.8:** The system shall display clear error messages for validation failures.

---

## Subsystem Requirements

### R1: Timetable Core Engine

**R1.1: Information Website**

- **R1.1.1:** The system shall provide a landing page for all users prior to login/register.
- **R1.1.2:** The landing page shall present system functionalities to entice users.

**R1.2: Login and Register System**

- **R1.2.1:** The system shall allow users to log in.
- **R1.2.2:** The system shall allow users to register.
- **R1.2.3:** The system shall manage user sessions.

---

### R2: Student Subsystem

**R2.1: Timetable Management**

- **R2.1.1:** The system shall allow students to view timetables.
- **R2.1.2:** The system shall allow students to update timetables.
- **R2.1.3:** The system shall allow students to delete timetables.

**R2.2: Timetable Creation — Builder**

- **R2.2.1:** The system shall allow students to create new timetables.
- **R2.2.2:** The system shall provide semester control for timetables.
- **R2.2.3:** The system shall allow timetable customisation.

**R2.3: Timetable Creation — PDF System**

- **R2.3.1:** The system shall automate timetable creation using a PDF if provided by a university of all classes.
- **R2.3.2:** The system shall allow user modification of PDF-generated timetables.
- **R2.3.3:** The system shall allow semester control of PDF-Generated timetables.

**R2.4: Timetable Creation — API System**

- **R2.4.1:** The system shall automate timetable creation using a school-provided API (if applicable).
- **R2.4.2:** The system shall allow user customisation of API-generated timetables.

**R2.5: Calendar Exporting**

- **R2.5.1:** The system shall allow export of timetables as `.ics` files for calendar import.
- **R2.5.2:** The system shall allow direct sync with Google Calendar.

---

### R3: University Admin Dashboard and Analytics

**R3.1: Analytics System**

- **R3.1.1:** The system shall allow university admins to view registered students for a module time slot.
- **R3.1.2:** The system shall allow university admins to view actual attendance for a module time slot.
- **R3.1.3:** The system shall allow university admins to view projected attendance (user submitted).

---

### R4: Tyto Analytics Layer

**R4.1: Simulation System**

- **R4.1.1:** The system shall support 20,000+ simulations to evaluate efficiency.
- **R4.1.2:** The system shall provide a dashboard to view analytics under simulation load.
- **R4.1.3:** The system shall use authentication distinct from student and admin roles.

---

### R5: User and Authentication Subsystem

> **TODO:** User and Authentication subsystem functional requirements to be extracted from UMTAS-Living-SRS-Document.md §9 when complete. Placeholder requirements:

- **R5.1:** The system shall support password-based authentication.
- **R5.2:** The system shall support OAuth-based authentication via Google.
- **R5.3:** The system shall support role-based access control (RBAC).

---

### R6: PDF Input Adapter

> **TODO:** PDF Input Adapter functional requirements to be extracted from UMTAS-Living-SRS-Document.md §5 when complete. Placeholder requirements:

- **R6.1:** The system shall parse PDF timetables.
- **R6.2:** The system shall extract module, venue, and time slot data from PDFs.
- **R6.3:** The system shall handle parsing errors gracefully.

---

### R7: API Input Adapter

> **TODO:** API Input Adapter functional requirements to be extracted from UMTAS-Living-SRS-Document.md §5 when complete. Placeholder requirements:

- **R7.1:** The system shall integrate with university-provided APIs.
- **R7.2:** The system shall normalize API data into internal data model.
- **R7.3:** The system shall sync data from external APIs on a scheduled basis.

---

### R8: Calendar Export Subsystem

> **TODO:** Calendar Export Subsystem functional requirements to be extracted from UMTAS-Living-SRS-Document.md §5 when complete. Placeholder requirements:

- **R8.1:** The system shall export timetables as iCalendar (ICS) format.
- **R8.2:** The system shall support one-way sync to Google Calendar.
- **R8.3:** The system shall handle export errors and retry logic.

---

## Requirements Traceability

For the complete traceability of functional requirements to use cases, refer to the [Traceability Matrix](Traceability-Matrix.md).
