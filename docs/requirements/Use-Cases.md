# Use Cases and Subsystems

The UMTAS system is decomposed into eight logical subsystems, each with a defined scope, set of primary actors, and collection of use cases. This organisation ensures modularity, independent testability, and clear responsibility boundaries. Each subsystem is described below with its use cases, domain model, and interactions with other subsystems.

## Subsystem Index

| Subsystem | ID Prefix | Primary Actor(s) | # Use Cases |
|-----------|-----------|-----------------|------------|
| **6.1 Timetable Core Engine** | UC-CE | Scheduler Service | 4 |
| **6.2 PDF Input Adapter** | UC-PDF | University Admin / System | 3 |
| **6.3 API Input Adapter** | UC-API | University API / System | 2 |
| **6.4 Calendar Export Subsystem** | UC-EX | Student | 2 |
| **6.5 User and Authentication Subsystem** | UC-AU | All Users | 4 |
| **6.6 University Admin Dashboard and Analytics** | UC-AD | University Admin | 7 |
| **6.7 Student Subsystem** | UC-ST | Student | 7 |
| **6.8 Tyto Simulation Subsystem** | UC-TY | Tyto Admin | 2 |

---

## 6.1 Timetable Core Engine

**Description:** The Timetable Core Engine is the central processing subsystem of UMTAS. It owns the primary scheduling domain: the institutional hierarchy, the calendar constraint framework, all academic module definitions, the complete event type hierarchy, and the assembled schedule artifacts. The subsystem is responsible for managing the CP-SAT solution cache to prevent redundant solver invocations for known schedule configurations.

**Scope:** Schedule generation, constraint solving, caching, and timetable management for the system.

### 6.1.1 Use Cases

| Use Case ID | Use Case Name | Actor(s) | Precondition | Postcondition |
|---|---|---|---|---|
| UC-CE-01 | Receive Schedule Request | System | Modules and constraints configured | Request queued for solver |
| UC-CE-02 | Query Solution Cache | Scheduler Service | Timetable configuration known | Cache hit/miss determined |
| UC-CE-03 | Invoke CP-SAT Solver | Scheduler Service | Constraint set complete | Schedule solution returned or timeout |
| UC-CE-04 | Persist Timetable | System | Solution generated | Timetable stored in database |

#### UC-CE-01: Receive Schedule Request

| Field | Detail |
|---|---|
| **Actor** | System (Scheduler Service) |
| **Precondition** | Modules, venues, time slots, and constraints configured |
| **Trigger** | Student or admin initiates timetable generation |
| **Basic Flow** | System receives request with modules, preferences, and constraints System validates input System queues job for solver |
| **Alternate Flow** | **A1: Invalid input** error returned to caller **A2: Solver queue full** request deferred with retry suggestion |
| **Postcondition** | Job queued for solver processing |
| **Requirements Covered** | R1.2.1, R2.2.1 |

### 6.1.2 Domain Model

The Timetable Core Engine owns all entities related to the institutional scheduling domain. See [System Domain Model](Domain-Model.md) for the complete entity diagram and descriptions.

---

## 6.2 PDF Input Adapter

**Description:** The PDF Input Adapter subsystem handles the parsing of university-supplied timetable PDFs into normalised Module records that the Core Engine can schedule. The subsystem uses an abstract PDFParserParent class that enables university-specific concrete implementations (e.g. UPPDFParser for University of Pretoria) to be added without modifying the core system.

**Scope:** PDF upload, parsing, validation, and transformation into Core Engine Module records.

### 6.2.1 Use Cases

| Use Case ID | Use Case Name | Actor(s) | Precondition | Postcondition |
|---|---|---|---|---|
| UC-PDF-01 | Upload PDF | University Admin | PDF file available | PDF stored, job created |
| UC-PDF-02 | Parse PDF | System (Worker) | PDF stored in object storage | Modules extracted and normalised |
| UC-PDF-03 | Populate Core Engine | System | Parsing complete successfully | Modules added to AcademicCalendar |

#### UC-PDF-01: Upload PDF

| Field | Detail |
|---|---|
| **Actor** | University Administrator |
| **Precondition** | Administrator authenticated, PDF file selected |
| **Trigger** | Administrator selects "Upload PDF" |
| **Basic Flow** | System receives multipart/form-data request System validates MIME type System stores PDF in MinIO object storage System creates ParseJob record Job queued to Redis BullMQ |
| **Alternate Flow** | **A1: Invalid file type** error returned **A2: Storage failure** retry logic triggered |
| **Postcondition** | PDF stored and parse job created with status PENDING |
| **Requirements Covered** | R2.3.1 |

