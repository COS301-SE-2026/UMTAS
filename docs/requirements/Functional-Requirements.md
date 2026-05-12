# Functional Requirements

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
