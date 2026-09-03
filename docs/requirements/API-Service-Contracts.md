# API Service Contracts

!!! abstract "Section Brief"
    API service contracts define the formal interface boundaries between UMTAS sub-systems and the frontend. They are the authoritative source of truth for request/response schemas, authentication requirements, error codes, and versioning policy across all microservice boundaries. Any change to a contract requires a corresponding update to this document and a version bump.

    **Boundaries covered:** NestJS API Core ↔ Next.js Frontend; Core ↔ PDF Parser Worker; Core ↔ Solver Worker; Core ↔ Google OAuth provider

---

## :material-rocket-launch: UMTAS Core API (NestJS)

<swagger-ui src="https://capstone-vigil.dns.net.za/api/docs-json" />

The Swagger document is the comprehensive UMTAS system-contract overview. Its
**Paths** section contains callable HTTP operations. Its **Schemas** section also
contains the BullMQ queue payloads, worker inputs and results, HTTP callback
unions, and native solver CLI input/output contracts. Queue and CLI schemas are
documentation models and do not represent callable HTTP endpoints.
