# Software Architecture Specification

| Field | Value |
|---|---|
| Product | UMTAS |
| Version | Demo 2 |
| Status | Draft |
| Last updated | 2026-06-22 |
| Document owner | Team Vigil architecture team |
| Reviewers | UMTAS technical leads, lecturer mentor, and industry mentor |
| Scope | Demo 2 architecture, technology, interfaces, and deployment |

## Purpose

This SAS records the Demo 2 architecture, interfaces, technology choices, and deployment model
for UMTAS.

## Audience

- Implementers and reviewers
- Demo 2 evaluators
- Maintainers of the frontend, Core API, solver, parser, and deployment

## Scope

This SAS covers:

- Logical architecture and component responsibilities
- Architectural patterns, design patterns, and constraints
- Quality requirement mapping
- Technology selections
- API and integration boundaries
- Deployment topology and CI/CD flow

## Current Evidence Status

The architecture is defined for Demo 2 review. Remaining evidence gaps are:

- No checked-in authoritative API schema inventory for every component boundary
- No checked-in worker, parser, or solver contract schemas proving queue/HTTP conformance
- No checked-in production workflow files, image names, health checks, or rollback runbook
- No checked-in proof of a separate staging environment

## Contents

- [Introduction](./architecture/INTRODUCTION.md)
- [Architectural Requirements Overview](./architecture/ARCHITECTURAL_REQUIREMENTS.md)
- [Architectural Patterns](./architecture/ARCHITECTURAL_PATTERNS.md)
- [Design Patterns](./architecture/DESIGN_PATTERNS.md)
- [Architectural Constraints](./architecture/CONSTRAINTS.md)
- [Technology-Neutral Architectural Diagram](./architecture/ARCHITECTURAL_DIAGRAM.md)
- [Quality Requirement Mapping](./architecture/QUALITY_REQUIREMENT_MAPPING.md)
- [Technology Requirements](./architecture/TECHNOLOGY_REQUIREMENTS.md)
- [API Contracts](./architecture/API_CONTRACTS.md)
- [Deployment Requirements](./deployment/DEPLOYMENT_REQUIREMENTS.md)
- [Deployment Diagram](./deployment/DEPLOYMENT_DIAGRAMS.md)
- [CI/CD Pipeline Diagram](./deployment/CICD_PIPELINE_DIAGRAM.md)

## Relationship to the SRS

The [SRS](../srs/index.md) remains authoritative for functional requirements, use cases, the
domain model, and quality targets. This SAS is authoritative for architecture, technology, API,
and deployment decisions.
