# Architectural Constraints

## Active Constraints

| **ID** | **Constraint** | **Architectural effect** | **State** |
|---|---|---|---|
| **AC-1** | University-specific sources shall remain behind adapters. | Parser output uses canonical contracts owned by the Core. | Implemented for University of Pretoria PDFs. |
| **AC-2** | Development shall not require a live university API. | Uploaded PDFs and fixtures provide source data. | Implemented. |
| **AC-3** | The initial parser shall support University of Pretoria lecture, semester-test, and exam PDFs. | The adapter validates supported layouts, file size, and page count. | Implemented. |
| **AC-4** | Parser and solver processes shall not own application data. | Workers use temporary files and Core-owned callbacks. | Implemented. |
| **AC-5** | The solver shall expose CP-SAT and genetic search through one stable process contract. | Engines remain independent behind the same input and result shapes. | Implemented. |
| **AC-6** | Public traffic shall enter through one HTTPS ingress boundary. | Internal services remain behind Traefik routing. | Configured. |
| **AC-7** | Major services shall be containerised for Linux deployment. | Mixed runtimes use Docker and Docker Compose. | Configured. |
| **AC-8** | Credentials and connection strings shall not be committed. | Runtime and workflow configuration inject secrets. | Repository policy. |
| **AC-9** | Backend endpoints shall expose a machine-readable specification. | NestJS publishes Swagger schemas and routes. | Implemented. |
| **AC-10** | Development, staging, and production shall use distinct configuration. | Separate Compose definitions and workflow targets are maintained. | Configured. |