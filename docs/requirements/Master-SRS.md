# Master Software Requirements Specification (SRS)

> This is a consolidated view of all SRS sections for easier reading and printing.

---

# Introduction

## Business Need

UMTAS addresses the critical need for automated timetabling and venue management in university environments...

## Scope

The system covers PDF ingestion, core schedule optimization, and student preference management.

---

# Domain Model

Provide a valid UML class diagram illustrating the software solution.

![Domain Model](../diagrams/domain/Domain.drawio)

---

# User Stories

## Student

As a student, I want to receive a personalized timetable based on my preferences...

## Admin

As an administrator, I want to upload master timetables and monitor venue utilization.

---

# Use Cases

## System Use Case Diagram

![System Use Case Diagram](../diagrams/requirements/Requirements.drawio)

## Student Use Cases

![Student Use Cases](../diagrams/requirements/Requirements.drawio)

## Admin Use Cases

![Admin Use Cases](../diagrams/requirements/Requirements.drawio)

---

# Functional Requirements

## Sub-system: Core Optimizer

- R1.1: The system shall generate optimized schedules using CP-SAT...

## Sub-system: API Core

- R2.1: The system shall manage user sessions and preferences...

---

# Quality Requirements

## Performance

The system shall process a 100-page PDF in under 30 seconds...

## Scalability

The system shall support 20,000 concurrent students...

---

# Architectural Requirements

## Architectural Patterns

- Core-and-Adapter Architecture
- Microservices (NestJS + FastAPI)

## Design Patterns

- Repository Pattern
- Adapter Pattern
- Observer Pattern (BullMQ)

## Constraints

- Browser compatibility: Chrome, Firefox, Safari
- Mobile responsiveness

---

# Technology Requirements

The project utilizes a modern technology stack to ensure high performance and maintainability.

| Concern      | Technology                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | ![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)             |
| **Backend**  | ![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)           |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) |

---

# Traceability Matrix

Mapping between functional requirements and use cases.

| ID   | Requirement   | Use Case |
| ---- | ------------- | -------- |
| R1.1 | PDF Ingestion | UC1.1    |
| R2.1 | User Auth     | UC2.1    |

---

# API Service Contracts

REST API surface between NestJS core and frontend.

![API Contracts](../diagrams/api/API.drawio)

---
