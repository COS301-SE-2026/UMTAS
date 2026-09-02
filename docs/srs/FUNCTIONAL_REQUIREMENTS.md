# :material-format-list-numbered: Functional Requirements { #functional-requirements }

This page defines the functional requirements (FRs) for the system, grouped by
subsystem. Each group can be expanded independently.
The Traceability Matrices for the functional requirements to use cases can be found on the use cases page.

---

??? info "**FR 1 — Authentication System**"

    ### R1.2 Login and Register System

    - **R1.2.1** The system shall allow users to log in.
        - **R1.2.1.1** The system shall allow users to login using Oauth
        - **R1.2.1.2** The system shall allow users to login using "in house" system
    - **R1.2.2** The system shall allow users to register.
        - **R1.2.2.1** The system shall allow users to register using Oauth
        - **R1.2.2.2** The system shall allow users to register using "in house" system
    - **R1.2.3** The system shall manage user sessions.
    - **R1.2.4** The system shall allow users manage their account and system state
        - **R1.2.4.1** The system shall allow users to sign out.
        - **R1.2.4.2** The system shall allow users to reset their password
        - **R1.2.4.3** The system shall allow users to delete their account

---

??? info "**FR 2 — Timetable System**"

    ### R2.1 Timetable Management

    - **R2.1.1** The system shall allow users to view timetables.
        - **R2.1.1.1** The system shall allow users to view events and modules in a time table.
        - **R2.1.1.2** The system shall allow users to view the time table in a calendar format.
            - **R2.1.1.2.1** The system shall allow users to view the time table per week where relevant.
            - **R2.1.1.2.2** The system shall allow users to view time table details at a higher level such as related statistics.
        - **R2.1.1.3** The system shall allow users to select individual time tables from a list of stored timetables created by the user.
    - **R2.1.2** The system shall allow users to update timetables.
        - **R2.1.2.1** The system shall allow users to update timetable modules for owned modules.
            - **R2.1.2.1.1** The system shall allow users to update timetable module names.
            - **R2.1.2.1.2** The system shall allow users to update timetable module codes.
        - **R2.1.2.2** The system shall allow users to update timetable events listed details for owned events.
            - **R2.1.2.2.1** The system shall allow users to update timetable event venues.
            - **R2.1.2.2.2** The system shall allow users to update timetable event times.
            - **R2.1.2.2.3** The system shall allow users to update timetable event days
    - **R2.1.3** The system shall allow users to delete timetables which will not effect related events and modules.
    - **R2.1.4** The system shall allow timetable customisation.
        - **R2.1.4.1** The system shall allow timetable customisation of name
        - **R2.1.4.2** The system shall allow timetable customisation of colour

    ### R2.2 Timetable Creation – Builder

    - **R2.2.1** The system shall allow users to create new timetables.
        - **R2.2.1.1** The system shall allow users to create modules for timetables setting the related details of a module.
        - **R2.2.1.2** The system shall allow users to create events for timetables setting the related details of module events.
        - **R2.2.1.3** The system shall allow users to create a timetable from events and modules.

    ### R2.3 Timetable Creation – PDF System

    - **R2.3.1** The system shall automate timetable creation using a PDF if provided by a university of all classes if supported.
        - **R2.3.1.1** The system will create modules based on the provided PDF if they do not exist within the system
        - **R2.3.1.2** The system will do a module lookup based on the provided PDF if they do exist within the system
        - **R2.3.1.3** The system will create events based on the provided PDF if they do not exist within the system
        - **R2.3.1.4** The system will do a event lookup based on the provided PDF if they do exist within the system
        - **R2.3.1.5** The system will allow a user to create a timetable based on provided selection of events from the system
        - **R2.3.1.6** The system will allow a user to modify colours and other individual user details related to the timetable
    - **R2.3.2** The system shall allow user modification of PDF‑generated timetables.
        - **R2.3.2.1** The system shall allow users to modify individual related details of a timetable
        - **R2.3.2.2** The system shall allow users to modify selected events from module list

    ### R2.4 Timetable Creation – API System

    - **R2.4.1** The system shall automate timetable creation using a university‑provided API (if applicable).
        - **R2.4.1.1** The system will create modules based on the provided API if they do not exist within the system.
        - **R2.4.1.2** The system will do a module lookup based on the provided API if they do exist within the system.
        - **R2.4.1.3** The system will create events based on the provided API if they do not exist within the system.
        - **R2.4.1.4** The system will do an event lookup based on the provided API if they do exist within the system.
        - **R2.4.1.5** The system will allow a user to create a timetable based on provided selection of events from the system.
        - **R2.4.1.6** The system will allow a user to modify colours and other individual user details related to the timetable.
    - **R2.4.2** The system shall allow user customisation of API‑generated timetables.
        - **R2.4.2.1** The system shall allow users to modify individual related details of a timetable.
        - **R2.4.2.2** The system shall allow users to modify selected events from the module list.

    ### R2.5 Calendar Exporting

    - **R2.5.1** The system shall allow export of timetables as `.ics` files for calendar import.
        - **R2.5.1.1** The system shall allow for details of the `.ics` file to be altered by a user such as its summary / name.
        - **R2.5.1.2** The system shall allow users to modify the event description within the `.ics` file.
        - **R2.5.1.3** The system shall allow users to update the event location stored in the `.ics` file.
        - **R2.5.1.4** The system shall allow users to change the event start and end times in the `.ics` file.
        - **R2.5.1.5** The system shall allow users to adjust the event status such as confirmed or cancelled.
        - **R2.5.1.6** The system shall make use of a uuid such that duplicate events are accounted for.
    - **R2.5.2** The system shall allow direct sync with Google Calendar.
        - **R2.5.2.1** The system shall support creating a Google Calendar instance.

    ### R2.6 Solver System

    - **R2.6.1** The system shall automatically attempt to solve for a schedule using the CP-SAT solver once a finalised set of events is received, notifying the User once a valid timetable is produced.
        - **R2.6.1.1** The system shall enforce a selection rule as a hard constraint.
        - **R2.6.1.2** The system shall enforce an overlap rule as a hard constraint, preventing events from clashing.
        - **R2.6.1.3** The system shall optimise the schedule to centralise events around a User-given target time.
        - **R2.6.1.2** The system shall optimise the schedule to centralise events around smaller gaps between events if requested.
        - **R2.6.1.3** The system shall optimise the schedule to centralise events around a user-given day to minimise events (skip day).
    - **R2.6.2** The system shall automatically invoke the GA solver to generate a best-effort schedule when the CP-SAT solver cannot find a feasible solution, notifying the User once produced.
        - **R2.6.2.1** The system shall optimise the schedule to centralise events around a User-given target time.
        - **R2.6.2.2** The system shall optimise the schedule to centralise events around smaller gaps between events if requested.
        - **R2.6.2.3** The system shall optimise the schedule to centralise events around a user-given day to minimise events (skip day).
        - **R2.6.2.4** The system shall apply selection, crossover, and mutation operators across generations to improve candidate schedules.

