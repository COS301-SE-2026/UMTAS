# Architectural Patterns

## Pattern Summary

| Pattern | Components | Purpose |
|---|---|---|
| Client-Server | Browser, ingress boundary, Core API | Keeps policy and authoritative state server-side |
| Core-and-Adapter | Core API, university adapters | Isolates source-specific formats |
| Asynchronous Job Processing | Core API, message queue, stateless workers, compute components, callbacks | Removes long-running work from browser request paths |

## Client-Server

Browsers use the Core API for all application workflows. They do not access workers, the message
queue, blob storage, or the relational database directly. The Core is the authorization,
orchestration, and persistence boundary.

## Core-and-Adapter

University adapters translate source-specific formats into canonical import candidates. The Core
converts those candidates into authoritative domain records. New university formats remain behind
the same adapter boundary.

## Asynchronous Job Processing

The Core persists and enqueues parse or solve jobs. A stateless worker consumes each job, prepares
temporary input, invokes the relevant compute component, validates its output, and sends a terminal
callback. The browser polls the Core for queued, completed, or failed status.

This pattern keeps long-running work outside browser request paths and lets parser and solver capacity
scale independently. Job attempts and callback delivery retries are separate concerns. Solver
callbacks also identify the active attempt so an older result cannot replace a newer one.
