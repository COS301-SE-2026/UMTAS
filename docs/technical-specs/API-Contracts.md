# API Service Contracts

Technical definitions of the interfaces between subsystems and external services.

---

## REST API Endpoints

### [Service Name]

#### `GET /api/v1/resource`

- **Description:** [What it does]
- **Request Params:** `[Name] (Type)`
- **Success Response (200):**
  ```json
  {
    "id": 1,
    "name": "example"
  }
  ```
- **Error Response (400):** [Description]

---

## Communication Protocols

- **Internal:** [e.g. gRPC / Message Bus]
- **External:** [e.g. REST / GraphQL]
