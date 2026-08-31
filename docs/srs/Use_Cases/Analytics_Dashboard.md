??? "**Analytics Dashboard Use Cases**"
    <a id="analytics-dashboard-id"></a>
    <div align="center">

    ### **Use Case Table**
    | **Use Case ID** | **Use Case Name** | **Actor** |
    |:---:|:---:|:---:|
    | **UC-AN-01** | [View Course Statistics](#uc-an-01) | Admin / Lecturer |
    | **UC-AN-02** | [View Module Statistics](#uc-an-02) | Admin / Lecturer |
    | **UC-AN-03** | [View Event Statistics](#uc-an-03) | Admin / Lecturer |
    | **UC-AN-04** | [View Event Attendance Detail](#uc-an-04) | Admin / Lecturer |
    | **UC-AN-05** | [View Venue Analytics](#uc-an-05) | Admin / Lecturer |
    | **UC-AN-06** | [View Lecturer Analytics](#uc-an-06) | Admin / Lecturer |

    </div>

    ??? tip "**Use Case Diagram**"
        ![](../../diagrams/requirements/Analytics_Dashboard.svg)

    ??? warning "**Traceability Matrix**"
        <div align="center">
        ![](./Traceability_Matrix/FR3_1.svg)
        </div>

    ---
    ??? "UC-AN-01: View Course Statistics"
        <a id="uc-an-01"></a>
        ##### High Level
        ```
        View Course Statistics (Actor: University Admin / Lecturer, System: Analytics Engine)
            TUCBW the user opens the analytics page for their currently selected University.
            TUCEW the system displays the Courses within the user's authorised scope, each annotated with its number of Modules.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | Admin / Lecturer |
        | **Precondition** | User is authenticated and has a University selected. Lecturer is associated with at least one Course in that University. |
        | **Trigger** | User opens the analytics page |
        | **Basic Flow** | 1. System identifies the Courses within the user's authorised scope (all Courses for an Admin, or only associated Courses for a Lecturer).<br>2. System retrieves the Module count for each Course.<br>3. System displays the list of Courses, each annotated with its Module count. |
        | **Alternate Flow** | **A1: No Courses available**<br>System displays an empty state (e.g. Lecturer with no associated Courses). |
        | **Postcondition** | Course statistics are displayed for the user's scope |
        | **Requirements Covered** | R3.1.1 |

    ---
    ??? "UC-AN-02: View Module Statistics"
        <a id="uc-an-02"></a>
        ##### High Level
        ```
        View Module Statistics (Actor: University Admin / Lecturer, System: Analytics Engine)
            TUCBW the user selects a Course from the Course statistics view.
            TUCEW the system displays the Modules within that Course, each annotated with its number of Events.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | Admin / Lecturer |
        | **Precondition** | User has viewed Course statistics (UC-AN-01) and selects a Course within their authorised scope |
        | **Trigger** | User selects a Course |
        | **Basic Flow** | 1. User selects a Course.<br>2. System verifies the user is authorised to view that Course.<br>3. System retrieves the Modules within the Course and their Event counts.<br>4. System displays the list of Modules, each annotated with its Event count. |
        | **Alternate Flow** | **A1: No Modules available**<br>System displays an empty state.<br><br>**A2: Course not accessible**<br>System shows a permissions error and returns the user to UC-AN-01. |
        | **Postcondition** | Module statistics are displayed for the selected Course |
        | **Requirements Covered** | R3.1.2 |

    ---
    ??? "UC-AN-03: View Event Statistics"
        <a id="uc-an-03"></a>
        ##### High Level
        ```
        View Event Statistics (Actor: University Admin / Lecturer, System: Analytics Engine)
            TUCBW the user selects a Module from the Module statistics view.
            TUCEW the system displays the Events within that Module, each annotated with its submitted attendance count.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | Admin / Lecturer |
        | **Precondition** | User has viewed Module statistics (UC-AN-02) and selects a Module within their authorised scope |
        | **Trigger** | User selects a Module |
        | **Basic Flow** | 1. User selects a Module.<br>2. System verifies the user is authorised to view that Module.<br>3. System retrieves the Events within the Module and their submitted attendance counts.<br>4. System displays the list of Events, each annotated with its attendance count. |
        | **Alternate Flow** | **A1: No Events available**<br>System displays an empty state.<br><br>**A2: Module not accessible**<br>System shows a permissions error and returns the user to UC-AN-02. |
        | **Postcondition** | Event statistics are displayed for the selected Module |
        | **Requirements Covered** | R3.1.3 |

    ---
    ??? "UC-AN-04: View Event Attendance Detail"
        <a id="uc-an-04"></a>
        ##### High Level
        ```
        View Event Attendance Detail (Actor: University Admin / Lecturer, System: Analytics Engine)
            TUCBW the user selects an Event from the Event statistics view.
            TUCEW the system displays the attendance detail for that Event.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | Admin / Lecturer |
        | **Precondition** | User has viewed Event statistics (UC-AN-03) and selects an Event within their authorised scope |
        | **Trigger** | User selects an Event |
        | **Basic Flow** | 1. User selects an Event.<br>2. System verifies the user is authorised to view that Event.<br>3. System retrieves the students who have submitted attendance for the Event.<br>4. System displays the attendance detail. |
        | **Alternate Flow** | **A1: No attendance submitted**<br>System displays an empty state.<br><br>**A2: Event not accessible**<br>System shows a permissions error and returns the user to UC-AN-03. |
        | **Postcondition** | Attendance detail is displayed for the selected Event |
        | **Requirements Covered** | R3.1.4 |

    ---
    ??? "UC-AN-05: View Venue Analytics"
        <a id="uc-an-05"></a>
        ##### High Level
        ```
        View Venue Analytics (Actor: University Admin / Lecturer, System: Analytics Engine)
            TUCBW the user opens the Venue analytics view.
            TUCEW the system displays the number of Events held per Venue over a given period, within the user's authorised scope.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | Admin / Lecturer |
        | **Precondition** | User is authenticated and has a University selected |
        | **Trigger** | User selects the Venue analytics view |
        | **Basic Flow** | 1. User selects "Venue Analytics".<br>2. System retrieves Event counts per Venue within the user's scope, for a given period.<br>3. System displays the resulting statistics.<br>4. User applies filters (date range, Venue). |
        | **Alternate Flow** | **A1: No data available**<br>System displays an empty state indicating no Events exist for the selection. |
        | **Postcondition** | Venue statistics are displayed |
        | **Requirements Covered** | R3.1.5 |

    ---
    ??? "UC-AN-06: View Lecturer Analytics"
        <a id="uc-an-06"></a>
        ##### High Level
        ```
        View Lecturer Analytics (Actor: University Admin / Lecturer, System: Analytics Engine)
            TUCBW the user opens the Lecturer analytics view for a selected Lecturer (Admin) or their own profile (Lecturer).
            TUCEW the system displays the number of Events taught and attendance statistics for that Lecturer's Events, within the user's authorised scope.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | Admin / Lecturer |
        | **Precondition** | User is authenticated. Admin has a University selected; Lecturer is viewing their own data. |
        | **Trigger** | User opens the Lecturer analytics view |
        | **Basic Flow** | 1. User navigates to the Lecturer analytics section.<br>2. System prompts an Admin to select a Lecturer; a Lecturer actor defaults to their own profile.<br>3. System retrieves Event and attendance data for the Lecturer's Courses.<br>4. System displays the number of Events taught and associated attendance statistics. |
        | **Alternate Flow** | **A1: No data available**<br>System displays an empty state indicating no records exist for the selected Lecturer.<br><br>**A2: Lecturer attempts to view another Lecturer's analytics**<br>System denies access and displays a permissions error. |
        | **Postcondition** | Lecturer analytics are displayed for the selected Lecturer |
        | **Requirements Covered** | R3.1.6 \| R3.1.6.1 \| R3.1.6.2 |