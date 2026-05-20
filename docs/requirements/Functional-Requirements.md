# Functional Requirements

!!! abstract "Section Brief"
    Functional requirements specify the observable behaviours the system must exhibit. Each requirement is uniquely identified (R*x*.*y*), assigned to a sub-system, and traceable to a use case via the [Traceability Matrix](Traceability-Matrix.md). Requirements follow the IEEE 830 *"the system shall..."* convention.

    **Sub-systems covered:** Core Optimizer · API Core · Frontend · Authentication

    **Demo 1 coverage:** :material-check-circle:{ style="color: #4caf50" } Implemented · :material-circle-half-full:{ style="color: #ff9800" } Partially implemented · :material-close-circle:{ style="color: #e53935" } Not implemented

---

The following functional requirements describe the high-level capabilities of the system. With more depth provided in developed systems

---
## R1: External Layer

### R1.1 Information Website

!!! failure "Demo 1 - Not Implemented"
    No requirements in this sub-system were implemented for Demo 1.

- **R1.1.1** :material-close-circle:{ style="color: #e53935" } The system shall provide a landing page for all users prior to login/register.  
- **R1.1.2** :material-close-circle:{ style="color: #e53935" } The landing page shall present system functionalities to entice users.  

### R1.2 Login and Register System

!!! success "Demo 1 - Fully Implemented"
    All requirements in this sub-system were implemented for Demo 1.

- **R1.2.1** :material-check-circle:{ style="color: #4caf50" } The system shall allow users to log in.  
- **R1.2.2** :material-check-circle:{ style="color: #4caf50" } The system shall allow users to register.  
- **R1.2.3** :material-check-circle:{ style="color: #4caf50" } The system shall manage user sessions.  

---

## R2: Student Layer

### R2.1 Timetable Management

!!! success "Demo 1 - Fully Implemented"
    All requirements in this sub-system were implemented for Demo 1.

- **R2.1.1** :material-check-circle:{ style="color: #4caf50" } The system shall allow students to view timetables.  
- **R2.1.2** :material-check-circle:{ style="color: #4caf50" } The system shall allow students to update timetables.  
- **R2.1.3** :material-check-circle:{ style="color: #4caf50" } The system shall allow students to delete timetables.  

### R2.2 Timetable Creation – Builder

!!! warning "Demo 1 - Partially Implemented"
    **Implemented:** R2.2.1

    **Partially implemented:** R2.2.3

    **Not implemented:** R2.2.2

- **R2.2.1** :material-check-circle:{ style="color: #4caf50" } The system shall allow students to create new timetables.  
- **R2.2.2** :material-close-circle:{ style="color: #e53935" } The system shall provide semester control for timetables.  
- **R2.2.3** :material-circle-half-full:{ style="color: #ff9800" } The system shall allow timetable customisation.  

### R2.3 Timetable Creation – PDF System

!!! failure "Demo 1 - Not Implemented"
    No requirements in this sub-system were implemented for Demo 1.

- **R2.3.1** :material-close-circle:{ style="color: #e53935" } The system shall automate timetable creation using a PDF if provided by a university of all classes.  
- **R2.3.2** :material-close-circle:{ style="color: #e53935" } The system shall allow user modification of PDF‑generated timetables.  
- **R2.3.3** :material-close-circle:{ style="color: #e53935" } The system shall allow semester control of PDF‑generated timetables.  

### R2.4 Timetable Creation – API System

!!! failure "Demo 1 - Not Implemented"
    No requirements in this sub-system were implemented for Demo 1.

- **R2.4.1** :material-close-circle:{ style="color: #e53935" } The system shall automate timetable creation using a school‑provided API (if applicable).  
- **R2.4.2** :material-close-circle:{ style="color: #e53935" } The system shall allow user customisation of API‑generated timetables.  

### R2.5 Calendar Exporting

!!! warning "Demo 1 - Partially Implemented"
    **Implemented:** R2.5.1

    **Not implemented:** R2.5.2 · R2.5.2.1

- **R2.5.1** :material-check-circle:{ style="color: #4caf50" } The system shall allow export of timetables as `.ics` files for calendar import.  
- **R2.5.2** :material-close-circle:{ style="color: #e53935" } The system shall allow direct sync with Google Calendar.  
  - **R2.5.2.1** :material-close-circle:{ style="color: #e53935" } The system shall support creating a Google Calendar instance.  

---

## R3: University Layer

### R3.1 Analytics System

!!! failure "Demo 1 - Not Implemented"
    No requirements in this sub-system were implemented for Demo 1.

- **R3.1.1** :material-close-circle:{ style="color: #e53935" } The system shall allow university admins to view registered students for a module time slot.  
- **R3.1.2** :material-close-circle:{ style="color: #e53935" } The system shall allow university admins to view actual attendance for a module time slot.  
- **R3.1.3** :material-close-circle:{ style="color: #e53935" } The system shall allow university admins to view projected attendance (user submitted).  

---
## R4: Tyto Analytics Layer

### R4.1 Simulation System

!!! failure "Demo 1 - Not Implemented"
    No requirements in this sub-system were implemented for Demo 1.

- **R4.1.1** :material-close-circle:{ style="color: #e53935" } The system shall support 20,000+ simulations to evaluate efficiency.  
- **R4.1.2** :material-close-circle:{ style="color: #e53935" } The system shall provide a dashboard to view analytics under simulation load.  
- **R4.1.3** :material-close-circle:{ style="color: #e53935" } The system shall use authentication distinct from student and admin roles.  
