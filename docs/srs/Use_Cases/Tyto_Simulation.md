??? "**Tyto Simulation System Use Cases**"
    <a id="tyto-simulation-id"></a>
    <div align="center">

    ### **Use Case Table**
    | **Use Case ID** | **Use Case Name** | **Actor** |
    |:---:|:---:|:---:|
    | **UC-TY-01** | [Run Simulation Batch](#uc-ty-01) | Tyto Administrator |
    | **UC-TY-02** | [View Simulation Analytics](#uc-ty-02) | Tyto Administrator |
    | **UC-TY-03** | [Display Stress-Test Results](#uc-ty-03) | Tyto Administrator |

    </div>

    ??? tip "**Use Case Diagram**"
        ![](../diagrams/requirements/Tyto_Simulation.svg)

    ---
    ??? "UC-TY-01: Run Simulation Batch"
        <a id="uc-ty-01"></a>
        ##### High Level
        ```
        Run Simulation Batch (Actor: Tyto Administrator, System: Simulation Engine)  
            TUCBW the administrator initiates a simulation job with defined load parameters.  
            TUCEW the system generates synthetic users, simulates concurrent timetable requests at scale, and records performance metrics for the batch.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | Tyto Administrator |
        | **Precondition** | System is configured for simulation; load parameters (e.g. concurrent user count, duration, module distribution) are defined |
        | **Trigger** | Administrator initiates a simulation batch |
        | **Basic Flow** | 1. Administrator configures simulation parameters, including target concurrent user count (up to 20,000).<br>2. System generates synthetic users with randomised modules and preferences.<br>3. System ramps up and simulates concurrent timetable generation requests.<br>4. System monitors resource usage (CPU, memory, DB connections) during the run.<br>5. System records performance metrics (latency, throughput, error rate, failures) throughout execution.<br>6. Simulation batch completes and results are persisted. |
        | **Alternate Flow** | **A1: Resource overload**<br>System throttles or pauses request generation to prevent cascading failure, logging the throttle event.<br><br>**A2: Simulation failure**<br>System halts the batch, logs the error and partial metrics collected, and notifies the administrator.<br><br>**A3: Invalid parameters**<br>System rejects the configuration and prompts the administrator to correct it before starting. |
        | **Postcondition** | Simulation batch results and performance metrics are stored for analysis |

    ---
    ??? "UC-TY-02: View Simulation Analytics"
        <a id="uc-ty-02"></a>
        ##### High Level
        ```
        View Simulation Analytics (Actor: Tyto Administrator, System: Simulation Engine)  
            TUCBW the administrator opens the simulation dashboard for a completed batch.  
            TUCEW the system displays aggregated performance metrics, including latency, throughput, and failure rates, with bottlenecks highlighted.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | Tyto Administrator |
        | **Precondition** | At least one simulation batch has completed |
        | **Trigger** | Administrator opens the simulation analytics dashboard |
        | **Basic Flow** | 1. Administrator navigates to the simulation dashboard.<br>2. System prompts administrator to select a completed simulation batch.<br>3. System loads recorded performance metrics for the selected batch.<br>4. System displays metrics (latency, throughput, error/failure rates) in aggregate and over time.<br>5. System highlights bottlenecks or anomalies detected during the run.<br>6. Administrator can filter or compare across multiple batches. |
        | **Alternate Flow** | **A1: No simulation data**<br>System displays an empty state indicating no completed batches exist.<br><br>**A2: Batch not found or inaccessible**<br>System shows an error and returns administrator to the selection screen.<br><br>**A3: Data retrieval failure**<br>System displays an error and allows retry. |
        | **Postcondition** | Simulation performance insights are displayed for the selected batch |

    ---
    ??? "UC-TY-03: Display Stress-Test Results"
        <a id="uc-ty-03"></a>
        ##### High Level
        ```
        Display Stress-Test Results (Actor: Tyto Administrator, System: Simulation Engine)  
            TUCBW the administrator requests results for a stress test run against a target concurrent load (e.g. 20,000 users).  
            TUCEW the system presents pass/fail thresholds, breaking points, and degradation curves showing how the system behaved as load increased.
        ```
        ##### Expanded
        | Field | Detail |
        | :--- | :--- |
        | **Actor** | Tyto Administrator |
        | **Precondition** | A stress-test simulation batch has completed and target thresholds (e.g. max acceptable latency, error rate) are defined |
        | **Trigger** | Administrator opens the stress-test results view |
        | **Basic Flow** | 1. Administrator selects a completed stress-test batch.<br>2. System retrieves recorded metrics against increasing concurrent load, up to the defined target (e.g. 20,000 users).<br>3. System calculates whether defined performance thresholds were met at each load stage.<br>4. System identifies the breaking point (if any) where latency, error rate, or throughput degraded beyond acceptable limits.<br>5. System displays a pass/fail summary alongside degradation curves and the identified breaking point.<br>6. Administrator can drill into a specific load stage for detailed metrics. |
        | **Alternate Flow** | **A1: No breaking point reached**<br>System reports that the target concurrent load was sustained within thresholds and marks the test as passed.<br><br>**A2: Threshold not defined**<br>System displays raw metrics only and prompts administrator to define thresholds for pass/fail evaluation.<br><br>**A3: Data retrieval failure**<br>System displays an error and allows retry. |
        | **Postcondition** | Stress-test pass/fail outcome and degradation analysis are available |