---

??? info "**FR 3 — Analytics, Lecturer, & Attendance Systems**"

    ### R3.1 Analytics System
    - **R3.1.1** The system shall provide the number of Modules per Course, for Courses within a University.
    - **R3.1.2** The system shall provide the number of Events per Module, for Modules within a Course.
    - **R3.1.3** The system shall provide the number of students who have submitted attendance per Event, for Events within a Module.
    - **R3.1.4** The system shall provide the attendance detail for a specific Event, comprising the students who have submitted attendance for it.
    - **R3.1.5** The system shall provide the number of Events per Venue, over a given period.
    - **R3.1.6** The system shall provide Lecturer statistics.
        - **R3.1.6.1** The system shall provide the number of Events taught by a Lecturer.
        - **R3.1.6.2** The system shall provide attendance statistics for a Lecturer's Events.

    ### R3.2 Lecturer Adjustment System

    - **R3.2.1** The system will allow lecturers to alter details about their events.
        - **R3.2.1.1** The system shall allow lecturers to alter venue location for an event(s).
        - **R3.2.1.2** The system shall allow lecturers to alter times for an event(s).
        - **R3.2.1.3** The system shall allow lecturers to add lecturers to events/modules.
        - **R3.2.1.4** The system shall allow lecturers to alter module details (name, description, credit value).

    ### R3.3 Attendance Recording System

    - **R3.3.1** The system will allow students to record and manage their attendance intent for events.
        - **R3.3.1.1** The system shall allow students to indicate their attendance intent for an event as Will Attend, Will Not Attend, or Not Specified.
        - **R3.3.1.2** The system shall default a student's attendance intent to Not Specified if no option is selected.
        - **R3.3.1.3** The system shall allow students to remove a previously recorded attendance response for an event.
        - **R3.3.1.4** The system shall require student confirmation before removing a recorded attendance response.
        - **R3.3.1.5** The system shall update projected attendance analytics whenever a student's attendance response is recorded or removed.

