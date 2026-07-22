???+ "Overview"
    <div align="center">

    | **ID** | **Section** |
    |:---:|:---|
    | **TP-1** | [Testing Objectives](#testing-objectives) |
    | **TP-2** | [Testing Types](#testing-types) |
    | **TP-3** | [Tools and Environments](#tools-and-environments) |
    | **TP-4** | [Defect Management](#defect-management) |
    | **TP-5** | [Acceptance Criteria](#acceptance-criteria) |
    | **TP-6** | [Roles and Responsibilities](#roles-and-responsibilities) |
    | **TP-7** | [Test Data Policy](#test-data-policy) |
    
    </div>
???+ info "TP-1 Testing Objectives"
    ## **Testing Objectives**

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


??? info "TP-2 Testing Types"
    # **Testing Types**
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



??? info "TP-3 Tools and Environments"
    # **Tools and Environments**

    The UMTAS project defines the tools and environments used to support automated testing, ensuring consistency, reliability, and integration across the development lifecycle.

    ---
    ??? "3.1 Testing Tools"
        The UMTAS project utilises the following tools to support automated testing and quality assurance activities:

        | Tool | Purpose |
        |------|---------|
        | Jest | Unit and integration testing |
        | Playwright | End-to-end testing |
        | ESLint | Static code analysis and linting |
        | TypeScript Compiler | Type checking and build verification |
        | PGLite | Isolated database environment for backend integration testing |
        | Husky | Pre-commit quality gate enforcement |
        | GitHub Actions | Continuous Integration automation |

        ### Jest
        Jest is used as the primary testing framework for unit and integration testing across the project. It provides test execution, mocking capabilities, assertions, and coverage reporting.

        ### Playwright
        Playwright is used for end-to-end testing of complete user workflows. Tests simulate real user interactions with the application through a web browser.

        ### ESLint
        ESLint is used to enforce coding standards and identify potential code quality issues before code is merged into the main branch.

        ### TypeScript Compiler
        The TypeScript compiler is used to perform static type checking and ensure that the application compiles successfully before deployment.

        ### PGLite
        PGLite provides an isolated PostgreSQL-compatible testing environment for backend integration tests without requiring a dedicated database server.

        ### Husky
        Husky is used to enforce local quality gates through Git pre-commit hooks. Commits are blocked if linting or type checking fails.

        ### GitHub Actions
        GitHub Actions executes automated quality assurance workflows, including static analysis, build verification, and automated testing within the CI pipeline.

    ---
    ??? "3.2 Testing Environments"

        ### Local Development Environment
        Developers execute tests locally during development to verify functionality before committing changes. Unit tests, integration tests, and end-to-end tests may all be executed within the local development environment.

        ### Isolated Test Environments
        Automated tests execute within isolated environments to ensure consistency and repeatability. Test environments are separated from development and production environments and are configured specifically for automated validation.
        Backend integration tests utilise isolated database instances through PGLite. Additional containerised environments may be used to support testing activities where required.

        ### Continuous Integration Environment
        The Continuous Integration environment is managed through GitHub Actions. Every pull request and repository event triggers an automated validation pipeline.

        The CI environment executes:
        - ESLint validation
        - Type checking
        - Build verification
        - Unit tests
        - Integration tests
        - Coverage reporting
        - End-to-end tests (when applicable)

        All automated quality gates must pass successfully before changes may be merged into the main branch.

        ### Test Coverage Requirements
        The project maintains a minimum code coverage target of 80% across automated test suites. Coverage reports are generated during Continuous Integration execution and reviewed as part of the quality assurance process.



??? info "TP-4 Defect Management"
    # **Defect Management**

    Defect management ensures that issues are identified, tracked, prioritised, and resolved consistently across the project lifecycle. This process provides transparency, accountability, and quality assurance for the UMTAS project.

    ---
    ## 4.1 Purpose
    Defines how defects are identified, tracked, prioritised, and resolved to ensure issues are handled consistently across the project lifecycle.

    ---
    ## 4.2 Issue Tracking
    All defects are managed using **GitHub Issues**.

    ??? info "Each issue should include:"
        - Clear description of the problem
        - Steps to reproduce
        - Expected vs actual behaviour
        - Environment (local, CI, or ephemeral test environment)
        - Severity level
        - Supporting evidence where applicable (logs, screenshots, test output)

    ---
    ## 4.3 Defect Lifecycle
    Defects follow a standard workflow:

    - **Reported** – issue is created after discovery (manually or surfaced via CI)
    - **Triaged** – validated, prioritised, and assigned
    - **In Progress** – actively being worked on
    - **In Review** – fix submitted and validated through CI
    - **Resolved** – merged after CI passes
    - **Verified** – confirmed in local or ephemeral test environment
    - **Closed** – confirmed as fixed and no longer reproducible

    *Ephemeral test environment refers to a temporary, isolated deployment created per CI run for validation purposes.*

    ---
    ## 4.4 Severity Levels
    - **Critical** – system failure, security issue, or blocked core functionality
    - **High** – major feature broken or unusable
    - **Medium** – partial failure with workaround
    - **Low** – minor issues or cosmetic defects

    Severity reflects **impact**, not urgency of fixing.

    ---
    ## 4.5 Priority Levels
    - **P0** – immediate fix required (release/blocking issue)
    - **P1** – high priority for next release
    - **P2** – scheduled backlog work
    - **P3** – low priority or cosmetic improvements

    Priority determines **order of work** | severity determines **impact**.

    ---
    ## 4.6 CI Integration
    Defects are frequently surfaced through the CI pipeline running in **Docker-isolated environments**.

    - No code may be merged if CI checks fail
    - Fixes must pass all automated checks before resolution

    ---
    ## 4.7 Verification
    Defect fixes are validated in:

    - Local development environment
    - CI isolated containers
    - Ephemeral test environments (temporary full-stack deployment for end-to-end validation)

??? info "TP-5 Acceptance Criteria"
    # **Acceptance Criteria**

    Acceptance criteria define the conditions that must be met for a feature, change, or defect fix to be considered complete and ready for merge or deployment. They ensure consistency, quality, and confidence across the UMTAS project lifecycle.

    ---
    ??? success "5.1 Purpose"
        Defines the conditions that must be met for a feature, change, or defect fix to be considered complete and ready for merge or deployment.

    ---
    ??? info "5.2 General Criteria"
        A change is considered acceptable only if all of the following are satisfied:

        - All functional requirements defined in the related specification or user story are implemented  
        - All automated tests relevant to the change pass (unit, integration, and where applicable E2E)  
        - No new critical or high-severity defects are introduced  
        - Code meets project quality standards (linting, type checking, and build success)  
        - Changes do not break existing functionality (regression-free behaviour)  

    ---
    ??? tip "5.3 Testing-Based Acceptance"
        Acceptance is strongly tied to automated verification:

        - **Unit tests** must validate core logic in isolation  
        - **Integration tests** must confirm correct interaction between components  
        - **E2E tests** must validate critical user workflows and user stories  
        - CI pipeline must pass all stages within isolated Docker-based environments  

    ---
    ??? info "5.4 Functional Acceptance"
        A feature or fix is considered complete when:

        - It behaves according to the defined requirements or user story  
        - Edge cases relevant to the feature are handled appropriately  
        - Error handling is implemented where applicable  
        - No unintended side effects are introduced to related functionality  

    ---
    ??? warning "5.5 Quality Gate Requirements"
        The following must always be satisfied before merge into the main branch:

        - Successful CI pipeline execution  
        - Passing linting and TypeScript compilation  
        - No failing automated tests  
        - Minimum coverage expectation of 80% is maintained (target, not enforced gate)  

    ---
    ??? info "5.6 Environment Validation"
        Where applicable, acceptance must be confirmed in:

        - Local development environment  
        - CI isolated test environments  
        - Ephemeral test environment (temporary full-stack deployment used for production-like validation)  

    ---
    ??? success "5.7 Final Approval Condition"
        A change is considered accepted only when:

        - All automated checks pass  
        - Peer review is approved via pull request  
        - Functional behaviour is verified against expected outcomes  
        - No blocking issues remain in GitHub Issues linked to the change  



??? info "TP-6 Roles and Responsibilities"
    # **Roles and Responsibilities**

    This section defines accountability across the project. Roles are limited to frontend, backend, and CI/CD engineering, with responsibilities clearly assigned to ensure testing and quality assurance are consistently applied.

    ---
    ??? tip "6.1 Frontend Developer"
        Responsible for:

        - Writing unit and integration tests for UI components
        - Ensuring code passes linting and type checking
        - Validating user workflows through end-to-end tests
        - Fixing frontend defects reported in GitHub Issues

    ---
    ??? tip "6.2 Backend Developer"
        Responsible for:

        - Writing unit and integration tests for backend services
        - Maintaining database-related test coverage
        - Ensuring API endpoints meet acceptance criteria
        - Fixing backend defects reported in GitHub Issues

    ---
    ??? tip "6.3 CI/CD Engineer"
        Responsible for:

        - Maintaining and updating the CI pipeline
        - Ensuring automated quality gates run reliably
        - Configuring environments for integration and end-to-end testing
        - Monitoring test coverage and enforcing minimum thresholds

    ---
    ??? info "6.4 Shared Quality Responsibility"
        Quality is a shared responsibility across all roles:

        - Every change must be testable and verified
        - No role can bypass testing or CI requirements
        - Defects are treated as shared risks, not isolated mistakes



??? info "TP-7 Test Data Policy"
    # **Test Data Policy**

    This section defines how test data is managed to ensure reliable, repeatable, and compliant testing across the UMTAS project.

    ---
    ## 7.1 Purpose
    Test data must support accurate validation of functionality while protecting sensitive information and ensuring consistency across environments.

    ---
    ## **7.2 Data Sources**

    - Synthetic data generated for unit and integration tests  
    - Anonymised or masked data where production-like scenarios are required  
    - Predefined datasets for regression and end-to-end testing  

    ---
    ## **7.3 Data Management**

    - Test data must be versioned and maintained alongside test cases  
    - Sensitive or personal information may not be used directly in testing  
    - Data should be reset or refreshed between test runs to ensure repeatability  

    ---
    ## **7.4 Environment Usage**

    - Local development uses lightweight synthetic datasets  
    - CI/CD pipelines use controlled, reproducible datasets  
    - Ephemeral environments may use anonymised production-like data for realistic validation  
