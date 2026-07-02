# Design Patterns

## Adapter

UMTAS uses adapters where external university formats differ from the internal timetable model.
Adapters translate source-specific payloads into canonical UMTAS course, module, event, venue, and
calendar structures before Core processing.

- `UP PDF Adapter`: extracts supported UP timetable PDF content and normalizes it into UMTAS
  timetable structures.
- `University API Adapter`: normalizes external university API responses into the same canonical
  structures used by the Core API and solver.

This pattern supports maintainability and integrability: adding or changing one university source
does not require the Core timetable model or solver contract to change.

## Strategy

UMTAS uses the Strategy pattern in the scheduling solver because different timetable-generation
approaches must be selectable behind one solver contract.

- `CP-SAT No-Conflict Strategy`: uses OR-Tools CP-SAT to select timetable options that satisfy hard
  no-clash constraints.
- `Genetic Algorithm Search Strategy`: searches for usable timetable combinations when a
  strict no-conflict solution is unavailable or when soft conflict tolerance is required.

Both strategies return results through the same solver boundary so the Core API and browser
workflow do not depend on the specific solving algorithm.