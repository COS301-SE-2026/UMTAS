# Software Architecture Specification

UMTAS is a browser-based timetable management platform. A central Core API owns policy and state;
dedicated workers run PDF parsing and timetable solving outside browser request paths.

## Purpose and Scope

This specification defines the structural design, component interfaces, and deployment shape of UMTAS. The architecture supports:

- browser access and Core API orchestration;
- message-queue buffered asynchronous tasks;
- stateless parser and solver worker nodes;
- authenticated callbacks for task results; and
- isolated internal resources with single-ingress routing.

Quality requirements, functional behaviours, and user flows are documented in the Software
Requirements Specification.

## Specification Index

- [:octicons-arrow-right-24: Architectural Requirements](architecture/ARCHITECTURAL_REQUIREMENTS.md)
- [:octicons-arrow-right-24: Technology Requirements](architecture/TECHNOLOGY_REQUIREMENTS.md)
- [:octicons-arrow-right-24: API Contracts](architecture/API_CONTRACTS.md)
- [:octicons-arrow-right-24: Deployment](deployment/index.md)
