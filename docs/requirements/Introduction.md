# Introduction

!!! abstract "Document Overview"
    This Software Requirements Specification (SRS) defines the complete requirements for **UMTAS** — the *University Management & Timetabling Automation System* — developed by **Team Vigil**.

    **What UMTAS does:** Automates university timetable generation and venue management. The system ingests master schedule PDFs, resolves hard and soft scheduling constraints via a CP-SAT constraint solver, and delivers conflict-free, personalized timetables to up to 20,000 concurrent students.

    **Who this document is for:**

    | Audience | Who | Purpose |
    |---|---|---|
    | **Team Vigil** | The developers | Functional, architectural, and technology requirements for implementation |
    | **Academic Markers** | COS 301 lecturers | Traceability from requirements through to use cases and design decisions |
    | **Stakeholders** | DNS Business & Tyto | Scope definition, quality guarantees, and system boundaries |

    **Sections at a glance:**
    Domain Model · User Stories · Use Cases · Functional Requirements · Quality Requirements · Architectural Requirements · Technology Stack · Traceability Matrix · API Service Contracts

---

## Business Need

UMTAS addresses the critical need for automated timetabling and venue management in university environments. Manual scheduling is error-prone, time-intensive, and unable to accommodate the scale and preference complexity of a modern university. UMTAS replaces this process with an intelligent, constraint-driven system accessible to both students and administrators.

## Scope

The system covers PDF ingestion, core schedule optimization, and student preference management.
