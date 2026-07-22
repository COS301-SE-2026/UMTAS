???+ info "Overview"
    | **ID** | **Section** |
    |:---:|:---|
    | **TP-1** | [Testing Objectives](#tp-1-testing-objectives) |
    | **TP-2** | [Testing Types](#tp-2-testing-types) |
    | **TP-3** | Tools and Environments |
    | **TP-4** | Defect Management |
    | **TP-5** | Acceptance Criteria |
    | **TP-6** | Roles and Responsibilities |
    | **TP-7** | Test Data Policy |
    | **TP-8** | Reporting & Metrics |
    | **TP-9** | Risk-Based Testing |
    | **TP-10** | Maintenance & Review |
    | **TP-11** | Escalation Path |

???+ info "Testing Objectives"
    ## TP-1 Testing Objectives

    The objective of the testing within the UMTAS project is to ensure that all software components meet their functional and non-functional requirements whilst maintaining: correctness, reliability, security and maintainability throughout the development lifecycle.

    ## Objectives:
    - Verify implemented functionality satisfies the requirements defined in the Software Requirements Specification (SRS).
    - Detect defects as early as possible in the development process to reduce the cost and impact of failures.
    - Ensure that individual software components function correctly in isolation through unit testing.
    - Validate interactions between system components through integration testing.
    - Verify that complete user workflows operate correctly through end-to-end testing.
    - Prevent regressions by automatically executing tests during continuous integration.
    - Ensure that software changes do not negatively affect existing functionality.
    - Provide confidence to team that system is stable and suitable for deployment.
    - Support maintainable software development through repeatable and automated quality assurance practices.

    *Testing shall form a mandatory quality gate before code is merged into main branch or deployed to production environments.*


??? info "Testing Types"
    # **TP-2 Testing Types**
    ---

    ??? "**2.1 Unit Testing**"

        ### Purpose

        Unit testing is performed to verify that individual functions, methods, services, and controllers behave correctly in isolation.

        ### Scope

        Unit tests focus on testing individual units of code without relying on external systems such as databases, APIs, or user interfaces. Dependencies are mocked or stubbed where appropriate.

        ### Technology

        * Jest

        ### Execution

        Unit tests are executed locally by developers during development and automatically within the Continuous Integration (CI) pipeline with its own container to ensure proper isolation.

        ### Success Criteria

        * All unit tests must pass.
        * New business logic should be accompanied by appropriate unit tests.
        * Unit tests should provide meaningful verification and must not contain trivial or always-true assertions.
        * A coverage standard of 80%+ will be upheld for unit tests, this applies to the logic where if each isolated module is working correctly, the system will work correctly.
        * The database service will have its own mocked out service that can be used across all unit tests.
        * All services that need to be mocked out will also happen in a central Testing directory so they can be reused across unit tests and ensure only one point of modification is required when something changes.

        #### [Unit Testing Guide](unit-testing-guide.md)

    ---

    ??? "**2.2 Integration Testing**"

        ### Purpose

        Integration testing is performed to verify the interaction between multiple system components and ensure that they function correctly when combined.

        ### Scope

        Integration tests validate interactions between application layers, including controllers, services, and database components.

        ### Technology

        * Jest
        * PGLite

        ### Execution

        Integration tests are executed locally and within the CI pipeline using isolated test environments provided by an integration testing container

        ### Success Criteria

        * All integration tests must pass.
        * Database interactions must be verified using the test database environment.
        * Integration tests must validate expected behaviour across component boundaries.
        * Integration tests will only be written and considered ones the components being tested have been unit tested.

        #### [Integration Testing Guide](integration-testing-guide.md)
    ---

    ??? "**2.3 End-to-End Testing**"

        ### Purpose

        End-to-end testing is performed to verify complete user workflows from the user interface through to the backend services.

        ### Scope

        End-to-end tests simulate real user interactions and validate system behaviour under realistic operating conditions, for example the user stories.

        ### Technology

        * Playwright

        ### Execution

        End-to-end tests are executed against a deployed test instance of the application and may be run both locally and within CI environments.

        ### Success Criteria

        * Critical user journeys must execute successfully.
        * No critical workflow failures may be present in the release candidate.

        #### [E2E Testing Guide](e2e-testing-guide.md)

    ---

    ??? "**2.4 Static Analysis and Code Quality Validation**"

        ### Purpose

        Static analysis is performed to identify code quality issues, style violations, and potential defects before runtime.

        ### Scope

        Source code is analysed for formatting, linting violations, type safety issues, and maintainability concerns.

        ### Technology

        * ESLint
        * TypeScript Compiler

        ### Execution

        Static analysis is executed through local development tooling, pre-commit hooks, and the CI pipeline.

        ### Success Criteria

        * No linting errors may be present.
        * No TypeScript compilation errors may be present.
        * Code must conform to the project's defined coding standards.

    ---

    ??? "**2.5 Continuous Integration Validation**"

        ### Purpose

        Continuous Integration validation ensures that all quality gates are satisfied before changes are merged into the main branch.

        ### Scope

        CI validation executes automated quality assurance checks, including static analysis, build verification, and automated testing.

        ### Technology

        * GitHub Actions

        ### Execution

        CI validation is automatically triggered for pull requests and repository events as defined by the project's CI configuration.

        ### Success Criteria

        * All CI workflow stages must complete successfully.
        * Builds must compile without errors.
        * All automated quality checks must pass before approval or deployment.
