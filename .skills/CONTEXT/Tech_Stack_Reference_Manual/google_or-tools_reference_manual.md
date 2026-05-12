# Google OR-Tools Reference Manual (v9.13.0)

## Section 0: Quick Start

Solve a simple constraint satisfaction problem (CSP) using the CP-SAT solver.

```python
# Install OR-Tools
pip install ortools

# Solve: x != y, x, y in [0, 2]
from ortools.sat.python import cp_model
model = cp_model.CpModel()
x = model.NewIntVar(0, 2, "x")
y = model.NewIntVar(0, 2, "y")
model.Add(x != y)
solver = cp_model.CpSolver()
status = solver.Solve(model)
if status == cp_model.OPTIMAL:
    print(f"x={solver.Value(x)}, y={solver.Value(y)}")
```

Expected output: `x=0, y=1` (or another valid pair like `x=2, y=0`).

## Section 1: Key Language Terms & Features

- **CP-SAT Solver** — A state-of-the-art constraint programming solver that uses SAT (satisfiability) techniques under the hood. | `cp_model.CpSolver()` | ⚠️ Most efficient for scheduling and discrete optimization.
- **Decision Variable** — An unknown value the solver must determine (e.g., an integer or boolean). | `model.NewIntVar(0, 10, "x")` | ⚠️ Variables must have defined bounds to prevent infinite search space.
- **Linear Constraint** — A mathematical relationship between variables (e.g., `x + y <= 10`). | `model.Add(x + y <= 10)` | ⚠️ CP-SAT supports only integer coefficients and variables.
- **Objective Function** — The value you want to minimize or maximize (e.g., total cost). | `model.Minimize(x + 2*y)` | ⚠️ A model can have at most one objective function.
- **Interval Variable** — Represents a task with a start time, duration, and end time. | `model.NewIntervalVar(s, d, e, "task")` | ⚠️ Crucial for scheduling problems like Job Shop or Resource Allocation.
- **NoOverlap Constraint** — Ensures that a set of interval variables do not overlap in time. | `model.AddNoOverlap([t1, t2, t3])` | ⚠️ Use this to model a single machine or person performing tasks sequentially.
- **Cumulative Constraint** — Limits the total resource usage of overlapping tasks at any point in time. | `model.AddCumulative(tasks, demands, capacity)` | ⚠️ Ideal for modeling shared resources like CPU or electricity.
- **Element Constraint** — Allows indexing an array of constants with a decision variable. | `model.AddElement(index, values, target)` | ⚠️ Very useful for modeling variable costs or lookup tables.
- **Boolean Literal** — A boolean variable or its negation. | `b.Not()` | ⚠️ Used for logical constraints and reification (enforcing constraints conditionally).
- **Search Strategy** — Hints given to the solver on how to explore the search tree. | `model.AddDecisionStrategy([x, y], ...)` | ⚠️ CP-SAT is usually better at finding its own strategy; use sparingly.

## Section 2: Key Commands & Workflows

- `pip install ortools` — Installs the library and its C++ binary dependencies. | _Project initialization._
- `model = cp_model.CpModel()` — Creates a new optimization model. | _Defining the problem._
- `solver.Solve(model)` — Invokes the CP-SAT engine to find a solution. | _Running the optimization._
- `solver.Value(x)` — Retrieves the assigned value of a variable after solving. | _Extracting results._
- `solver.ResponseStats()` — Returns a string with solver performance metrics (time, branches, etc.). | _Performance profiling._
- `solver.parameters.max_time_in_seconds = 30.0` — Sets a timeout for the solver. | _Production safety._
- `solver.parameters.log_search_progress = True` — Enables detailed solver output. | _Debugging slow models._
- `model.ExportModel()` — Serializes the model to a protocol buffer for debugging. | _Advanced troubleshooting._

## Section 3: Architecture & Component Relationships

```
Python/C++/Java/C# Wrapper (API)
       ↓ (Protobuf)
CP-SAT Engine (Constraint Programming + SAT)
       ↓             ↓
Search Heuristics   Presolve Logic (Simplification)
       ↓             ↓
Constraint Store    Conflict-Driven Clause Learning (CDCL)
       ↓
Optimal / Feasible Solution
```

**Key Flow:** Your code defines a **Model**, which is serialized to a **Protocol Buffer**. The **CP-SAT Engine** simplifies the model via **Presolve**, then uses **CDCL** and **Search Heuristics** to navigate the search space and find an **Optimal** solution.

## Section 4: Documentation Links

- [Official CP-SAT Guide](https://developers.google.com/optimization/cp/cp_solver) — _Comprehensive introduction and tutorials._
- [CP-SAT Samples](https://github.com/google/or-tools/tree/stable/ortools/sat/samples) — _Reference implementations for common problems._
- [OR-Tools Discussion Group](https://groups.google.com/g/or-tools-discuss) — _Community support and Q&A._
- [GitHub Repository](https://github.com/google/or-tools) — _Source code and release notes._
- [Scheduling Examples](https://developers.google.com/optimization/scheduling/job_shop) — _Deep dive into complex scheduling models._