### 6.2.2 Domain Model

**Key classes:**

- `PDFParserParent` (abstract): Template for PDF parsing strategies per university
- `UPPDFParser` (concrete): University of Pretoria-specific PDF parser implementation
- `ParseJob`: Background job tracking PDF parsing progress
- `ParsedTimetablePayload`: Normalised output of parsing (modules, events, constraints)

---

## 6.3 API Input Adapter

**Description:** The API Input Adapter subsystem handles integration with university-provided institutional APIs. Like the PDF Adapter, it employs an abstract APIAdapterParent class that allows new university integrations to be plugged in without core modifications.

**Scope:** API integration, data retrieval, normalisation, and transformation into Core Engine Module records.

### 6.3.1 Use Cases

| Use Case ID | Use Case Name | Actor(s) | Precondition | Postcondition |
|---|---|---|---|---|
| UC-API-01 | Sync API Data | System (Scheduled) | API credentials configured | Modules retrieved and normalised |
| UC-API-02 | Populate Core Engine | System | Data sync complete | Modules added to AcademicCalendar |

#### UC-API-01: Sync API Data

| Field | Detail |
|---|---|
| **Actor** | System (Scheduled Worker) |
| **Precondition** | API credentials configured, endpoint available |
| **Trigger** | Scheduled job or manual trigger |
| **Basic Flow** | System authenticates to university API System retrieves module and timetable data System normalises data to internal model System creates ParseJob System queues job |
| **Alternate Flow** | **A1: API unavailable** error logged, retry scheduled **A2: Authentication failure** credentials validated and user notified **A3: Data format unexpected** parsing error logged |
| **Postcondition** | Data normalised and queued for Core Engine population |
| **Requirements Covered** | R2.4.1 |

### 6.3.2 Domain Model

**Key classes:**

- `APIAdapterParent` (abstract): Template for API integration strategies
- `MockAPIAdapter` (concrete): Mock implementation for testing and demo
- `APIDataPayload`: Normalised output of API integration
- `AdapterConfig`: Stores API endpoint, credentials, and configuration per university

---

## 6.4 Calendar Export Subsystem

**Description:** The Calendar Export Subsystem handles exporting generated timetables to external calendar systems (Google Calendar via OAuth) and as downloadable ICS files. It manages export jobs, transformation to iCalendar format, and integration with the Google Calendar API.

**Scope:** Timetable export to Google Calendar, ICS file generation, and export tracking.

### 6.4.1 Use Cases

| Use Case ID | Use Case Name | Actor(s) | Precondition | Postcondition |
|---|---|---|---|---|
| UC-EX-01 | Export Timetable to Google Calendar | Student | Timetable generated, Google OAuth authorised | Events created in Google Calendar |
| UC-EX-02 | Download Timetable as .ics File | Student | Timetable generated | .ics file downloaded to device |

#### UC-EX-01: Export Timetable to Google Calendar

| Field | Detail |
|---|---|
| **Actor** | Student |
| **Precondition** | Student authenticated, timetable generated, Google OAuth authorised |
| **Trigger** | Student selects "Export to Google Calendar" |
| **Basic Flow** | System retrieves timetable and converts to iCalendar events System calls Google Calendar API to create events System confirms success to student |
| **Alternate Flow** | **A1: OAuth not authorised** initiate OAuth flow **A2: API failure** notify student and log error **A3: Partial success** report which events failed |
| **Postcondition** | Timetable events created in student's Google Calendar |
| **Requirements Covered** | R2.5.2 |

### 6.4.2 Domain Model

**Key classes:**

- `CalendarExport`: Tracks export records and status per timetable
- `ExportJob`: Background job managing individual export operations
- `GoogleCalendarService`: Integration layer with Google Calendar API
- `ICSGenerator`: Converts Timetable and TimetableEntry records to iCalendar format

---

## 6.5 User and Authentication Subsystem

**Description:** The User and Authentication Subsystem manages identity, access control, and session lifecycle for all user roles. It integrates with Better Auth for password-based and OAuth authentication (Google Workspace), provides role-based access control (RBAC), and manages user sessions and password resets.

**Scope:** User registration, authentication, logout, password reset, and session management.

### 6.5.1 Use Cases

