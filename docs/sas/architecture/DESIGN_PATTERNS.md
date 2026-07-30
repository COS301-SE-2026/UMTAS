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

## Builder Pattern: Type-Safe Frontend API Calls

Frontend API calls use a generic `RequestBuilder<PathType, RequestType, ResponseType>`. Endpoint-specific builders set the OpenAPI path and HTTP method, while callers supply typed path parameters and request bodies through `send`.

The shared builder derives its types from the generated API schema and centralizes URL construction, headers, credentials, path substitution, body validation, and response handling. Multipart uploads remain separate because they require `FormData`.

## Factory Pattern: Reusable Test Data

Backend tests use factories from `apps/backend/src/Testing/Factories` to create valid entities, DTOs, relationships, jobs, authentication records, and mock sessions with generated defaults.

Each factory returns a fresh object and applies optional overrides last. Tests specify only scenario-relevant values, while shared defaults and schema changes remain centralized.
