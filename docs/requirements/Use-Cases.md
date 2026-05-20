# Use Cases

!!! abstract "Section Brief"
    Use cases detail the concrete interactions between system actors and the UMTAS platform. Each use case describes a discrete system capability with a precondition, trigger, basic flow, alternate flows, and postcondition. All use cases map directly to functional requirements in the [Traceability Matrix](Traceability-Matrix.md).

    **Subsystems:** Authentication · Timetable Management · Timetable Import · Calendar Integration · University Analytics · Tyto Simulation

    **Actors:** User · Student · University Administrator · Tyto Administrator

---

This section defines the primary use cases for the UMTAS platform. Use cases are grouped according to subsystem boundaries to improve readability and align with the modular system architecture.

## 8.1 Authentication System
![Authentication System](../diagrams/requirements/Authentication-System.svg)

**Description:** The Authentication System manages user identity and access control for the platform. It provides functionality for account registration, authentication, and logout for all authorised users.

**Scope:** The subsystem includes user login, registration, and logout capabilities for Students, University Administrators, and Tyto Administrators.

!!! success "Demo 1 — Fully Implemented"
    All use cases in this subsystem were implemented for Demo 1.

### 8.1.1 Use Cases
| Use Case ID | Use Case Name | Actor(s) |
| :--- | :--- | :--- |
| UC-AU-01 | Register Account | User (Student) |
| UC-AU-02 | Login | User |
| UC-AU-03 | Reset Password | User |
| UC-AU-04 | Logout | User |

#### UC-AU-01: Register Account · :material-check-circle:{ style="color: #4caf50" }
| Field | Detail |
| :--- | :--- |
| **Actor** | User (Student) |
| **Precondition** | User is not registered |
| **Trigger** | User selects "Register" from the landing page |
| **Basic Flow** | 1. User completes registration form (name, email, password)<br>2. System validates fields<br>3. System creates account<br>4. System sends verification email<br>5. User verifies email<br>6. System activates account and redirects to dashboard |
| **Alternate Flow** | **A1: Email already in use**<br>System displays error and prompts login or password reset. |
| **Postcondition** | Account created and activated |
| **Requirements Covered** | R1.2.2 |

#### UC-AU-02: Login · :material-check-circle:{ style="color: #4caf50" }
| Field | Detail |
| :--- | :--- |
| **Actor** | User |
| **Precondition** | User has a registered and verified account |
| **Trigger** | User submits credentials |
| **Basic Flow** | 1. System validates credentials<br>2. Session created<br>3. User redirected to dashboard |
| **Alternate Flow** | **A1: Invalid credentials**<br>Generic error shown.<br>**A2: Account not verified**<br>Prompt to verify email.<br>**A3: Account locked**<br>Notify user after too many failed attempts. |
| **Postcondition** | User is authenticated |
| **Requirements Covered** | R1.2.1 \| R1.2.3 |

#### UC-AU-03: Reset Password · :material-check-circle:{ style="color: #4caf50" }
| Field | Detail |
| :--- | :--- |
| **Actor** | User |
| **Precondition** | User has a registered account |
| **Trigger** | User selects "Forgot Password" on login screen |
| **Basic Flow** | 1. User submits email<br>2. Reset link sent<br>3. User sets new password |
| **Alternate Flow** | **A1: Email not found**<br>Neutral message shown. |
| **Postcondition** | Password updated |
| **Requirements Covered** | R1.2.1 |

#### UC-AU-04: Logout · :material-check-circle:{ style="color: #4caf50" }
| Field | Detail |
| :--- | :--- |
| **Actor** | User |
| **Precondition** | User is logged in |
| **Trigger** | User selects logout |
| **Basic Flow** | 1. System invalidates session token<br>2. User redirected to landing page |
| **Alternate Flow** | None |
| **Postcondition** | Session invalidated |
| **Requirements Covered** | R1.2.3 |

## 8.2 Timetable Management System
![Timetable Management System](../diagrams/requirements/Timetable-Management-System.svg)

**Description:** The Timetable Management System enables students to create, generate, modify, organise, and manage academic timetables within the platform.

**Scope:** The subsystem supports timetable creation, viewing, editing, deletion, semester assignment, preference management, and timetable generation functionality.

