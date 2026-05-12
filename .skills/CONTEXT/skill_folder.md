./skills/
├── README.md ← one-liner index: what lives here, how agents should load it
│
├── context/ ← agent-readable project knowledge; skills reference these
│ ├── project-summary.md ← tight UMTAS overview: goals, roles, services, constraints
│ ├── definition-of-done.md ← DoD per work type: feature, unit test, integration test, PR, migration
│ ├── directory-guide.md ← monorepo layout: where services, modules, tests, seeds live
│ ├── test-conventions.md ← unit vs integration split, Vitest config, PGLite seed setup, file naming
│ ├── database-conventions.md ← DrizzleORM schema rules, migration workflow, seed data patterns
│ ├── api-conventions.md ← endpoint naming, Swagger requirements, RBAC, response shapes
│ └── service-boundaries.md ← what lives in NestJS vs FastAPI vs BullMQ; when to cross boundaries
│
└── engineering/
├── tdd/
│ ├── SKILL.md ← red-green-refactor loop; loads test-conventions + definition-of-done
│ └── references/
│ └── stack-hints.md ← paths to relevant Tech_Stack_Reference_Manual files
├── backend-feature/
│ ├── SKILL.md ← step-through of backend-development-guide.md; loads DoD + api-conventions
│ └── references/
│ └── stack-hints.md
├── grill-me/
│ └── SKILL.md ← challenges plan against project-summary + service-boundaries
├── caveman/
│ └── SKILL.md ← response style: terse, direct, no fluff
└── srs-writer/
├── SKILL.md
└── references/
└── rubric-checklist.md ← Demo 1 rubric + outstanding TODOs from CLAUDE.md
