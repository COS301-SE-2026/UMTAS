# API Service Contracts

!!! abstract "Section Brief"
    API service contracts define the formal interface boundaries between UMTAS sub-systems and the frontend. They are the authoritative source of truth for request/response schemas, authentication requirements, error codes, and versioning policy across all microservice boundaries. Any change to a contract requires a corresponding update to this document and a version bump.

    **Boundaries covered:** NestJS API Core ↔ Next.js Frontend · NestJS ↔ FastAPI Optimizer (internal)

---

REST API surface between NestJS core and frontend.

![API Contracts](../diagrams/api/API.drawio)