!!! warning "Demo 1 — Partially Implemented"
    **Implemented:** UC-ST-01 · UC-ST-02 · UC-ST-03 · UC-ST-04 · UC-ST-05

    **Not implemented:** UC-ST-06 · UC-ST-07

### 8.2.1 Use Cases
| Use Case ID | Use Case Name                 | Actor(s) |
| :---------- | :---------------------------- | :------- |
| UC-ST-01    | Create Timetable (Manual)     | Student  |
| UC-ST-02    | Generate Timetable            | Student  |
| UC-ST-03    | View Timetable                | Student  |
| UC-ST-04    | Modify Timetable              | Student  |
| UC-ST-05    | Delete Timetable              | Student  |
| UC-ST-06    | Set Scheduling Preferences    | Student  |
| UC-ST-07    | Resolve Constraint Violations | Student  |

#### UC-ST-01: Create Timetable (Manual) · :material-check-circle:{ style="color: #4caf50" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Student |
| **Precondition** | Student is authenticated |
| **Trigger** | Student selects "Create Timetable" |
| **Basic Flow** | 1. System displays timetable builder<br>2. Student adds modules and assigns time slots<br>3. System validates entries for conflicts<br>4. Student saves timetable<br>5. System confirms and stores |
| **Alternate Flow** | **A1: Time conflict detected**<br>System prompts resolution.<br>**A2: Missing required fields**<br>System highlights incomplete entries. |
| **Postcondition** | Timetable saved |
| **Requirements Covered** | R2.2.1 |

#### UC-ST-02: Generate Timetable · :material-check-circle:{ style="color: #4caf50" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Student |
| **Precondition** | Student is authenticated, Modules selected, Preferences configured (UC-ST-06) |
| **Trigger** | Student selects "Generate Timetable" |
| **Basic Flow** | 1. Student selects modules and configures preferences<br>2. System sends request to Core Engine<br>3. System generates timetable<br>4. Timetable displayed to student |
| **Alternate Flow** | **A1: Missing module data**<br>Student prompted to complete input.<br>**A2: No valid timetable possible**<br>User notified, suggested to relax constraints.<br>**A3: Processing timeout**<br>User notified, async handling. |
| **Postcondition** | Generated timetable stored and displayed |
| **Requirements Covered** | R2.2.1 \| R2.2.3 |

#### UC-ST-03: View Timetable · :material-check-circle:{ style="color: #4caf50" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Student |
| **Precondition** | Student is authenticated, Timetable exists |
| **Trigger** | Student opens timetable dashboard |
| **Basic Flow** | 1. System retrieves timetable<br>2. System renders timetable grid<br>3. Student views schedule |
| **Alternate Flow** | **A1: No timetable exists**<br>System prompts creation or generation.<br>**A2: Retrieval error**<br>Error message displayed. |
| **Postcondition** | Timetable displayed |
| **Requirements Covered** | R2.1.1 |

#### UC-ST-04: Modify Timetable · :material-check-circle:{ style="color: #4caf50" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Student |
| **Precondition** | Student is authenticated, Timetable exists |
| **Trigger** | Student selects "Edit Timetable" |
| **Basic Flow** | 1. System loads existing timetable<br>2. Student modifies entries<br>3. System validates changes<br>4. Student saves; system updates timetable |
| **Alternate Flow** | **A1: Conflict introduced**<br>System flags conflict and prompts resolution.<br>**A2: Save failure**<br>Error message shown. |
| **Postcondition** | Updated timetable stored |
| **Requirements Covered** | R2.1.2 |

#### UC-ST-05: Delete Timetable · :material-check-circle:{ style="color: #4caf50" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Student |
| **Precondition** | Student is authenticated, Timetable exists |
| **Trigger** | Student selects "Delete Timetable" |
| **Basic Flow** | 1. System requests confirmation<br>2. Student confirms<br>3. System deletes timetable and confirms success |
| **Alternate Flow** | **A1: User cancels**<br>No action taken.<br>**A2: Deletion error**<br>Error message shown. |
| **Postcondition** | Timetable removed |
| **Requirements Covered** | R2.1.3 |

