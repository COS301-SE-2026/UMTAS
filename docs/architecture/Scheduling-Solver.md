# Architectural Component: Scheduling Solver

The Scheduling Solver is the computationally intensive core of UMTAS. It receives a normalised constraint specification (modules, venues, time slots, lecturer availability, student group requirements) from the Core API and produces a feasible timetable solution, or reports infeasibility with diagnostic information. It is deployed as a stateless, independently scalable service that communicates with the Core API via HTTP.

The Scheduling Solver depends on: the Core API (for job input and result delivery). It has no direct access to the data store — all data is passed in the job payload. The Core API depends on the Scheduling Solver for timetable generation results.

---

## 3.1 Architectural Quality Requirements

### 3.1.1 Performance

Timetable generation is the most computationally demanding operation in the system. The solver must return a result within a configurable timeout (default: 60 seconds for problem sizes typical of a single university's weekly timetable). If the timeout is reached before a proven optimal solution is found, the solver must return the best feasible solution found so far, clearly flagged as a time-limited result. Solver runtime is monitored continuously; outliers are logged for analysis.

### 3.1.2 Scalability

Multiple universities may submit generation requests concurrently. The solver is stateless — it holds no persistent state between job executions — allowing multiple solver instances to run in parallel, each consuming jobs from the shared Optimiser Job Queue. Horizontal scaling is achieved by increasing the number of solver container replicas; no coordination between replicas is required.

### 3.1.3 Reliability

If a solver instance crashes mid-job, the job must not be lost. The message queue's acknowledgement-based delivery model ensures that the job is redelivered to another available solver instance. Dead-letter handling captures jobs that repeatedly fail, preventing runaway retries.

### 3.1.4 Flexibility

The scheduling algorithm must be replaceable or supplemented without changes to the solver service infrastructure. The Strategy pattern provides a clean interface behind which different algorithms can be plugged in. New strategies (alternative constraint formulations, heuristic variants, learning-based approaches) can be added as new Strategy implementations without modifying the Solver service or the Core API.

### 3.1.5 Integrability

The solver exposes an HTTP REST interface that the Core API calls to submit jobs. The interface is self-documenting (OpenAPI-compatible) and language-agnostic, ensuring that the choice of implementation language for the solver imposes no constraint on the Core API's implementation language.

---

## 3.2 Architectural Responsibility

The Scheduling Solver is responsible for:

- **Job Acceptance:** Receiving solve requests (constraint specification payloads) via its HTTP endpoint.
- **Strategy Selection:** Determining which scheduling algorithm to apply based on job parameters (problem size, time limit, requested optimality level).
- **Constraint Solving:** Executing the selected algorithm against the provided constraints and producing a complete or partial solution.
- **Result Emission:** Returning the solution (or infeasibility report) to the Core API via the completion event channel.
- **Timeout Enforcement:** Enforcing the per-job time limit, returning the best partial solution when the limit is reached.

!!! example "Figure 9: Scheduling Solver — Strategy Pattern"

    ```kroki-plantuml
    @startuml Figure9_StrategyPattern
    !theme plain
    top to bottom direction

    component "Optimiser Service" as OPT
    interface "Scheduling Strategy Interface\n— accept constraints, return solution\nor infeasibility report" as SI

    rectangle "Concrete Strategies" #fef9c3 {
        component "Constraint Programming Strategy (Primary)\n— optimal, complete" as CP
        component "Heuristic Strategy (Fallback)\n— greedy / local search, faster" as HE
        component "Future Strategy (Extensible)" as FU
    }

    OPT --> SI
    SI <|.. CP
    SI <|.. HE
    SI <|.. FU

    @enduml
    ```

---

## 3.3 Frameworks and Technologies

### HTTP Service Framework (Python)

| Framework | Assessment |
|---|---|
| **FastAPI** | Modern, async Python framework built on ASGI. Pydantic-based schema validation provides automatic request/response validation and OpenAPI documentation generation. Designed for microservice-style, computation-focused APIs with minimal boilerplate. Native async support allows the HTTP layer to remain responsive while solver computation runs in a thread pool. |
| **Flask** | Minimalist synchronous Python framework. Lacks built-in request validation and automatic schema documentation. Synchronous by default — serving HTTP while a long-running solver computation blocks would require additional threading configuration. Higher boilerplate for a well-structured API. |
| **Django REST Framework** | Full-featured REST framework built on Django. Django's ORM, admin interface, and session management are unnecessary overhead for a stateless computation service. The framework's weight and Django's conventions impose complexity that provides no benefit in this context. |

### Constraint Solver / Optimisation Library

| Library | Assessment |
|---|---|
| **Google OR-Tools (CP-SAT)** | Google's open-source operations research toolkit. CP-SAT is a hybrid Constraint Programming / SAT solver capable of handling large combinatorial scheduling problems (thousands of variables) with hard constraints (no double-booking of venues or lecturers) and soft constraints (preference satisfaction). Actively maintained, first-class Python bindings, able to return best solutions at timeout — directly satisfying the partial-result requirement. |
| **OptaPlanner / Timefold** | Java-based constraint satisfaction planning framework, available in Python via the Timefold Solver library. Strong for shift scheduling domains but introduces a JVM dependency (or Python-to-Java interop overhead) that adds complexity to the Python service environment. Less suited to pure CP problems with disjunctive constraints. |
| **PuLP / COIN-BC** | Python linear programming and mixed-integer programming library. Appropriate for LP/MIP formulations but significantly less suited than CP-SAT for timetabling problems with disjunctive constraints (no two modules sharing a venue simultaneously), which are naturally expressed in CP but require large binary variable expansions in MIP. Solving times are substantially longer for equivalent problem sizes. |

---

## 3.4 Architectural Realization Mapping

- The **HTTP endpoint** is realised by a FastAPI route that accepts a constraint payload (validated by a Pydantic schema) and dispatches it to the solver engine.
- The **Strategy interface** is realised as a Python abstract base class (ABC) with a single `solve(constraints) -> Solution` method signature.
- The **Constraint Programming Strategy** is realised by a concrete class that constructs and solves a CP-SAT model using OR-Tools, with a solver callback enforcing the timeout and capturing the best partial solution.
- The **Heuristic Strategy** is realised by a concrete class implementing a greedy or local-search algorithm, returning a feasible (but not necessarily optimal) solution faster.
- The **Strategy selector** is realised as a factory function that instantiates the appropriate concrete strategy based on job parameters.

| Responsibility | Realised By |
|---|---|
| HTTP endpoint | FastAPI route with Pydantic validation |
| Strategy interface | Python abstract base class (ABC) |
| CP solver implementation | CP-SAT model construction + OR-Tools solver |
| Heuristic implementation | Greedy/local-search algorithm class |
| Strategy selection | Factory function based on job parameters |
| Timeout enforcement | Solver callback capturing best partial solution at timeout |

---

## 3.5 Technology Choice

The Scheduling Solver will be implemented using **FastAPI** as the HTTP service framework and **Google OR-Tools (CP-SAT)** as the constraint solving engine.

FastAPI was chosen because it provides automatic OpenAPI documentation (satisfying the integrability requirement for a self-documenting interface), native async support (keeping the HTTP layer responsive under load), and Pydantic-based validation (ensuring malformed constraint payloads are rejected before reaching the solver). Its minimal overhead is appropriate for a computation-focused microservice.

Google OR-Tools CP-SAT was chosen because it is the industry-standard open-source solver for combinatorial scheduling problems of the size and structure encountered in academic timetabling. Its ability to return best-found partial solutions at a user-defined timeout directly satisfies the system's performance reliability requirement. The CP-SAT model formulation maps naturally to the domain's constraints (hard: no overlapping bookings; soft: lecturer and student preferences). The library's active maintenance by Google and extensive documentation reduce implementation risk.
