# Functional Requirements

!!! abstract "Section Brief"
    Functional requirements specify the observable behaviors the system must exhibit. Each requirement is uniquely identified (R*x*.*y*), assigned to a sub-system, and traceable to a use case via the [Traceability Matrix](Traceability-Matrix.md). Requirements follow the IEEE 830 *"the system shall..."* convention.

    **Sub-systems covered:** Core Optimizer · API Core · Frontend · Authentication

---

The following functional requirements describe the high-level capabilities of the system. With more depth provided in developed systems

---
## R1: External Layer

### R1.1 Information Website
- **R1.1.1:** The system shall provide a landing page for all users prior to login/register.  
- **R1.1.2:** The landing page shall present system functionalities to entice users.  

### R1.2 Login and Register System
- **R1.2.1:** The system shall allow users to log in.  
- **R1.2.2:** The system shall allow users to register.  
- **R1.2.3:** The system shall manage user sessions.  

---

## R2: Student Layer

### R2.1 Timetable Management
- **R2.1.1:** The system shall allow students to view timetables.  
- **R2.1.2:** The system shall allow students to update timetables.  
- **R2.1.3:** The system shall allow students to delete timetables.  

### R2.2 Timetable Creation – Builder
- **R2.2.1:** The system shall allow students to create new timetables.  
- **R2.2.2:** The system shall provide semester control for timetables.  
- **R2.2.3:** The system shall allow timetable customisation.  

### R2.3 Timetable Creation – PDF System
- **R2.3.1:** The system shall automate timetable creation using a PDF if provided by a university of all classes.  
- **R2.3.2:** The system shall allow user modification of PDF‑generated timetables.  
- **R2.3.3:** The system shall allow semester control of PDF‑generated timetables.  

### R2.4 Timetable Creation – API System
- **R2.4.1:** The system shall automate timetable creation using a school‑provided API (if applicable).  
- **R2.4.2:** The system shall allow user customisation of API‑generated timetables.  

### R2.5 Calendar Exporting
- **R2.5.1:** The system shall allow export of timetables as `.ics` files for calendar import.  
- **R2.5.2:** The system shall allow direct sync with Google Calendar.  
  - **R2.5.2.1:** The system shall support creating a Google Calendar instance.  

---

## R3: University Layer

### R3.1 Analytics System
- **R3.1.1:** The system shall allow university admins to view registered students for a module time slot.  
- **R3.1.2:** The system shall allow university admins to view actual attendance for a module time slot.  
- **R3.1.3:** The system shall allow university admins to view projected attendance (user submitted).  

---
## R4: Tyto Analytics Layer

### R4.1 Simulation System
- **R4.1.1:** The system shall support 20,000+ simulations to evaluate efficiency.  
- **R4.1.2:** The system shall provide a dashboard to view analytics under simulation load.  
- **R4.1.3:** The system shall use authentication distinct from student and admin roles.  
