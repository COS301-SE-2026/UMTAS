# Functional Requirements

!!! abstract "Section Brief"
    Functional requirements specify the observable behaviors the system must exhibit. Each requirement is uniquely identified (R*x*.*y*), assigned to a sub-system, and traceable to a use case via the [Traceability Matrix](Traceability-Matrix.md). Requirements follow the IEEE 830 *"the system shall..."* convention.

    **Sub-systems covered:** Core Optimizer · API Core · Frontend · Authentication

---

## Sub-system: Core Optimizer

- R1.1: The system shall generate optimized schedules using CP-SAT...

## Sub-system: API Core

- R2.1: The system shall manage user sessions and preferences...

---

## Registration & Login

The platform supports secure user onboarding and authentication.

- **OAuth 2.0**: Integration with Google Workspace for student and staff login.
- **Session Management**: Secure cookie-based sessions with BetterAuth.

## Form Validation

All user inputs are validated on both client and server sides.

- **Zod Schemas**: Used for typesafe validation of all API requests.
- **React Hook Form**: Provides real-time feedback for frontend input fields.
