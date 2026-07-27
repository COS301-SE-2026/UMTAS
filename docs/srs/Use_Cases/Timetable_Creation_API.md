??? "**Timetable Creation (API System) Use Cases**"
    <a id="api-system"></a>
    <div align="center">
    ### **Use Case Table**
    | **Use Case ID** | **Use Case Name** | **Actor** |
    | :---: | :---: | :---: |
    | **UC-API-01** | [Import Timetable from API](#uc-api-01) | User |
    | **UC-API-02** | [Review API Retrieved Data](#uc-api-02) | User |

    </div>

    ??? tip "**Use Case Diagram**"
        ![](../diagrams/requirements/API_System.svg)

    ---
    ??? "UC-API-01: Import Timetable from API"
        <a id="uc-api-01"></a>
        ##### High Level
        ```
        Import Timetable from API (Actor: User, System: API Integration Layer)  
        TUCBW the user triggers timetable import from a university-provided API.  
        TUCEW the system retrieves module and event data from the API, performs lookup against existing records, and prepares a structured dataset for timetable creation.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | User |
        | **Precondition** | User is authenticated and API access is available |
        | **Trigger** | User selects “Import from API” |
        | **Basic Flow** | 1. User initiates API import.<br>2. System authenticates with university API (if required).<br>3. System requests timetable data from API.<br>4. System receives module and event data.<br>5. System performs module lookup against existing records.<br>6. System performs event lookup against existing records.<br>7. System maps existing entities or prepares new ones.<br>8. System constructs structured import dataset.<br>9. System forwards dataset to review stage. |
        | **Alternate Flow** | **A1: API authentication failure**<br>System aborts import and notifies user.<br><br>**A2: API unavailable or timeout**<br>System retries request and then fails gracefully with error message.<br><br>**A3: Partial API response**<br>System imports available data and flags missing entries. |
        | **Postcondition** | API data is retrieved and staged for review |
        | **Requirements Covered** | R2.4.1 \| R2.4.1.1 \| R2.4.1.2 \| R2.4.1.3 \| R2.4.1.4 |

    ---
    ??? "UC-API-02: Review API Retrieved Data"
        <a id="uc-api-02"></a>
        ##### High Level
        ```
        Review API Retrieved Data (Actor: User, System: Timetable Builder)  
        TUCBW the user reviews the timetable data retrieved from the API.  
        TUCEW the system presents modules and events for selection and confirmation, allowing the user to finalise timetable creation.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | User |
        | **Precondition** | API data has been successfully retrieved and staged |
        | **Trigger** | System displays imported API timetable data |
        | **Basic Flow** | 1. System displays retrieved modules and events.<br>2. User reviews imported data.<br>3. User selects modules/events to include in timetable.<br>4. System validates selections.<br>5. System creates timetable from selected data.<br>6. System stores timetable under user profile.<br>7. System confirms successful creation. |
        | **Alternate Flow** | **A1: No items selected**<br>System prevents timetable creation and requests selection.<br><br>**A2: Data inconsistency detected**<br>System highlights conflicting or missing fields.<br><br>**A3: User cancels import**<br>System discards staged dataset without saving. |
        | **Postcondition** | Timetable is created and stored in system |
        | **Requirements Covered** | R2.4.1.5 | R2.4.1.6