| Use Case ID | Use Case Name | Actor(s) | Precondition | Postcondition |
|---|---|---|---|---|
| UC-AU-01 | Register Account | User (Student) | User not registered | Account created and activated |
| UC-AU-02 | Login | User | Registered and verified account exists | User authenticated and session created |
| UC-AU-03 | Reset Password | User | Registered account exists | Password updated |
| UC-AU-04 | Logout | User | User authenticated | Session invalidated |

#### UC-AU-02: Login

| Field | Detail |
|---|---|
| **Actor** | User (Student, Lecturer, Admin) |
| **Precondition** | User has registered and verified account |
| **Trigger** | User submits credentials on login screen |
| **Basic Flow** | User enters email and password System validates credentials against database System creates session token System redirects to dashboard |
| **Alternate Flow** | **A1: Invalid credentials** generic error shown **A2: Account not verified** prompt to verify email **A3: Account locked** notify user after too many failed attempts |
| **Postcondition** | User authenticated and session created |
| **Requirements Covered** | R1.2.1, R1.2.3 |

### 6.5.2 Domain Model

**Key classes:**

- `User` (abstract): Base class for all user types
- `Student`, `Lecturer`, `UniversityAdmin`, `SystemAdmin`: Role-specific subclasses
- `Session`: Represents an authenticated user session
- `OAuthProvider`: OAuth configuration and token management
- `PasswordResetToken`: Temporary tokens for password reset flow

---

## 6.6 University Admin Dashboard and Analytics

**Description:** The University Admin Dashboard and Analytics Subsystem provides insights into timetable utilisation, attendance patterns, lecturer workload, and demand trends. It aggregates data from the Core Engine and Student Subsystem, computes analytics metrics, and presents visualisations to university administrators.

**Scope:** Venue utilisation analytics, lecturer workload analysis, demand forecasting, overcapacity alerts, and venue reallocation recommendations.

### 6.6.1 Use Cases

| Use Case ID | Use Case Name | Actor(s) | Precondition | Postcondition |
|---|---|---|---|---|
| UC-AD-01 | View Venue Analytics | University Administrator | Administrator authenticated, timetable data exists | Venue utilisation metrics displayed |
| UC-AD-02 | View Lecturer Workload Analytics | University Administrator | Administrator authenticated, lecture data exists | Workload metrics displayed |
| UC-AD-03 | View Demand & Overcapacity Patterns | University Administrator | Administrator authenticated, student data exists | Demand trends and alerts displayed |
| UC-AD-04 | Reallocate Venue (Advisory) | University Administrator | Overcapacity or inefficiency identified | Venue suggestions provided |
| UC-AD-05 | View Actual Attendance | University Administrator | Administrator authenticated, attendance data recorded | Attendance figures displayed |
| UC-AD-06 | View Projected Attendance | University Administrator | Administrator authenticated, student timetables submitted | Projected headcounts displayed |
| UC-AD-07 | View Registered Students for Module | University Administrator | Administrator authenticated, module data exists | Student list displayed |

#### UC-AD-01: View Venue Analytics

| Field | Detail |
|---|---|
| **Actor** | University Administrator |
| **Precondition** | Administrator authenticated, timetable data exists |
| **Trigger** | Administrator opens analytics dashboard |
| **Basic Flow** | System aggregates timetable venue assignments System calculates utilisation metrics (occupancy, capacity ratios) System displays heatmaps and trend charts Administrator reviews insights |
| **Alternate Flow** | **A1: No data** empty state displayed **A2: Processing error** error message shown |
| **Postcondition** | Venue utilisation insights available to administrator |
| **Requirements Covered** | R3.1.1, R3.1.2 |

### 6.6.2 Domain Model

**Key classes:**

- `Dashboard`: Represents the admin dashboard with configurable widgets
- `VenueUtilization`: Computed analytics for venue capacity and occupancy
- `LecturerWorkloadReport`: Aggregated workload metrics per lecturer
- `OvercapacityAlert`: Alerts triggered when capacity is exceeded
- `VenueReallocationRequest`: Tracks venue change requests and recommendations
- `Venue`, `VenueCapacity`: (Phase 2+) Venue entities and configuration

---

## 6.7 Student Subsystem

**Description:** The Student Subsystem enables students to create, view, modify, and manage their personal timetables. It handles preference management, constraint resolution, and tracks student enrolments and event selections.

**Scope:** Timetable management, preference configuration, enrolment tracking, and student-specific views.

### 6.7.1 Use Cases

