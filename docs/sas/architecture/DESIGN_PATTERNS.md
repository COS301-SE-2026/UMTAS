# Design Patterns

## Scope

This page records the strongest code and component-level GoF design patterns used by UMTAS for
Demo 2. Patterns are included only where they protect a meaningful variation point in the system.

## Adapter

UMTAS uses adapters where external university formats differ from the internal timetable model.
Adapters translate source-specific payloads into canonical UMTAS course, module, event, venue, and
calendar structures before Core processing.

Strong Demo 2 adapter points:

- `UP PDF Adapter`: extracts supported UP timetable PDF content and normalizes it into UMTAS
  timetable structures.
- `University API Adapter`: normalizes external university API responses into the same canonical
  structures used by the Core API and solver.

This pattern supports maintainability and integrability: adding or changing one university source
does not require the Core timetable model or solver contract to change.

## Strategy

UMTAS uses the Strategy pattern in the scheduling solver because different timetable-generation
approaches must be selectable behind one solver contract.

Strong Demo 2 solver strategies:

- `CP-SAT No-Conflict Strategy`: uses OR-Tools CP-SAT to select timetable options that satisfy hard
  no-clash constraints.
- `Conflict-Allowing Heuristic Search Strategy`: searches for usable timetable combinations when a
  strict no-conflict solution is unavailable or when soft conflict tolerance is required.

Both strategies return results through the same solver boundary so the Core API and browser
workflow do not depend on the specific solving algorithm.