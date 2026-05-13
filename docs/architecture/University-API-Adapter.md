# Architectural Component: University API Adapter

The University API Adapter subsystem is responsible for fetching structured timetable data from external university APIs (where a university exposes a machine-readable API rather than a PDF), normalising it into the Core API's internal format, and delivering the payload to the Core API for persistence. It is implemented using the Adapter pattern with an abstract parent and per-university concrete implementations, exactly mirroring the PDF Parser structure.

The University API Adapter depends on: the external university APIs (to fetch raw data) and the Core API (to deliver normalised payloads). The Core API depends on the Adapter for external data synchronisation. No other component depends on the Adapter directly.

---

## 5.1 Architectural Quality Requirements

### 5.1.1 Integrability

The adapter subsystem must provide a uniform interface to the Core API regardless of the underlying external API's structure, authentication mechanism, or data format. New universities are integrated by adding a concrete adapter implementation without any changes to the Core API or the abstract parent interface. Integration tests must be written for each concrete adapter using test doubles for the external API, verifying normalisation correctness.

### 5.1.2 Reliability

External APIs may be unavailable, rate-limited, or return partial data. The adapter must handle connection failures and HTTP error responses gracefully, retrying transient failures with exponential backoff and surfacing persistent failures to the Core API as structured error payloads rather than unhandled exceptions. Partial responses must be handled safely — if only part of the dataset is returned, the adapter must indicate this so the Core API can decide whether to commit a partial update.

### 5.1.3 Security

External API credentials (API keys, OAuth tokens for university systems) must not be hardcoded. They must be supplied via environment configuration and injected at runtime. The adapter must validate the structure and types of all received data before forwarding the normalised payload to the Core API — external data is untrusted input.

### 5.1.4 Flexibility

Adding support for a new university's API must require no changes to the abstract interface or to any existing concrete adapter. The abstract parent defines the contract; each university's API peculiarities are fully encapsulated within its concrete implementation.

---

## 5.2 Architectural Responsibility

The University API Adapter is responsible for:

- **Configuration Resolution:** Determining the correct concrete adapter and API credentials for a given university identifier.
- **External API Communication:** Making authenticated HTTP requests to the external university API to fetch modules, venues, lecturers, and enrolment data.
- **Data Transformation:** Converting the raw external API response into the Core API's normalised payload format, applying field mapping and type coercion.
- **Error Handling:** Detecting and classifying failures (connectivity, authentication, rate limiting, schema mismatch) and returning structured error responses to the Core API.
- **Data Validation:** Validating that the normalised payload conforms to the expected schema before delivery to the Core API.

!!! example "Figure 14: University API Adapter — Adapter Pattern"

    ```kroki-plantuml
    @startuml Figure14_UniversityAPIAdapter
    !theme plain
    top to bottom direction

    component "Core API" as CORE

    rectangle "University API Adapter" #ffedd5 {
        component "API Adapter Parent (Abstract)" as AP
        component "University A API Adapter" as AA
        component "University B API Adapter" as AB
        component "Mock API Adapter\n(Testing)" as AM
        AP <|-- AA
        AP <|-- AB
        AP <|-- AM
    }

    rectangle "External APIs" {
        component "University A External API" as EXTA
        component "University B External API" as EXTB
    }

    CORE --> AP : Request sync (university ID)
    AA --> EXTA : REST
    AB --> EXTB : REST

    @enduml
    ```

!!! example "Figure 15: University API Sync Data Flow"

    ```kroki-plantuml
    @startuml Figure15_APISyncFlow
    !theme plain

    participant "University Admin" as Admin
    participant "Admin Frontend" as FE
    participant "Core API" as Core
    participant "University API Adapter" as Adapter
    participant "University External API" as ExtAPI
    participant "Relational Database" as DB

    Admin -> FE : Click Sync
    FE -> Core : POST /sync (university ID)
    Core -> Adapter : Fetch data (university config)
    Adapter -> ExtAPI : GET modules, venues, lecturers
    ExtAPI --> Adapter : Raw university data
    Adapter -> Adapter : Transform to Core format
    Adapter --> Core : Normalised payload
    Core -> DB : Upsert modules, venues, lecturers
    Core --> FE : 200 OK (sync summary)

    @enduml
    ```

---

## 5.3 Frameworks and Technologies

### HTTP Client Library (Node.js)

The system uses the **native fetch API** (available in Node.js 18+) for all external HTTP communication. This eliminates the need for external HTTP client libraries like axios or node-fetch, reducing dependency overhead and using standardised web APIs.

### Data Validation / Schema Transformation

Data validation is handled using **NestJS Validation Pipes** and class-validator/class-transformer patterns. This ensures that all inbound data from external APIs is validated against internal DTOs before processing.

---

## 5.4 Architectural Realization Mapping

- The **abstract adapter parent** is realised as a TypeScript abstract class (or interface) in the Core API codebase, defining a `fetchData(config: AdapterConfig): Promise<NormalisedPayload>` method contract.
- Each **concrete adapter** is a TypeScript class that implements the abstract parent, using the **native fetch API** for HTTP communication and **NestJS Validation Pipes** for transforming and validating the external API response.
- The **adapter factory** is realised as an injectable NestJS service that maps university identifiers to their corresponding concrete adapter class, instantiating via dependency injection.
- The **Mock API Adapter** is a concrete implementation backed by static fixture data, used in integration tests and local development without requiring access to real university APIs.
- **Error classification** is realised within each concrete adapter using **NestJS Validation** errors (schema mismatch) and native fetch error types (network failure, non-2xx status codes).

| Responsibility | Realised By |
|---|---|
| Configuration resolution | NestJS service using environment config |
| External API communication | Native fetch API with retry logic |
| Data transformation | TypeScript mapper methods in concrete adapters |
| Error handling | Try-catch blocks + error classification |
| Data validation | NestJS class-validator DTOs |

---

## 5.5 Technology Choice

The University API Adapter will be implemented in **TypeScript** within the Core API codebase, using the **native fetch API** for HTTP communication and **NestJS Validation** (class-validator) for data validation and normalisation.

Native fetch was chosen because it is now a standard, built-in part of the Node.js runtime, eliminating external dependencies while providing a modern Promise-based API for HTTP requests.

NestJS Validation (class-validator) was chosen because it integrates seamlessly with the NestJS framework, using decorators to define validation rules directly on the DTOs used throughout the system. This ensures consistency between incoming data and the application's internal data models.
