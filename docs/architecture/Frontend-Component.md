# Architectural Component: Frontend

The Frontend is the user-facing layer of UMTAS, comprising three application surfaces: the Base Frontend (general student and lecturer interface), the University-Customised Frontend (the same application with university-specific branding and feature configuration), and the University Admin Dashboard (analytics, venue management, and system configuration for university administrators). All three surfaces are built from a shared component library and differ only in applied theme and enabled feature set.

The Frontend depends on: the Core API (for all data operations via REST). It has no direct connection to any other backend component. The Core API depends on the Frontend to surface results and notifications to users.

---

## 6.1 Architectural Quality Requirements

### 6.1.1 Usability

The frontend must be intuitive and accessible to students, lecturers, and administrators with varying technical literacy. The interface must comply with WCAG 2.1 AA accessibility standards (minimum 4.5:1 colour contrast ratio for normal text, full keyboard navigation, semantic HTML with ARIA labels, screen reader compatibility). The layout must be responsive across mobile viewports (320 px minimum), tablet, and desktop. University branding must be applied purely through the theming layer — no hardcoded colours or logos anywhere in component code. Usability is validated through wireframe reviews, prototype testing, and a user acceptance test session before final delivery.

### 6.1.2 Performance

Slow page loads increase abandonment and reduce trust in the system. Initial page load must benefit from server-side rendering (SSR) to deliver a fully rendered first contentful paint without requiring JavaScript execution on the client. Subsequent navigations use client-side routing for instant transitions. JavaScript bundle size is minimised through code splitting: per-route bundles are loaded on demand, ensuring that students loading the timetable view do not download the admin analytics bundle. Target: initial page load under 2 seconds on a standard broadband connection; Lighthouse performance score ≥ 80.

### 6.1.3 Maintainability

The component-based architecture with a shared library prevents duplication across the three application surfaces. Components are built once and reused everywhere — a change to the Timetable Grid component propagates to all surfaces without manual synchronisation. Tailwind CSS utility classes applied via component defaults ensure visual consistency without custom stylesheet proliferation. The theming layer is declarative — adding a new university's branding requires only configuration changes, not code changes.

### 6.1.4 Testability

End-to-end tests using a browser automation framework must cover all critical user flows: registration, login, timetable creation, timetable generation, calendar export, and admin dashboard access. Tests must be runnable in headless mode as part of CI on every pull request. Component-level unit tests must cover all form validation logic and state management behaviour.

### 6.1.5 Security

All authentication flows must go through the Core API — the frontend never handles raw credentials or stores tokens in insecure storage. OAuth flows are initiated by the frontend but completed server-side by the Core API. Content Security Policy headers must be configured to prevent XSS. All forms must implement client-side input validation (in addition to server-side validation in the Core API) to prevent obvious injection attempts from reaching the network.

---

## 6.2 Architectural Responsibility

The Frontend is responsible for:

- **Routing and Navigation:** Mapping URL paths to application views, enforcing authenticated-only routes client-side.
- **Data Fetching and State Management:** Requesting data from the Core API, caching responses for the duration of a session, and managing loading and error states.
- **Timetable Rendering:** Displaying timetable grids, calendar views, and conflict indicators.
- **Form Handling and Validation:** Collecting user input for timetable creation, preference setting, and account management, with client-side validation before submission.
- **University Theming Application:** Applying the correct colour palette, typography, and logo based on the university configuration.
- **Feature Flag Enforcement:** Showing or hiding features (e.g. PDF upload) based on the university-specific feature configuration.
- **Async Job Status Display:** Polling or subscribing to job completion events and updating the UI to reflect parse/generation progress.
- **Accessibility Compliance:** Ensuring all components meet WCAG 2.1 AA standards.

!!! example "Figure 16: Frontend — Component-Based Architecture"

    ```kroki-plantuml
    @startuml Figure16_FrontendComponentBased
    !theme plain
    top to bottom direction

    rectangle "Shared Component Library" #dbeafe {
        component "Navigation Components" as NAV
        component "Timetable Grid" as GRID
        component "Form Components" as FORMS
        component "Modal / Dialog Components" as MODAL
        component "Calendar View Components" as CALENDAR
    }

    rectangle "Configuration Layer" #dcfce7 {
        component "Theming Layer\n— colours, logos, typography" as THEME
        component "Feature Flags\n— per-university capabilities" as FEAT
    }

    component "Base Frontend" as BF
    component "University-Customised Frontend" as CF
    component "Admin Dashboard" as AF

    NAV --> THEME
    GRID --> THEME
    FORMS --> THEME
    MODAL --> THEME
    CALENDAR --> THEME
    THEME --> BF
    THEME --> CF
    THEME --> AF
    FEAT --> BF
    FEAT --> CF
    FEAT --> AF

    @enduml
    ```

!!! example "Figure 17: Analytics Dashboard — Read-Optimised Layered Architecture"

    ```kroki-plantuml
    @startuml Figure17_AnalyticsDashboard
    !theme plain
    top to bottom direction

    component "Core API" as CoreAPI #dcfce7

    rectangle "University Admin Dashboard" #f3e8ff {
        component "Presentation Layer\n— Charts, Tables, Alerts, Reallocation Controls" as PRES
        component "Aggregation Layer\n— Utilisation Rates, Lecturer Load, Overcapacity Counts" as AGG
        component "Data Access Layer\n— Read-only queries to Core API (REST)" as DA
    }

    PRES --> AGG
    AGG --> DA
    DA --> CoreAPI

    @enduml
    ```