#### UC-ST-06: Set Scheduling Preferences · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Student |
| **Precondition** | Student is authenticated |
| **Trigger** | Student opens preferences screen, or system prompts before first generation |
| **Basic Flow** | 1. System displays preference options (prefer mornings, minimise gaps, avoid back-to-back)<br>2. Student configures and saves preferences<br>3. System stores preferences linked to profile |
| **Alternate Flow** | **A1: Conflicting values**<br>System highlights conflict and prompts correction.<br>**A2: No preferences set**<br>System applies defaults and notifies student. |
| **Postcondition** | Preferences stored and applied during next generation |
| **Requirements Covered** | R2.2.3 |

#### UC-ST-07: Resolve Constraint Violations · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Student |
| **Precondition** | Student is authenticated, Constraint violations returned by system |
| **Trigger** | System returns violations after generation or save attempt |
| **Basic Flow** | 1. System displays conflicts<br>2. System suggests fixes<br>3. Student adjusts entries<br>4. Student resubmits |
| **Alternate Flow** | **A1: Conflicts persist**<br>Student prompted to retry or relax preferences. |
| **Postcondition** | Violations resolved. Valid timetable stored. |
| **Requirements Covered** | R2.2.3 |

## 8.3 Timetable Import System
![Timetable Import System](../diagrams/requirements/Requirements.drawio)

**Description:** The Timetable Import System enables students to import timetable data from external university sources such as PDFs and institutional APIs.

**Scope:** The subsystem supports timetable parsing, validation, import processing, and user customisation of imported timetable data.

!!! failure "Demo 1 — Not Implemented"
    No use cases in this subsystem were implemented for Demo 1.

### 8.3.1 Use Cases
| Use Case ID | Use Case Name | Actor(s) |
| :--- | :--- | :--- |
| UC-ST-08 | Import Timetable | Student |
| UC-ST-09 | Customise Imported Timetable | Student |

#### UC-ST-08: Import Timetable · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Student |
| **Precondition** | Student is authenticated, External timetable source available |
| **Trigger** | Student selects "Import Timetable" |
| **Basic Flow** | 1. Student uploads PDF or selects API import<br>2. System validates input format<br>3. System processes data via appropriate adapter<br>4. System displays imported timetable preview<br>5. Student confirms import and assigns semester<br>6. System stores timetable |
| **Alternate Flow** | **A1: Invalid file format**<br>Upload rejected with error.<br>**A2: Incomplete parsed data**<br>System flags missing fields for manual correction.<br>**A3: Adapter failure**<br>Error returned to user. |
| **Postcondition** | Imported timetable stored and available for customisation |
| **Requirements Covered** | R2.3.1 \| R2.4.1 \| R2.2.2 |

#### UC-ST-09: Customise Imported Timetable · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Student |
| **Precondition** | Student is authenticated, Timetable has been imported (UC-ST-08) |
| **Trigger** | System displays imported timetable preview and prompts student to confirm or edit |
| **Basic Flow** | 1. System displays parsed timetable in builder interface<br>2. Student reviews and corrects entries (time slots, modules, venues)<br>3. System validates changes in real time<br>4. Student confirms and saves<br>5. System stores finalised timetable |
| **Alternate Flow** | **A1: Missing fields**<br>System highlights incomplete entries before saving.<br>**A2: Conflict introduced**<br>System flags overlap and prompts resolution.<br>**A3: Student discards import**<br>Import cancelled without saving. |
| **Postcondition** | Corrected timetable stored and associated with student profile |
| **Requirements Covered** | R2.3.2 \| R2.4.2 |

## 8.4 Calendar Integration System
![Calendar Integration System](../diagrams/requirements/Calender-Integration-System.svg)

**Description:** The Calendar Integration System enables students to export their timetables to external calendar applications for ongoing schedule management.

**Scope:** Covers export to Google Calendar via OAuth and download as a standard .ics file.

!!! warning "Demo 1 — Partially Implemented"
    **Implemented:** UC-EX-02

    **Not implemented:** UC-EX-01

### 8.4.1 Use Cases
| Use Case ID | Use Case Name | Actor(s) |
| :--- | :--- | :--- |
| UC-EX-01 | Export Timetable to Google Calendar | Student |
| UC-EX-02 | Download Timetable as .ics File | Student |

