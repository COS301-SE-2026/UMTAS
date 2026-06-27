# Architectural Patterns

## Scope

This page records architecture-scale patterns. Code-level patterns are in
[Design Patterns](./DESIGN_PATTERNS.md).

## Pattern Summary

| Pattern | Components | Architectural Purpose |
|---|---|---|
| Client-server | Browser clients, ingress, Core API | Keeps authoritative state and domain rules server-side |
| Core-and-adapter | Core API, UP PDF adapter, university API adapter | Isolates university-specific format variation |
| Stateless compute sidecars | Core API, parser service, solver service | Scales specialized compute without giving those services independent persistent state |
| Asynchronous job processing | Core API, job queues, workers, parser, solver | Keeps long-running parse and solve work out of browser request paths |

## Client-Server

Browser clients do not own authoritative state or domain logic. All workflows route through the
Core API. This creates one authorization, orchestration, and persistence boundary for student,
lecturer, administrator, and public-entry workflows.

## Core-and-Adapter

University-specific PDF and API variation is isolated behind adapters. The Core works with
canonical UMTAS timetable structures instead of source-specific PDF layouts or provider schemas.
This keeps source-specific change local to the adapter boundary.

## Stateless Compute Sidecars

Parser and solver capabilities run as stateless compute sidecars because they have different runtime
and scaling characteristics from the Core API. They are microservice-like in deployment and scaling,
but they do not own persistent domain state. The Core remains the orchestration, authorization, and
state boundary.

This avoids splitting the system into independent data-owning microservices while still allowing
parser and solver capacity to scale independently for the 20,000+ simulated-user workload.

## Asynchronous Job Processing

Parse and solve work is queued so browser requests remain responsive. Core-owned workers consume
jobs, call parser or solver services over HTTP, and persist terminal job state for browser polling.
This is the communication pattern for long-running work. The compute sidecar pattern describes where
the specialized work runs; asynchronous job processing describes how the Core schedules and observes
that work.
