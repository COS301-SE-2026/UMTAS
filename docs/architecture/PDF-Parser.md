# Architectural Component: PDF Parser and Job Queue

The PDF Parser subsystem is responsible for ingesting university timetable data supplied in PDF format, extracting structured scheduling information, and delivering a normalised payload to the Core API. Because PDF parsing is computationally intensive and potentially slow (dependent on document size and layout complexity), it is executed asynchronously via a job queue, with results delivered back to the Core API via a completion event. The job queue infrastructure is presented as an integral part of this architectural component because the two are tightly coupled in purpose and data flow.

The PDF Parser depends on: the Object Storage (to retrieve uploaded PDFs), the Job Queue (to receive parse jobs), and the Core API (to deliver parse results). The Core API depends on the PDF Parser for converted timetable data from university PDF uploads.

---

## 4.1 Architectural Quality Requirements

### 4.1.1 Reliability

PDF parsing is triggered by a university administrator uploading a timetable document. A failed or silently lost parse job would cause data loss without the user's knowledge. The job queue must guarantee at-least-once delivery — a parse job must not be removed from the queue until a worker has successfully completed it and acknowledged the message. Failed jobs must be retried automatically with exponential backoff; after a configurable number of retries, they must be routed to a dead-letter queue and the administrator notified, rather than silently discarded.

### 4.1.2 Scalability

Multiple universities may upload PDFs simultaneously. Parse jobs must be distributable across multiple worker instances, each independently pulling from the shared PDF job queue. A single parser instance must be capable of processing at least 10 PDF documents per hour; additional throughput is achieved by adding worker replicas without configuration changes.

### 4.1.3 Flexibility

Different universities supply timetables in different PDF layouts. The Adapter pattern ensures that adding support for a new university's PDF format requires only the addition of a new concrete parser implementation, without modifying the queue infrastructure, the abstract parent, or the Core API. The abstract parser interface defines what a parser must produce (a normalised payload); the concrete implementation defines how it is extracted from a specific layout.

### 4.1.4 Security

Uploaded PDF files must be stored in a content-addressable object store with access restricted to authorised parser workers. The parser must validate that uploaded files are valid PDFs (by inspecting file headers, not file extensions) before processing. Malformed or deliberately crafted PDFs must not cause unhandled exceptions that crash the worker — error handling must be comprehensive, with failed parses producing structured error payloads rather than unhandled exceptions.

### 4.1.5 Auditability

All parse job state transitions (submitted, started, completed, failed, dead-lettered) must be logged with timestamps, the identity of the submitting user, and the associated university. Parse errors must include sufficient diagnostic information (page number, extraction failure reason) to allow a developer to diagnose and fix a parser for a new document format.

---

## 4.2 Architectural Responsibility

The PDF Parser and Job Queue component is responsible for:

- **Job Enqueuing:** The Core API pushes a parse job (containing the Object Storage reference to the uploaded PDF and the target university identifier) onto the PDF job queue.
- **Job Distribution:** The job queue delivers jobs to available parser worker instances using a pull model — workers consume jobs at their own pace, ensuring no worker is overloaded.
- **University Adapter Resolution:** Upon receiving a job, the parser resolves the correct concrete adapter for the specified university identifier via a factory.
- **PDF Retrieval:** The concrete parser retrieves the PDF from Object Storage.
- **Text and Layout Extraction:** The concrete parser extracts raw text and spatial layout information from the PDF.
- **Data Normalisation:** The concrete parser transforms the extracted data into the Core API's normalised timetable payload format.
- **Completion Event Emission:** On success or failure, the parser emits a completion event (with the normalised payload or error details) back to the Core API.
- **Retry and Dead-letter Management:** The job queue handles failed job retries and routes exhausted jobs to the dead-letter queue.

!!! example "Figure 10: Push-Pull Job Distribution (PDF Parser)"

    ```kroki-plantuml
    @startuml Figure10_PDFPushPull
    !theme plain
    left to right direction

    component "Core API" as CORE

    rectangle "Job Queues" #fef9c3 {
        component "PDF Job Queue" as PQ
        component "Optimiser Job Queue" as OQ
    }

    rectangle "PDF Parser Workers (Scalable)" #fef9c3 {
        component "PDF Parser Instance 1" as PP1
        component "PDF Parser Instance 2" as PP2
        component "PDF Parser Instance N" as PPN
    }

    rectangle "Optimiser Workers (Scalable)" {
        component "Optimiser Instance 1" as OPT1
        component "Optimiser Instance 2" as OPT2
    }

    CORE --> PQ : Push
    CORE --> OQ : Push
    PQ --> PP1 : Pull
    PQ --> PP2 : Pull
    PQ --> PPN : Pull
    OQ --> OPT1 : Pull
    OQ --> OPT2 : Pull

    @enduml
    ```

!!! example "Figure 11: Adapter Pattern — PDF Parser"

    ```kroki-plantuml
    @startuml Figure11_AdapterPattern
    !theme plain
    top to bottom direction

    component "Core API" as CORE

    rectangle "PDF Input Adapter" #fce7f3 {
        component "PDF Parser Parent (Abstract)" as PP
        component "University A PDF Parser" as PA
        component "University B PDF Parser" as PB
        component "University N PDF Parser" as PN
        PP <|-- PA
        PP <|-- PB
        PP <|-- PN
    }

    CORE --> PP : Normalised payload

    @enduml
    ```

