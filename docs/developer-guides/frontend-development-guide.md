# Frontend Development Guide

!!! info "Purpose"
This guide defines how frontend work should be built, checked, and prepared for review to deliver a consistent user experience and professional UI code.

---

## :material-web: Technology Stack

| Library                                                                                                                       | Role                             |
| :---------------------------------------------------------------------------------------------------------------------------- | :------------------------------- |
| ![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)                    | App Router, SSR, and Routing     |
| ![Shadcn/UI](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)               | Base UI components & consistency |
| ![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) | Utility-first styling & layout   |
| ![Playwright](https://img.shields.io/badge/-playwright-%232EAD33?style=for-the-badge&logo=playwright&logoColor=white)         | E2E flow verification            |

---

## :material-auto-fix: Workflow

1.  **Branch**: Start from `dev`.
2.  **Scope**: Confirm UI expectations and states (Loading, Success, Error).
3.  **Build**: Implement using `shadcn/ui` and `Tailwind`.
4.  **Connect**: Bind to backend APIs or mock data.
5.  **Check**: Run local linting and accessibility checks.
6.  **PR**: Open a PR with **screenshots or recordings**.

---

## :material-check-decagram: Definition of Done

??? success "Frontend Checklist" - [ ] UI matches the feature design exactly. - [ ] Responsive behavior verified (Mobile/Desktop). - [ ] Loading, Success, and Error states are handled. - [ ] Components are modular and reusable. - [ ] Manually verified in at least two browsers. - [ ] PR includes visual evidence (Screenshots/Video).

---

## :material-palette: UI Best Practices

=== "Components"
Prefer extending `shadcn/ui` patterns over inventing one-off components. Keep components small and focused.

    ```tsx
    import { Button } from "@/components/ui/button"

    export function ActionButton() {
      return <Button variant="outline">Action</Button>
    }
    ```

=== "Styling"
Use Tailwind class usage intentionally. Avoid "magic numbers" in layouts; use the spacing scale.

=== "State"
Make state handling explicit. Use server components where possible for data fetching to reduce client-side complexity.