---

## 6.3 Frameworks and Technologies

### Frontend Application Framework

| Framework | Assessment |
|---|---|
| **Next.js** | React-based full-stack framework providing SSR, Static Site Generation (SSG), file-based routing, App Router with Server Components, and built-in API routes. React's component model is the industry standard for component-based UI. Next.js's SSR capability directly satisfies the performance requirement for a fast first contentful paint. Large ecosystem, Vercel/self-hosted deployment flexibility, and strong community support. |
| **Nuxt.js** | Vue-based full-stack framework equivalent in capability to Next.js. SSR, file-based routing, strong module ecosystem. Vue's Options API / Composition API differs significantly from React's hooks model; the team's existing React knowledge means Next.js carries substantially lower ramp-up cost without sacrificing any capability. |
| **SvelteKit** | Svelte-based full-stack framework. Excellent runtime performance due to compile-time reactivity (no virtual DOM). However, the Svelte ecosystem for accessible, pre-built UI component libraries is considerably smaller than React's. Fewer enterprise-grade component libraries are available with the accessibility and theming depth required, and team familiarity is lower. |

### UI Component Library

| Library | Assessment |
|---|---|
| **Shadcn/UI** | Unstyled, accessible React components built on Radix UI primitives and styled with Tailwind CSS. Components are copied directly into the project repository rather than installed as a runtime dependency — enabling full customisation without library API constraints. The headless Radix UI foundation guarantees WCAG-compliant accessibility behaviour (keyboard navigation, ARIA) by default. University theming is applied entirely through Tailwind CSS configuration (design tokens) — no component-level overrides required. Zero-runtime CSS-in-JS: all styling is class-based, resulting in a smaller bundle. |
| **Material UI (MUI)** | React component library implementing Google's Material Design specification. Rich, comprehensive component set, but deeply opinionated styling that conflicts with university-specific branding. Theming requires overriding a large, nested token system (CSS-in-JS via Emotion), and the Material Design visual language is recognisable as Google's — not neutral enough for white-label university theming. |
| **Chakra UI** | Accessible, composable React component library with a design token system. Good theming support and accessibility. However, it relies on a CSS-in-JS runtime (Emotion), which increases bundle size and can introduce style hydration issues with SSR. Less community traction and fewer ready components than Shadcn for new projects in the Next.js/Tailwind ecosystem. |

---

## 6.4 Architectural Realization Mapping

- The **shared component library** is realised as a set of Shadcn/UI components (backed by Radix UI primitives) installed into a shared workspace package, imported by all three application surfaces.
- The **theming layer** is realised as a Tailwind CSS configuration object per university, defining CSS custom property values (primary colour, secondary colour, font family, logo URL) that are applied globally without touching component code.
- The **feature-flag layer** is realised as a per-university configuration object (served from the Core API on application initialisation) that the frontend reads to conditionally render or hide feature entry points.
- **SSR** is realised by Next.js Server Components that pre-render the initial timetable view on the server, delivering a fully-populated HTML response to the client.
- **Routing** is realised by Next.js App Router, with route-level guards checking authentication state before rendering protected pages.
- **Async job status** is realised by a polling mechanism (or SSE if the Core API implements it) that updates a job status indicator in the UI until the parse or generation job completes.

| Responsibility | Realised By |
|---|---|
| Routing and navigation | Next.js App Router with dynamic routes |
| Data fetching | React hooks (useEffect) with fetch/axios |
| State management | Zustand store |
| Timetable rendering | Shadcn/UI table component + custom grid logic |
| Form handling | React form libraries (react-hook-form) |
| University theming | Tailwind CSS theme configuration |
| Feature flags | Runtime configuration from Core API |
| Async job status | Polling service + UI state updates |
| Accessibility | Radix UI primitives + semantic HTML |

---

## 6.5 Technology Choice

The Frontend will be built using **Next.js** (with the App Router) as the application framework, **Zustand** for state management, **Shadcn/UI + Radix UI** as the component library, and **Tailwind CSS** as the styling system.

Next.js was chosen because its SSR capability directly satisfies the performance requirement (fast first contentful paint), and its React foundation aligns with the team's existing knowledge, minimising ramp-up cost. The App Router's Server Component model enables efficient data fetching without client-side waterfall requests.

Zustand was chosen for state management because of its minimalist API and excellent performance. It provides a simple way to manage global state without the boilerplate of Redux or the context-rerender issues of native React Context.

Shadcn/UI was chosen because its headless Radix UI foundation provides WCAG-compliant accessibility behaviour with no additional effort, directly satisfying the usability requirement. Its copy-into-project model gives the team full control over component code — no breaking changes from upstream library updates. The Tailwind CSS–based theming system enables the university branding requirement (arbitrary colour and typography customisation) to be satisfied through pure configuration, with no component code changes required per university.