!!! example "Figure 12: Full PDF Upload and Timetable Generation Flow"

    ```kroki-plantuml
    @startuml Figure12_PDFUploadFlow
    !theme plain

    participant "User" as User
    participant "Frontend" as FE
    participant "Core API" as Core
    participant "Object Storage" as OBJ
    participant "PDF Job Queue" as PQ
    participant "PDF Parser" as Parser
    participant "Optimiser Job Queue" as OQ
    participant "Optimiser" as Solver
    participant "Relational Database" as DB
    participant "Solution Cache" as Cache

    User -> FE : Upload PDF
    FE -> Core : POST /pdf-upload
    Core -> OBJ : Store PDF
    Core -> PQ : Push parse job
    Core --> FE : 202 Accepted (job ID)

    PQ -> Parser : Pull job
    Parser -> OBJ : Retrieve PDF
    Parser -> Parser : Parse (university-specific adapter)
    Parser --> Core : Event: parse complete (normalised payload)
    Core -> DB : Persist parsed timetable data
    Core --> FE : Event: parse complete

    User -> FE : Request timetable generation
    FE -> Core : POST /generate
    Core -> Cache : Check for cached solution
    alt Cache hit
        Cache --> Core : Return cached solution
        Core --> FE : 200 OK (solution)
    else Cache miss
        Core -> OQ : Push optimisation job
        Core --> FE : 202 Accepted (job ID)
        OQ -> Solver : Pull job
        Solver -> Solver : Solve (constraint strategy / heuristic)
        Solver --> Core : Event: solution ready
        Core -> DB : Persist solution
        Core -> Cache : Cache solution
        Core --> FE : Event: solution ready
    end

    @enduml
    ```

---

## 4.3 Frameworks and Technologies

### PDF Extraction Library (Python)

| Library | Assessment |
|---|---|
| **PyMuPDF (fitz)** | Fast, accurate Python binding for the MuPDF rendering library. Preserves spatial positioning of text blocks (bounding boxes, page coordinates), which is critical for interpreting table-structured timetable PDFs where column/row position encodes meaning. MIT licensed. Significantly faster than pure-Python alternatives for large documents. |
| **pdfminer.six** | Pure Python PDF text extraction. More portable (no native binaries) but substantially slower and less accurate for complex layouts. Primarily line-oriented rather than spatially-aware; text blocks are output in reading order, losing column structure that carries semantic meaning in timetable grids. |
| **pdfplumber** | Built on pdfminer.six, adding table extraction via heuristic cell boundary detection. Useful for PDFs with visible grid lines, but fails on tables without borders (implicit column alignment). Slower than PyMuPDF; the quality of table extraction degrades on non-standard layouts, which are common across university PDF formats. |

### Job Queue

| Queue | Assessment |
|---|---|
| **BullMQ** | Redis-backed, TypeScript-native job queue. Supports delayed jobs, retries with exponential backoff, dead-letter queues, job prioritisation, sandboxed processors, and flow control. Runs within the NestJS Core API process, using the same Redis instance already required for session and solution caching. Workers are separate processes consuming the same queue — the push model (NestJS publishes) and pull model (Python workers consume via REST) are coordinated through the queue. |
| **Celery** | Python distributed task queue. Natural for a pure Python stack but introduces a second broker dependency (RabbitMQ or Redis) and requires running a separate Celery worker management process. Since the job queue is managed by the Node.js Core API (which dispatches jobs and tracks their state), using BullMQ in the Core API while Python workers poll for jobs via HTTP is architecturally cleaner than maintaining two separate queue systems. |
| **Agenda** | MongoDB-backed job scheduler for Node.js. Requires MongoDB as an additional data store dependency beyond the existing PostgreSQL + Redis stack. Provides fewer features than BullMQ for high-throughput concurrent jobs; less actively maintained. |

---

## 4.4 Architectural Realization Mapping

- The **job queue** is realised by BullMQ running in the Core API process, publishing parse jobs to a named queue backed by the existing Redis instance.
- The **worker pull model** is realised by Python PDF Parser worker processes that expose an HTTP endpoint; BullMQ dispatches to these via the job payload, or the Python workers independently poll the queue — both models are supported.
- The **abstract PDF Parser parent** is realised as a Python ABC with a `parse(pdf_bytes: bytes) -> TimetablePayload` abstract method.
- **Concrete parser implementations** are Python classes that inherit from the abstract parent and implement format-specific extraction logic using PyMuPDF.
- The **factory** is realised as a Python function that maps university identifiers to their corresponding concrete parser class, instantiating on demand.
- The **completion event** is delivered back to the Core API via an HTTP callback or AMQP message, updating job status in BullMQ.

| Responsibility | Realised By |
|---|---|
| Job enqueuing | BullMQ queue in Core API (NestJS) |
| Job distribution (push) | BullMQ queue management |
| Job distribution (pull) | Python workers consuming via REST API |
| Adapter resolution | Factory function mapping university ID to parser class |
| PDF retrieval | Python worker HTTP request to object storage |
| Text/layout extraction | PyMuPDF API calls |
| Data normalisation | Concrete parser class implementation |
| Completion event | HTTP POST back to Core API or AMQP message |
| Retry and dead-letter | BullMQ built-in retry + dead-letter features |

---

## 4.5 Technology Choice

The PDF Parser will be implemented in **Python** using **PyMuPDF** for text and layout extraction, structured around the **Adapter pattern** (abstract parent + per-university concrete implementations). The job queue will be managed by **BullMQ** in the Core API, backed by the existing **Redis** instance.

PyMuPDF was chosen because spatial awareness of text blocks is non-negotiable for parsing timetable PDFs, where column and row position carries semantic meaning. PyMuPDF's bounding-box-level extraction and high performance make it the only viable option among the evaluated libraries for this use case.

BullMQ was chosen because it integrates natively with the NestJS Core API (TypeScript, same Redis instance), eliminating the need for an additional message broker or queue system. Its retry and dead-letter features directly realise the reliability requirements. Its queue visibility (job status, progress, history) supports the auditability requirements.
