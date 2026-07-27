??? "**Analytics Dashboard Use Cases**"
    <a id="analytics-dashboard-id"></a>
    <div align="center">

    ### **Use Case Table**
    | **Use Case ID** | **Use Case Name** | **Actor** |
    |:---:|:---:|:---:|
    | **UC-AN-01** | [View Attendance Analytics Dashboard](#uc-an-01) | Admin / Lecturer |
    | **UC-AN-02** | [Explore Venue and Booking Analytics](#uc-an-02) | Admin / Lecturer |
    | **UC-AN-03** | [View Lecturer Analytics](#uc-an-03) | Admin / Lecturer |

    </div>

    ??? tip "**Use Case Diagram**"
        ![](../diagrams/requirements/Analytics_Dashboard.svg)

    ---  
    ??? "UC-AN-01: View Attendance Analytics Dashboard"
        <a id="uc-an-01"></a>
        ##### High Level
        ```
        View Attendance Analytics Dashboard (Actor: University Admin / Lecturer, System: Analytics Engine)  
        TUCBW the user opens the analytics dashboard for a selected module or dataset.  
        TUCEW the system displays aggregated attendance insights, including submitted students, actual attendance, and projected attendance for the selected context, with interactive breakdowns by time slot.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | Admin / Lecturer |
        | **Precondition** | User is authenticated and has access to at least one module |
        | **Trigger** | User opens the analytics dashboard |
        | **Basic Flow** | 1. User navigates to analytics section.<br>2. System prompts user to select a module or dataset.<br>3. User selects a module.<br>4. System retrieves attendance data (submitted, actual, projected).<br>5. System aggregates and processes attendance statistics.<br>6. System displays dashboard with attendance overview and breakdown per time slot.<br>7. User can filter or switch between modules. |
        | **Alternate Flow** | **A1: No data available**<br>System displays empty state indicating no attendance records exist.<br><br>**A2: Module not found or inaccessible**<br>System shows error and returns user to selection screen.<br><br>**A3: Data retrieval failure**<br>System displays error and allows retry. |
        | **Postcondition** | Attendance analytics are displayed for selected module |
        | **Requirements Covered** | R3.1.1.1 \| R3.1.1.1.1 \| R3.1.1.1.2 \| R3.1.1.1.3 |

    ---
    ??? "UC-AN-02: Explore Venue and Booking Analytics"
        <a id="uc-an-02"></a>
        ##### High Level
        ```
        Explore Venue and Booking Analytics (Actor: University Admin / Lecturer, System: Analytics Engine)  
        TUCBW the user selects spatial or temporal usage analytics within the system.  
        TUCEW the system presents venue heatmaps and booking trend visualisations over time, allowing the user to explore usage patterns across locations and dates.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | Admin / Lecturer |
        | **Precondition** | User is authenticated and analytics data exists |
        | **Trigger** | User selects venue or booking analytics view |
        | **Basic Flow** | 1. User selects “Venue & Booking Analytics”.<br>2. System retrieves venue usage data and booking records.<br>3. System generates venue heatmap based on module/event frequency.<br>4. System generates booking trend data over time.<br>5. System displays visualisations (heatmap + trend graphs).<br>6. User applies filters (date range, venue, module). |
        | **Alternate Flow** | **A1: No venue data available**<br>System displays empty heatmap with message.<br><br>**A2: No booking data available**<br>System shows empty trend graph.<br><br>**A3: Data processing failure**<br>System displays error and allows retry. |
        | **Postcondition** | Venue usage and booking analytics are displayed |
        | **Requirements Covered** | R3.1.1.2 \| R3.1.1.2.1 \| R3.1.1.2.2 \| R3.1.1.2.3 |

    ---
    ??? "UC-AN-03: View Lecturer Analytics"
        <a id="uc-an-03"></a>
        ##### High Level
        ```
        View Lecturer Analytics (Actor: University Admin / Lecturer, System: Analytics Engine)  
            TUCBW the user opens the lecturer analytics view for a selected lecturer or set of lecturers.  
            TUCEW the system displays aggregated performance and workload insights across the lecturer's modules, including attendance trends attributable to their sessions, teaching load, and comparative statistics over time.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | Admin / Lecturer |
        | **Precondition** | User is authenticated; Admin has access to lecturer records, or Lecturer is viewing their own restricted analytics |
        | **Trigger** | User opens the lecturer analytics view |
        | **Basic Flow** | 1. User navigates to lecturer analytics section.<br>2. System prompts user to select a lecturer or, for a Lecturer actor, defaults to their own profile.<br>3. System retrieves attendance and session data across the lecturer's modules.<br>4. System aggregates statistics (attendance trends, teaching load, module comparison).<br>5. System displays lecturer analytics dashboard with breakdowns by module and time period.<br>6. Admin can switch between lecturers; Lecturer can filter by own modules only. |
        | **Alternate Flow** | **A1: No data available**<br>System displays empty state indicating no records exist for the selected lecturer.<br><br>**A2: Lecturer not found or inaccessible**<br>System shows error and returns user to selection screen.<br><br>**A3: Data retrieval failure**<br>System displays error and allows retry.<br><br>**A4: Lecturer attempts to view another lecturer's analytics**<br>System denies access and displays a permissions error. |
        | **Postcondition** | Lecturer analytics are displayed for the selected lecturer(s) |
        | **Requirements Covered** | R3.1.1.3 \| R3.1.1.3.1 \| R3.1.1.3.2 \| R3.1.1.3.3 |
