# Design Patterns

## Adapter Pattern: University Format Isolation

University-specific parsers implement a common interface and return canonical module and event candidates. The parser registry currently maps the University of Pretoria key to its adapter.

Source-specific table detection remains outside the Core API. Adding another university format does not require a new queue or callback contract.

## Strategy Pattern: Independent Solver Engines

CP-SAT and genetic search are independent engines behind one command-line contract. The requested engine is selected at runtime.

Automatic mode follows this sequence:

1. Run CP-SAT.
2. Return its conflict-free result when feasible.
3. Start a fresh genetic search when CP-SAT reports infeasibility.
4. Return the genetic result as best effort when conflicts remain.