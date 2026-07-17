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