---

??? info "**FR 4 — University Administration**"

    ### FR 4.1 Course management for university admins

    - **R4.1.1** The system shall provide tools to create courses for universities
    - **R4.1.2** The system shall provide tools to delete courses from universities
    - **R4.1.3** The system shall provide tools to modify courses for universities
        - **4.1.3.1** The system will shall allow updates to a courses name
        - **4.1.3.1** The system will shall allow updates to a courses degree
        - **4.1.3.3** The system will shall allow modules to be added to courses

    ### FR 4.2 Module management for university admins

    - **R4.2.1** The system shall provide tools to create modules for universities using the API system or PDF system
    - **R4.2.2** The system shall provide tools to delete modules from universities
    - **R4.2.3** The system shall provide tools to modify modules for universities
        - **4.2.3.1** The system will shall allow updates to a module name
        - **4.2.3.1** The system will shall allow updates to a module Code
        - **4.2.3.3** The system will shall allow events to be added to modules

    ### FR 4.3 Event management for university admins

    - **R4.3.1** The system shall provide tools to create events for universities using the API system or PDF system or directly using the interface
    - **R4.3.2** The system shall provide tools to delete events from universities
    - **R4.3.3** The system shall provide tools to modify events for universities
        - **4.3.3.1** The system will shall allow updates to a Event name
        - **4.3.3.2** The system will shall allow updates to a Event Code
        - **4.3.3.3** The system will shall allow updates to a Event times
        - **4.3.3.4** The system will shall allow updates to a Event type
        - **4.3.3.5** The system will shall allow updates to a Event date
        - **4.3.3.6** The system will shall allow updates to a Event day of week

    ### FR 4.4 Role management for admins and role applications

    - **R4.4.1** The system shall allow for users to apply for a particular role, defaulted to students
    - **R4.4.2** The system shall allow for university admins to approve roles for a univeristy
    - **R4.4.3** The system shall allow for university admins to revoke privileges of users

      ### FR 4.5 Calendar Management for university applications

    - **R4.5.1** The system shall allow an admin to create calendars for universities for a specific year
    - **R4.5.2** The system shall allow an admin to search for calendars for universities for a specific year
    - **R4.5.3** The system shall allow an admin to create restrictions for calendars for universities for a specific year
        - **4.5.3.1** The system will allow for the creation of a single day restriction with a date and a description
        - **4.5.3.2** The system will allow for the creation of a range date restriction with a start date, an end date and a description
        - **4.5.3.3** The system will allow for the creation of a day swap restriction with a start date, a swapped day and a description

---

??? info "**FR 5 — Simulation Service**"


    ### R5.1 Execution & Environment

    - **R5.1.1** The system shall launch the simulation via a central script accepting arguments for the target adapter and population size.
    - **R5.1.2** The system shall run as an independent, configurable Docker container with exposed ports for live metrics.

    ### R5.2 Synthetic Data Generation

    - **R5.2.1** The system shall generate synthetic student profiles based on rules in a declarative YAML schema using a Faker library.
    - **R5.2.2** The system shall sample domain-specific data from external CSV files.
    - **R5.2.3** The system shall export the generated user population into a structured JSON file.

    ### R5.3 Metrics & Reporting

    - **R5.3.1** The system shall parse raw CSV simulation statistics into a single timestamped JSON report.
    - **R5.3.2** The system shall aggregate and record overall latency (min, max, avg, median, p95, p99), requests, and failure counts per endpoint.
    - **R5.3.3** The system shall automatically clean up temporary metric files after reporting.

    ### R5.4 Adapter Bootstrapping

    - **R5.4.1** The system shall automatically scaffold new client adapters using an OpenAPI specification file.
    - **R5.4.2** The system shall auto-generate endpoint configurations, synthetic data schemas, and executable Python simulation scripts mapped to discovered API methods.

    ### R5.5 Simulated Behaviors (UMTAS Domain)

    - **R5.5.1** The system shall simulate mock account creation, secure login, and session token management.
    - **R5.5.2** The system shall simulate uploading timetable PDF files, polling for parser job status, and retrieving results.
    - **R5.5.3** The system shall simulate users browsing enrolled modules, available events, and existing timetables.
    - **R5.5.4** The system shall simulate submitting custom scheduling jobs to the solver and polling for execution status.
