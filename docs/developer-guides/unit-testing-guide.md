# Unit Testing Guide

!!! info "Purpose"
This guide defines how we write and maintain unit tests so logic can be validated quickly and consistently across all services.

---

## :material-auto-fix: Workflow (TDD Foundation)

Unit testing forms the core of our **Red-Green-Refactor** workflow. The fundamental rule is: **Always write the failing test first.**

1.  **Red (Failing)**: Write the failing unit test using **Jest** or **pytest** _before_ you write the feature logic.
2.  **Green (Pass)**: Write the minimal feature logic necessary to pass the test.
3.  **Refactor**: Clean up the code and remove duplicates while keeping tests green.
4.  **Verify**: Run the suite locally and include tests in your PR.

---

## :material-test-tube: Tools & Frameworks

| Context                      | Tool                                                                                                         |
| :--------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Frontend/Backend (JS/TS)** | ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)          |
| **Solver (Python)**          | ![pytest](https://img.shields.io/badge/pytest-%230A9EDC.svg?style=for-the-badge&logo=pytest&logoColor=white) |
| **Code Quality**             | ![ESLint](https://img.shields.io/badge/eslint-3A33D1?style=for-the-badge&logo=eslint&logoColor=white)        |

---

## :material-check-decagram: Definition of Done

??? success "Unit Test Checklist" - [ ] Happy path and edge cases are covered. - [ ] Tests are readable, stable, and deterministic. - [ ] Test names clearly describe the expected behavior. - [ ] Suite passes locally in under 30 seconds. - [ ] CI coverage requirements are met.

---

## :material-lightbulb: Best Practices

=== "What to Test" - Utility functions and pure logic. - Isolated business rules (e.g. scheduling constraints). - Component behavior in isolation (rendering, events).

=== "Naming"
Use descriptive names that read like a sentence:

    ```typescript
    it('should return 400 if the date is in the past', () => { ... })
    ```

=== "Mocking"
Avoid over-mocking. If you need to mock more than 3 dependencies, your function might be doing too much.
