# User Stories

!!! abstract "Section Brief"
    User stories capture the needs of each actor interacting with UMTAS from a value-delivery perspective. They are written in the standard *As a [role], I want [goal], so that [benefit]* format and serve as the primary input for feature prioritisation, sprint planning, and acceptance criteria across all development cycles.

    **Actors covered:** Student · Administrator · System Admin

---

## 4.1 Student

**Description:**  
A student enrolled at a university that uses the system to access and personalise their academic timetable.

**Characteristics:**
- Varying levels of technical proficiency.
- The interface must be simple and intuitive.  
- Primarily interested in viewing their personalised schedule and exporting it to their preferred calendar application.  
- May set preferences such as minimising gaps between classes or avoiding early morning lectures.  

### User Stories:
- Login stories

| User Story | User Story                                 |
| ---------- | ------------------------------------------ |
| US-LOGIN-1 | as a student i want to login to my account |
| US-LOGIN-2 | as a student i want to register an account |
| US-LOGIN-3 | as a student i want to reset my password   |

- Builder stories

| User Story    | User Story                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| US-BUILDER-1  | As a student I want to create a module with descriptive detail about it.                                       |
| US-BUILDER-2  | As a student I want to edit a module to change details about it.                                               |
| US-BUILDER-3  | As a student I want to delete modules if I see the need to.                                                    |
| US-BUILDER-4  | As a student I want to create events which capture event details that represent more closely a calendar event. |
| US-BUILDER-5  | As a student I want to modify these events to adjust the criteria about them.                                  |
| US-BUILDER-6  | As a student I want to delete events if I see the need to.                                                     |
| US-BUILDER-7  | As a student I want to create a timetable which is a snapshot of chosen events at a time.                      |
| US-BUILDER-8  | As a student I want to edit a created timetable.                                                               |
| US-BUILDER-9  | As a student I want to delete a created timetable.                                                             |
| US-BUILDER-10 | As a student I want to export a .ics calendar.                                                                 |


---

## 4.2 Lecturer

**Description:**  
An academic staff member whose availability and preferences influence the timetable.

**Characteristics:**
- Moderate technical proficiency.  
- Interested in ensuring their scheduled lectures do not conflict with other commitments. 
- May have venue or time preferences.  


---

## 4.3 University Administrator

**Description:**  
A staff member responsible for managing and approving the institutional timetable and monitoring resource usage.

**Characteristics:**
- High technical proficiency and familiarity with scheduling constraints.  
- Responsible for configuring the system with venues, time slots, modules, and lecturer assignments.  
- Interested in analytics such as venue utilisation, overcapacity alerts, and schedule conflict reports.  


---

## 4.4 System Administrator

**Description:**  
A technical operator responsible for system health, access management, and configuration of adapters for new university deployments.

**Characteristics:**
- High technical proficiency.  
- Responsible for deploying new university adapter instances and maintaining system infrastructure.  