#### UC-EX-01: Export Timetable to Google Calendar · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Student |
| **Precondition** | Student is authenticated, Timetable exists, Google OAuth authorised |
| **Trigger** | Student selects "Export to Google Calendar" |
| **Basic Flow** | 1. System retrieves timetable<br>2. System sends events to Google Calendar API<br>3. System confirms success to student |
| **Alternate Flow** | **A1: OAuth not authorised**<br>System initiates OAuth flow.<br>**A2: API failure**<br>System notifies student of failure.<br>**A3: Partial success**<br>System reports which events failed. |
| **Postcondition** | Timetable events created in Google Calendar |
| **Requirements Covered** | R2.5.2 |

#### UC-EX-02: Download Timetable as .ics File · :material-check-circle:{ style="color: #4caf50" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Student |
| **Precondition** | Student is authenticated, Timetable exists |
| **Trigger** | Student selects "Download .ics" from export options |
| **Basic Flow** | 1. System retrieves timetable<br>2. System generates .ics file<br>3. File downloaded to student's device |
| **Alternate Flow** | **A1: Generation failure**<br>System displays error message. |
| **Postcondition** | Valid .ics file downloaded |
| **Requirements Covered** | R2.5.1 |

## 8.5 University Analytics System
![University Analytics System](../diagrams/requirements/Requirements.drawio)

**Description:** The University Analytics System provides analytical insights into timetable utilisation, attendance patterns, lecturer workload, and demand trends for university administrators.

**Scope:** The subsystem supports timetable analytics, attendance analysis, venue utilisation monitoring, workload evaluation, and demand forecasting functionality.

!!! failure "Demo 1 — Not Implemented"
    No use cases in this subsystem were implemented for Demo 1.

### 8.5.1 Use Cases
| Use Case ID | Use Case Name | Actor(s) |
| :--- | :--- | :--- |
| UC-AD-01 | View Venue Analytics | University Administrator |
| UC-AD-02 | View Lecturer Workload Analytics | University Administrator |
| UC-AD-03 | View Demand & Overcapacity Patterns | University Administrator |
| UC-AD-04 | Reallocate Venue (Advisory) | University Administrator |
| UC-AD-05 | View Actual Attendance | University Administrator |
| UC-AD-06 | View Projected Attendance | University Administrator |
| UC-AD-07 | View Registered Students for Module | University Administrator |

#### UC-AD-01: View Venue Analytics · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | University Administrator |
| **Precondition** | Administrator is authenticated, Timetable data exists |
| **Trigger** | Administrator opens analytics dashboard |
| **Basic Flow** | 1. System aggregates timetable data<br>2. System calculates venue utilisation metrics<br>3. System displays visualisations (charts, heatmaps)<br>4. Administrator reviews usage trends |
| **Alternate Flow** | **A1: No data**<br>Empty state displayed.<br>**A2: Processing error**<br>Error message shown. |
| **Postcondition** | Venue utilisation insights displayed |
| **Requirements Covered** | R3.1.1 \| R3.1.2 |

#### UC-AD-02: View Lecturer Workload Analytics · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | University Administrator |
| **Precondition** | Administrator is authenticated, Timetable data exists |
| **Trigger** | Administrator selects lecturer analytics view |
| **Basic Flow** | 1. System aggregates lecturer schedules<br>2. System calculates workload metrics (hours, frequency)<br>3. System displays analytics dashboard |
| **Alternate Flow** | **A1: Missing lecturer data**<br>Partial analytics with warning.<br>**A2: Processing error**<br>Error message shown. |
| **Postcondition** | Lecturer workload insights displayed |
| **Requirements Covered** | R3.1.1 |

#### UC-AD-03: View Demand & Overcapacity Patterns · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | University Administrator |
| **Precondition** | Administrator is authenticated, Student timetable data exists |
| **Trigger** | Administrator opens demand analytics section |
| **Basic Flow** | 1. System analyses student timetable selections<br>2. System identifies high-demand modules and time slots<br>3. System flags overcapacity risks<br>4. System displays alerts and trends |
| **Alternate Flow** | **A1: Insufficient data**<br>Informational message shown.<br>**A2: Data inconsistency**<br>Partial results with warning. |
| **Postcondition** | Demand and overcapacity insights displayed |
| **Requirements Covered** | R3.1.3 |