| Use Case ID | Use Case Name | Actor(s) | Precondition | Postcondition |
|---|---|---|---|---|
| UC-ST-01 | Create Timetable (Manual) | Student | Student authenticated | Timetable saved |
| UC-ST-02 | Generate Timetable | Student | Student authenticated, modules selected | Generated timetable stored and displayed |
| UC-ST-03 | View Timetable | Student | Student authenticated, timetable exists | Timetable displayed |
| UC-ST-04 | Modify Timetable | Student | Student authenticated, timetable exists | Updated timetable stored |
| UC-ST-05 | Delete Timetable | Student | Student authenticated, timetable exists | Timetable removed |
| UC-ST-06 | Set Scheduling Preferences | Student | Student authenticated | Preferences stored and applied |
| UC-ST-07 | Resolve Constraint Violations | Student | Constraint violations detected | Violations resolved, valid timetable stored |

#### UC-ST-02: Generate Timetable

| Field | Detail |
|---|---|
| **Actor** | Student |
| **Precondition** | Student authenticated, modules selected, preferences configured |
| **Trigger** | Student selects "Generate Timetable" |
| **Basic Flow** | System collects selected modules and preferences System sends request to Core Engine System receives generated schedule System displays timetable to student Student confirms and saves |
| **Alternate Flow** | **A1: Missing module data** student prompted to complete input **A2: No valid solution** user notified, prompted to relax constraints **A3: Timeout** async handling, user notified when ready |
| **Postcondition** | Generated timetable stored and available for view/export |
| **Requirements Covered** | R2.1.1, R2.2.1, R2.2.3 |

### 6.7.2 Domain Model

**Key classes:**

- `Enrollment`: Student registration in a module or group
- `EnrollmentChoice`: Student selection of event instances (e.g. tutorial group choice)
- `StudentPreference` (Phase 3+): Scheduling preferences (prefer mornings, minimise gaps, etc.)
- `PreferenceRule` (Phase 3+): Constraint rules derived from preferences

---

## 6.8 Tyto Simulation Subsystem

**Description:** The Tyto Simulation Subsystem evaluates system performance and scalability through large-scale simulated timetable workloads and stress testing. It generates synthetic users and module enrolments, simulates concurrent timetable generation requests, and collects performance metrics.

**Scope:** Simulation execution, performance metric collection, and analytics visualisation under simulated load.

### 6.8.1 Use Cases

| Use Case ID | Use Case Name | Actor(s) | Precondition | Postcondition |
|---|---|---|---|---|
| UC-TY-01 | Run Simulation Batch | Tyto Administrator | System configured, simulation parameters defined | Simulation results stored |
| UC-TY-02 | View Simulation Analytics | Tyto Administrator | Simulation completed | Performance insights displayed |

#### UC-TY-01: Run Simulation Batch

| Field | Detail |
|---|---|
| **Actor** | Tyto Administrator |
| **Precondition** | System configured for simulation, parameters defined (user count, modules, preferences) |
| **Trigger** | Simulation job initiated |
| **Basic Flow** | System generates synthetic student users System assigns random modules and preferences System simulates concurrent timetable generation requests System records latency, throughput, error rates System stores metrics for analysis |
| **Alternate Flow** | **A1: Resource overload** simulation throttled or paused **A2: Simulation failure** error logged and reported |
| **Postcondition** | Simulation metrics collected and stored |
| **Requirements Covered** | R4.1.1 |

### 6.8.2 Domain Model

**Key classes:**

- `SimulationBatch`: Represents a collection of simulation runs
- `SimulationJob`: Individual simulation execution within a batch
- `SimulationConfig`: Configuration parameters for simulation (user count, load profile, etc.)
- `SimulationMetrics`: Collected performance data (latency, throughput, failures, CPU/memory)

---

## Cross-Subsystem Dependencies

The subsystems interact through well-defined service boundaries and data contracts:

- **Student Subsystem → Core Engine:** Calls scheduling service to generate timetables; reads from Timetable/TimetableEntry
- **PDF/API Adapters → Core Engine:** Produce Module records; populate AcademicCalendar
- **Calendar Export → Core Engine:** Reads from Timetable and TimetableEntry
- **Admin Dashboard → Core Engine & Student Subsystem:** Reads from Timetable, TimetableEntry, and analytics tables
- **Tyto Simulation → Core Engine:** Invokes scheduling service with synthetic load

All inter-subsystem communication is mediated through NestJS services and repository layers, ensuring loose coupling and testability.
