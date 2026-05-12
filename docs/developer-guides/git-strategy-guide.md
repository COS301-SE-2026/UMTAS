# Git Strategy Guide

!!! info "Purpose"
    This guide defines how we use branches and pull requests so collaboration stays clean, predictable, and easy to review.

---

## :material-source-branch: Branch Structure

| Branch       | Purpose                                                      |
| :----------- | :----------------------------------------------------------- |
| `main`       | Production-ready. Protected — no direct pushes.              |
| `dev`        | Integration target. All pull requests merge here.            |
| `feat/*`     | New features. Cut from `dev`, PR back to `dev`.              |
| `fix/*`      | Bug fixes. Cut from `dev`, PR back to `dev`.                 |
| `docs/*`     | Documentation-only changes.                                  |
| `refactor/*` | Code quality or structural changes with no behaviour change. |

Branch names must use the prefix matching the PR type, followed by a short kebab-case description — e.g. `feat/pdf-parser`, `fix/auth-token-expiry`.

---

## :material-map-marker-path: Workflow (TDD Git Flow)

Follow these steps for every new feature or bug fix:

1.  **Sync**: Start from the latest `dev`.
2.  **Branch**: Create a dedicated branch using the naming convention above.
3.  **Red**: Write a failing test for your next unit of work (Jest/pytest).
4.  **Green**: Build the feature code to pass the test.
5.  **Refactor**: Clean up the code and commit.
6.  **PR**: Open a PR into `dev` once all checks pass locally.

---

## :material-check-decagram: Definition of Done

??? success "Criteria for a Merge-Ready Branch"
    - [ ] Work is isolated in a dedicated branch.
    - [ ] The branch targets `dev`.
    - [ ] The PR is complete and review-ready.
    - [ ] Related issues are linked.
    - [ ] Merge conflicts are resolved.
    - [ ] CI passes successfully.
    - [ ] The branch history is understandable enough to review.

---

## :material-file-document-edit: Pull Request Requirements

Every PR should include a clear title, description, and the following metadata:

| Field             | Requirement                                |
| :---------------- | :----------------------------------------- |
| **Title**         | `feat: ...`, `fix: ...`, `docs: ...`       |
| **Description**   | Summary of changes and technical decisions |
| **Linked Issues** | Closes #123                                |
| **Assignee**      | Assign yourself                            |
| **Reviewer**      | Assign at least one teammate               |

??? note "Pull Request Template (Copy/Paste)"
    ```markdown
    ## Objective
    [What are we trying to achieve?]

    ## Changes
    - [Change 1]
    - [Change 2]

    ## Testing
    - [ ] Unit tests added/updated
    - [ ] Integration tests verified
    - [ ] E2E (Playwright) verified (if applicable)

    ## Checklist
    - [ ] Sync'd with dev
    - [ ] Conflicts resolved
    - [ ] CI passing
    ```
