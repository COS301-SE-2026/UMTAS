# UMTAS Coding Standards Document

!!! info "Purpose"

    This document describes all coding conventions the UMTAS development team strictly followed.

---

## :material-lightbulb-on: 1. Core Philosophy

=== "Readability"

    **Readability:** Code is read more than written, clarity is key.

=== "Automation"

    **Automation:** Pre-commit hooks and linting automate code quality. Business logic and architecture needs to be reviewed by members of the team.

=== "Modular file structure"

    **Modular file structure:** File structures follow strict atomic design principles to prevent messy code organisation.

---

## :material-folder-network: 2. Repository Architecture

The root of this monorepo defines our configurations and boundaries between different applications.

??? note "Architectural Reasoning"

    - **2.2 Application Boundaries:** Directories within `apps/` act as their own isolated and autonomous system.
    - **2.2 Application Boundaries:** Apps do not import from other apps directly. Necessary information is extracted from shared packages in the `packages/` directory or from strict API contracts.

### 2.1 High-Level Folder Structure

```text
UMTAS/
├── .github/                 # GitHub Actions CI/CD workflows
├── .husky/                  # Pre-commit and commit-msg hooks
├── apps/                    # Independent deployable applications
│   ├── backend/             # NestJS API & Postgres Database
│   ├── frontend/            # Next.js / React Web Application
│   ├── e2e/                 # Playwright End-to-End Tests
│   ├── pdf_parser/          # Python microservice (PyMuPDF)
│   ├── preference-solver/   # C++ microservice (CP/GA Solvers)
│   └── solver-worker/       # Worker processing service
├── docker/                  # Dockerfiles and container configurations
├── docs/                    # Architecture and API documentation
├── package.json             # Root workspace definitions
├── .prettierrc              # Global Prettier configuration
└── eslint.config.mjs        # Global ESLint rules
```

### 2.2 App-Specific Boundaries

!!! warning "Strict Boundaries Constraints"

    Directories within `apps/` act as their own isolated and autonomous system. Apps do not import from other apps directly. Necessary information is extracted from shared packages in the `packages/` directory or from strict API contracts.

---

## :material-format-text: 3. Naming Conventions

### 3.1 Global File and Folder Naming

| Scope | Entity Type | Convention | Example |
| --- | --- | --- | --- |
| Backend (NestJS) | Directories | PascalCase | `apps/backend/src/Builder/` |
| Backend (NestJS) | Files (Controllers, Services) | kebab-case (dot notation) | `event.controller.ts`, `builder.service.ts` |
| Frontend (React) | Components | PascalCase | `GenerateStep.tsx`, `TimeSlotSelect.tsx` |
| Frontend (React) | Generic UI (Shadcn/ Atoms) | kebab-case | `alert-dialog.tsx`, `button.tsx` |
| Frontend (Next.js) | Routes | kebab-case | `course-management/page.tsx` |
| Python (pdf_parser) | Files & Directories | snake_case | `up_parser.py`, `base_parser.py` |
| C++ (preference-solver) | Files & Directories | Mixed / PascalCase preferred for classes | `CP_SOLVER/CP.cpp`, `GA_handler/GA.cpp` |

??? quote "Ecosystem Standards Reasoning"

    - **Types:** Suffix type aliases with `Type` if: They represent a union.
    - **Types:** They name them transparently as domain entities.

### 3.2 Code-Level Naming Rules

- **Variables and Functions:** Must use `camelCase`. Must be descriptive. Boolean variables need to be prefixed with `is`, `has`, `can` or `should` (e.g. `isVisible`, `hasError`).
- **Constants:** Must use `UPPER_SNAKE_CASE` for global immutable constants (e.g. `MAX_COUNT`).
- **Classes and Interfaces:** Must use `PascalCase`. Do not prefix interfaces with "I" (e.g. `User` instead of `IUser`).

---

## :material-auto-fix: 4. Formatting Rules & Tooling

=== "4.1 Prettier"

    Prettier is our default code formatter, running automatically on save (configured via EditorConfig) and in our CI pipeline.

    - **Single quotes:** Enforced for JavaScript/TypeScript strings.
    - **Trailing commas:** Required for multiline objects and arrays.
    - **Print width:** 80-100 characters to prevent horizontal scrolling.
    - **Ignores:** Our `.prettierignore` ignores auto-generated files, build outputs and specific Markdown used in our documentation (e.g. MKDocs tabs).

=== "4.2 ESLint and SecretLint"

    - **No Any:** The use of `any` in TypeScript is forbidden. `unknown` should be used if the shape truly is unpredictable and type-guard it.
    - **Unused Variables:** Unused declared variables trigger errors. Intentionally unused variables should be prefixed with an underscore (e.g. `_req`).
    - **SecretLint:** Enforced by `.secretlintrc.json`. Committing API keys, JWT secrets or DB passwords will fail the commit hook.

---

## :material-hook: 5. Pre-commit Hooks & Linting Automation

!!! info "Local Enforcement Strategy"

    Husky enforces repo integrity on each developer's machine. Broken code cannot be pushed and messy commit messages cannot be written.

### 5.1 Husky Setup

Husky is initialised on `pnpm install`. It binds several git lifecycle events:

- **`pre-commit`:** Runs linting, Prettier checks and type-checking on staged files using `lint-staged`.
- **`commit-msg`:** Executes `pnpm dlx commitlint --edit` to ensure commit messages adhere to our standards.
- **`pre-push`:** Runs the test suites relevant to the changed apps to prevent breaking the CI pipeline.

### 5.2 Conventional Commits

