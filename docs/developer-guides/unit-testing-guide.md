# Unit Testing Guide

!!! info "Write the test first, always."
    **Red → Green → Refactor.** Never write feature code without a failing test waiting for it.

---

## :material-map-marker: Where Things Live

=== "Backend"
    ```
    apps/backend/src/
      some.service.ts        ← source
      some.service.spec.ts   ← test lives next to it
    ```

=== "Frontend"
    ```
    apps/frontend/src/
      some.component.tsx       ← source
      some.component.spec.tsx  ← test lives next to it (or in __tests__/)
    ```

=== "Shared Base"
    ```
    jest.config.base.js   ← shared timeout + reporters — don't touch
    ```

---

## :material-console: What to Run

```bash
pnpm run test:unit                              # all unit tests (no e2e)
pnpm --filter backend run test -- --coverage   # backend with coverage
pnpm --filter frontend run test -- --coverage  # frontend with coverage
```

---

## :material-alert-circle: What to Worry About

??? warning "Coverage thresholds — CI blocks merges below these"
    | App          | Statements | Branches | Functions | Lines |
    | :----------- | :--------: | :------: | :-------: | :---: |
    | **Backend**  | 20%        | 8%       | 12%       | 18%   |
    | **Frontend** | 25%        | 35%      | 18%       | 25%   |

??? warning "Test quality"
    - Name reads like a sentence: `it('should return 400 if the date is in the past')`
    - One behaviour per test — if it can fail for two reasons, split it.
    - Only mock what crosses a real boundary (HTTP, DB, file system).

---

## :material-check-decagram: Definition of Done

??? success "Unit Test Checklist"
    - [ ] Failing test written before the feature.
    - [ ] Happy path and edge cases covered.
    - [ ] Test name clearly describes the expected behaviour.
    - [ ] Suite passes locally (`pnpm run test:unit`).
    - [ ] Coverage thresholds met.

---

## :material-test-tube: Tools

| Context                | Tool                                                                                                         |
| :--------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Frontend / Backend** | ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)          |
| **Solver (Python)**    | ![pytest](https://img.shields.io/badge/pytest-%230A9EDC.svg?style=for-the-badge&logo=pytest&logoColor=white) |
