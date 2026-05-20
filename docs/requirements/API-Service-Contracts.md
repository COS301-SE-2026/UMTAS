# API Service Contracts

!!! abstract "Section Brief"
    API service contracts define the formal interface boundaries between UMTAS sub-systems and the frontend. They are the authoritative source of truth for request/response schemas, authentication requirements, error codes, and versioning policy across all microservice boundaries. Any change to a contract requires a corresponding update to this document and a version bump.

    **Boundaries covered:** NestJS API Core ↔ Next.js Frontend

---

## :material-rocket-launch: UMTAS Core API (NestJS)

<swagger-ui src="https://petstore.swagger.io/v2/swagger.json" />