#### UC-AD-04: Reallocate Venue (Advisory) · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | University Administrator |
| **Precondition** | Administrator is authenticated, Overcapacity or inefficiency identified |
| **Trigger** | Administrator selects a flagged schedule entry |
| **Basic Flow** | 1. System displays current allocation<br>2. System suggests alternative venues based on capacity<br>3. Administrator reviews suggestions<br>4. System updates analytics view |
| **Alternate Flow** | **A1: No suitable venue found**<br>Administrator notified.<br>**A2: Recommendation failure**<br>Error displayed. |
| **Postcondition** | Suggested venue improvements visualised |
| **Requirements Covered** | R3.1.1 \| R3.1.3 |

#### UC-AD-05: View Actual Attendance · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | University Administrator |
| **Precondition** | Administrator is authenticated, Attendance data recorded |
| **Trigger** | Administrator selects a module time slot from the dashboard |
| **Basic Flow** | 1. System retrieves attendance data<br>2. System displays attendance count and percentage relative to registered students |
| **Alternate Flow** | **A1: No data recorded**<br>Informational message displayed.<br>**A2: Partial data**<br>Available data shown with incomplete-records warning. |
| **Postcondition** | Actual attendance figures visible to administrator |
| **Requirements Covered** | R3.1.2 |

#### UC-AD-06: View Projected Attendance · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | University Administrator |
| **Precondition** | Administrator is authenticated, Students have submitted timetables for the relevant slot |
| **Trigger** | Administrator selects projected attendance view |
| **Basic Flow** | 1. System aggregates student timetable submissions<br>2. System calculates projected headcount<br>3. System displays projected vs registered comparison |
| **Alternate Flow** | **A1: Insufficient submissions**<br>Warning about low submission volume.<br>**A2: Data inconsistency**<br>Anomalies flagged, partial results shown. |
| **Postcondition** | Projected attendance data visible to administrator |
| **Requirements Covered** | R3.1.3 |

#### UC-AD-07: View Registered Students for Module · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | University Administrator |
| **Precondition** | Administrator is authenticated, Module and time slot data exists |
| **Trigger** | Administrator selects a module time slot from the dashboard |
| **Basic Flow** | 1. System retrieves registered student list for the slot<br>2. System displays student count and list |
| **Alternate Flow** | **A1: No students registered**<br>Empty state with informational message.<br>**A2: Data retrieval error**<br>Error message displayed. |
| **Postcondition** | Registered student data visible to administrator |
| **Requirements Covered** | R3.1.1 |

## 8.6 Tyto Simulation System
![Tyto Simulation](../diagrams/requirements/Requirements.drawio)

**Description:** The Tyto Simulation System evaluates system performance and scalability through large-scale simulated timetable workloads and stress testing.

**Scope:** The subsystem supports simulation execution, stress testing, performance metric collection, and analytics visualisation under simulated load conditions.

!!! failure "Demo 1 — Not Implemented"
    No use cases in this subsystem were implemented for Demo 1.

### 8.6.1 Use Cases
| Use Case ID | Use Case Name | Actor(s) |
| :--- | :--- | :--- |
| UC-TY-01 | Run Simulation Batch | Tyto Administrator |
| UC-TY-02 | View Simulation Analytics | Tyto Administrator |

#### UC-TY-01: Run Simulation Batch · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Tyto Administrator |
| **Precondition** | System configured for simulation, Parameters defined |
| **Trigger** | Simulation job initiated |
| **Basic Flow** | 1. System generates synthetic users<br>2. System assigns random modules and preferences<br>3. System simulates concurrent timetable generation requests<br>4. System records performance metrics<br>5. Simulation completes |
| **Alternate Flow** | **A1: Resource overload**<br>Simulation throttled or paused.<br>**A2: Simulation failure**<br>Error logged. |
| **Postcondition** | Simulation results stored |
| **Requirements Covered** | R4.1.1 |

#### UC-TY-02: View Simulation Analytics · :material-close-circle:{ style="color: #e53935" }
| Field | Detail |
| :--- | :--- |
| **Actor** | Tyto Administrator |
| **Precondition** | Simulation has completed |
| **Trigger** | Administrator opens simulation dashboard |
| **Basic Flow** | 1. System loads simulation results<br>2. System displays metrics (latency, throughput, failures)<br>3. System highlights bottlenecks |
| **Alternate Flow** | **A1: No simulation data**<br>Empty state displayed. |
| **Postcondition** | Performance insights available |
| **Requirements Covered** | R4.1.2 |

---
