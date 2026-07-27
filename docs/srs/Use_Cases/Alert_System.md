??? "**Alert System Use Cases**"
    <a id="alert-system-id"></a>
    <div align="center">

    ### **Use Case Table**
    | **Use Case ID** | **Use Case Name** | **Actor** |
    | :---: | :---: | :---: |
    | **UC-AL-01** | [Event Change Alerts](#uc-al-01) | User |

    </div>

    ??? tip "**Use Case Diagram**"
        ![](../diagrams/requirements/Alert_System.svg)

    ---
    ??? "UC-AL-01: Event Change Alerts"
        <a id="uc-al-01"></a>
        ##### High Level
        ```
        Event Change Alerts (Actor: User, Notification Service)  
        TUCBW an event, linked to the user, is updated, including changes to venue, time, or status (such as cancellation).  
        TUCEW the system automatically generates and sends alerts to affected users, notifying them of the specific changes to the event details and ensuring their schedules remain up to date.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | User |
        | **Precondition** | An event exists and a change has been made (venue, time, or status) |
        | **Trigger** | Lecturer or system updates an event’s details |
        | **Basic Flow** | 1. System detects a change to an event (venue, time, or status).<br>2. System identifies all affected users (students and lecturers linked to the event).<br>3. System determines type of change (venue change, time change, cancellation).<br>4. System generates alert message content based on change type.<br>5. System sends notifications via available channels (in-app/email depending on configuration).<br>6. System logs alert delivery status for audit purposes. |
        | **Alternate Flow** | **A1: No affected users found**<br>System does not send alerts and logs event change only.<br><br>**A2: Notification delivery failure**<br>System retries sending alert or marks as failed for later retry.<br><br>**A3: Partial delivery failure**<br>System sends alerts to successful recipients and logs failed deliveries. |
        | **Postcondition** | All affected users are notified of event changes or failure is logged |
