# Architectural Patterns

## Scope

This page records architecture-scale patterns. Code-level patterns are in
[Design Patterns](./DESIGN_PATTERNS.md).

## Pattern Summary

| Pattern | Components | Architectural Purpose |
|---|---|---|
| Client-server | Browser clients, ingress, Core API | Keeps authoritative state and domain rules server-side |
| Core-and-adapter | Core API, UP PDF adapter, university API adapter | Isolates university-specific format variation |
| Service-oriented extracted compute | Core API, parser service, solver service | Separates specialized compute runtimes from the main application |
| Queue-based asynchronous processing | Core API, job queues, workers, parser, solver | Keeps long-running parse and solve work out of browser request paths |

## Client-Server

Browser clients do not own authoritative state or domain logic. All workflows route through the
Core API. This creates one authorization, orchestration, and persistence boundary for student,
lecturer, administrator, and public-entry workflows.

## Core-and-Adapter

University-specific PDF and API variation is isolated behind adapters. The Core works with
canonical UMTAS timetable structures instead of source-specific PDF layouts or provider schemas.
This keeps source-specific change local to the adapter boundary.

## Service-Oriented Extracted Compute Services

Parser and solver capabilities are extracted into stateless compute services because they have
different runtime and scaling characteristics from the Core API. UMTAS is not modeled as a set of
independent data-owning microservices; the Core remains the orchestration and state boundary.

## Queue-Based Asynchronous Processing

Parse and solve work is queued so browser requests remain responsive. Core-owned workers consume
jobs, call parser or solver services over HTTP, and persist terminal job state for browser polling.
This is the communication pattern for long-running work, while service-oriented extracted compute
is the component decomposition pattern.
