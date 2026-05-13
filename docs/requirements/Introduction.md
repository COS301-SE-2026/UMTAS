# Introduction

UMTAS (University Modular Timetable Analytics System) is an intelligent, multi-adapter platform for automated academic timetable generation and distribution. This document specifies the Software Requirements and Design Specifications (SRS) for UMTAS at the Demo 1 milestone, detailing functional requirements, use cases, domain models, and architectural decisions. The system is developed as part of the COS301 Capstone Project 2026 by Team Vigil and follows an incremental Agile approach with updates refined in subsequent demos.

## Business Need

Universities face significant operational challenges when constructing timetables manually: scheduling conflicts between venues, lecturers, and student groups, inconsistency across departments, and lack of automated tooling to accommodate individual preferences. Manual timetable generation is labour-intensive, error-prone, and difficult to optimise for multiple competing objectives.

UMTAS solves these problems through:
- **Automated constraint-based scheduling** using constraint programming to resolve venue, lecturer, and time-slot conflicts
- **Modular input pipeline** supporting PDF uploads, university APIs, and manual entry through a core-and-adapter architecture
- **Preference optimisation** allowing students to set scheduling preferences (e.g. avoid early mornings, minimise gaps)
- **Multi-university scalability** without significant customisation per institution

## Project Scope

### In Scope
- **Timetable core engine:** Automated generation using constraint programming, solution caching for performance
- **PDF input adapter:** Parsing university timetable PDFs for ingestion
- **API input adapter:** Integration with university scheduling systems via configurable APIs
- **Calendar export:** Export to Google Calendar (via OAuth) and standard `.ics` format
- **Student management:** Personal timetable viewing, preference management, custom schedule building
- **University analytics:** Admin dashboard for venue utilisation, lecturer workload, attendance analysis
- **User and authentication:** Multi-role login/register (student, lecturer, admin, system admin) with session management
- **Simulation subsystem:** Support for 20,000+ concurrent simulations for efficiency evaluation

### Out of Scope
- Physical room booking or resource reservation beyond timetable assignment
- Payment processing or billing systems
- Email/SMS notification delivery (calendar integrations provide reminders)
- Custom scheduling rule engines (uses predefined constraint model)

## Project Owner

> **TODO:** Insert client/project owner name, organisation, and contact details. Reference: Living SRS §2.

**Example format:**
- **Name:** [Client Full Name]
- **Organisation:** [University / Company Name]
- **Email:** [client@email.com]
- **Role:** [e.g. Head of Scheduling, IT Director]

**Team:** Vigil (COS301 2026)

| Name | Surname | Student Number | % Contribution |
|---|---|---|---|
| Wilmar* | Smit | u24584216 | 20% |
| Michael | Tomlinson | u24569705 | 20% |
| Aidan | Dawson | u24593542 | 20% |
| Marcel | Stoltz | u24566552 | 20% |
| Johan | Coetzer | u24564584 | 20% |

## Project Vision and Objectives

### Vision

UMTAS provides a flexible, scalable, and intelligent platform for automated academic timetable generation and distribution that serves multiple universities without requiring significant customisation effort per institution.

### Objectives

- **O1:** Automate timetable generation using constraint programming to resolve scheduling conflicts between venues, lecturers, and time slots.
- **O2:** Support multiple input methods (PDF upload, API integration, and manual entry via a default frontend) through a core-and-adapter architecture.
- **O3:** Export generated timetables to Google Calendar and standard `.ics` format for broad accessibility.
- **O4:** Provide university administrators with an analytics dashboard for venue utilisation, lecturer load analysis, and schedule management.
- **O5:** Ensure the system is extensible to new universities by providing template adapters (PDF Parser Parent, API Parser Parent) that can be configured with minimal effort.
- **O6:** Improve performance by caching previously computed timetable solutions to avoid redundant computation for known schedule configurations.