??? success "Automated Workflows"

    All commits must follow the Conventional Commits specification. This allows autogenerated changelogs and triggers semantic versioning bumps.

    ```text
    <type>(<scope>): <description>

    [optional body]
    ```

    **Allowed Types**

    - `feat`: A new feature.
    - `fix`: A bug fix.
    - `docs`: Documentation only changes.
    - `style`: Changes that do not affect the meaning of the code (white-space, formatting).
    - `refactor`: A code change that neither fixes a bug nor adds a feature.
    - `test`: Adding missing tests or correcting existing tests.
    - `chore`: Changes to the build process or auxiliary tools.

    **Scope:** Should be the app or package modified (e.g., `feat(backend)`, `fix(pdf_parser)`).

---

## :material-server: 6. Backend Conventions

!!! info "Tech Stack Overview"

    **6. Backend Conventions (NestJS and Drizzle)**

    The backend (`apps/backend`) runs on NestJS and connects to PostgreSQL using Drizzle ORM.

### 6.1 Module Architecture

The backend follows a domain-driven structure. Every major domain entity gets its own directory inside `apps/backend/src/` (e.g., `University/`, `Course/`, `Events/`). Each domain folder must strictly contain:

- **`[domain].module.ts`:** The wiring file for the domain.
- **`[domain].controller.ts`:** HTTP routing, input validation (Pipes), and HTTP exception handling. Business logic is forbidden here.
- **`[domain].service.ts`:** Core business logic and database interactions.
- **`dto/`:** Directory containing Data Transfer Objects with `class-validator` decorators.
- **`integration/`:** If the domain requires heavy external API communication, separate it into integration services.

??? success "Architectural Pattern Reasoning"

    **6.3 Authentication and Authorisation**

    Endpoints must be secured using global guards. Use the custom decorators (e.g., `@Session()`) defined in `apps/backend/src/auth/session.decorator.ts` to extract user contexts safely rather than accessing the raw `req.user` object.

### 6.2 Database Configuration

Schemas are defined in `apps/backend/src/entities/` and aggregated in `apps/backend/src/db/schema.ts`.

- **Migrations:** Drizzle handles migrations. Do not manually edit `.sql` files in the `drizzle/` folder unless fixing a corrupted migration state.
- **Seeding:** Robust seeding system located in `src/db/seeding/`. Seed data logic is split into isolated services (e.g., `courses.seed.service.ts`) that extend `base.seed.service.ts`.

---

## :material-web: 7. Frontend Conventions

### 7.1 UI Methodology

The web client in `apps/frontend` uses the NextJS app router with React server components, customised with Tailwind CSS.

UI components used under `src/components/` must be strictly categorised following Atomic Design principles:

- **Atoms:** The basic building blocks (e.g. Buttons, Inputs, Labels). Shadcn components are used as our base atoms, located under `src/components/atoms/baseShadcn/`. Do not heavily mutate Shadcn base files, rather extend them via props.
- **Molecules:** Groups of atoms functioning together (e.g., a form field with a label and input).
- **Organisms:** Relatively complex sections of an interface (e.g., `TopNavBar.tsx`, `EventsPanel.tsx`, `GenerateStep.tsx`).
- **Templates:** Page-level layout shells (e.g., `AppShellTemplate.tsx`, `AuthPageTemplate.tsx`) that enforces structure without tying the component to specific business logic.

### 7.3 Brand Style Guide

Tailwind CSS is utilised for styling. Our brand style is documented and also available as a public route on the repo under the `/brand-style` URL. Strictly adhere to all rules stated in the brand style guide.

Never use arbitrary colours, use the colours defined in `globals.css` (e.g. never `text-green-200`, but rather `text-(--success-text)`).

### 7.2 Data Fetching and State

!!! warning "State Management Constraints"

    Tanstack Query (React Query) is used for all asynchronous state management and server data fetching. Custom hooks for queries should be located near their feature domains (e.g., `app/course-management/queries/`). Do not use `useEffect()` for data fetching.

---

## :material-language-python: 8. Python Conventions

### 8.1 Architecture & Patterns

The `apps/pdf_parser` microservice extracts data from unstructured academic PDFs using PyMuPDF.

### 8.2 Formatting and Linting

Python code must adhere to PEP 8. We use Black for opinionated formatting and Ruff for fast linting. Type hinting is mandatory for all function signatures and return types to maintain similarity with our TypeScript apps.

### 8.3 Testing

Testing is done via `pytest`. We maintain an extensive suite of test PDFs inside `up_test_pdfs/` to ensure parser immunity against bad data. All new parsers must have associated fixture tests.

??? note "Resilience and Adaptability"

    Because PDF structures change (e.g. between different universities), we use an adapter design pattern located in `apps/pdf_parser/parser/adapters/`. The `registry.py` handles dynamic routing of parsers based on file fingerprints.

---

## :material-language-cpp: 9. C++ Conventions

### 9.1 Memory Management

??? warning "Memory Leak Prevention"

    **9.1 Structure and Compilation**

    - **Makefiles:** Building is done via the root makefile. Ensure all new object files are correctly linked.
    - **Header vs Implementation:** Strict separation of `.h` and `.cpp` files. Headers must contain include guards (`#pragma once`).
    - **Memory Management:** Raw pointers (`new`/`delete`) are forbidden. Utilise C++14/17 smart pointers (`std::unique_ptr`, `std::shared_ptr`) to prevent memory leaks.

### 9.2 Algorithm Handlers

The scheduling logic lives in `apps/preference-solver`, utilising Constraint Programming and Genetic Algorithms.

The application is split between `CP_SOLVER/` and `GA_handler/`. Shared data structures (e.g., `module.cpp`, `event.cpp`) are kept in `src/data/` to ensure both solvers operate on identical domain representations.