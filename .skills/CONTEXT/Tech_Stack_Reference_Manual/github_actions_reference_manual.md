# GitHub Actions Reference Manual (2026 Edition)

## Section 0: Quick Start

Define a simple CI workflow to test your code on every push.

```yaml
# .github/workflows/ci.yml
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-26.04
    steps:
      - uses: actions/checkout@v5
      - run: npm install && npm test
```

Expected output: A successful checkmark in the GitHub "Actions" tab after pushing code.

## Section 1: Key Language Terms & Features

- **Workflow** — An automated process defined in a YAML file in the `.github/workflows` directory. | `name: My Workflow` | ⚠️ Workflows must have a unique filename within the repository.
- **Event** — A specific activity that triggers a workflow (push, pull_request, schedule). | `on: [push, pull_request]` | ⚠️ Use activity types (e.g., `opened`, `synchronize`) for granular PR control.
- **Job** — A set of steps that execute on the same runner (virtual machine). | `jobs: build:` | ⚠️ Jobs run in parallel by default; use `needs` to define sequential dependencies.
- **Step** — An individual task within a job (running a script or using an action). | `run: echo "Hello"` | ⚠️ If a step fails, subsequent steps in the same job are skipped by default.
- **Action** — A reusable extension that performs a complex task (e.g., setting up Node.js). | `uses: actions/setup-node@v4` | ⚠️ Prefer using actions from verified creators to ensure security and stability.
- **Runner** — The server that executes the jobs (GitHub-hosted or self-hosted). | `runs-on: ubuntu-latest` | ⚠️ GitHub-hosted runners are cleared after every job; no state is preserved.
- **Contexts** — Objects containing information about the workflow run (github, secrets, env). | `${{ github.ref }}` | ⚠️ Use `${{ ... }}` syntax to access context variables within your YAML.
- **Secrets** — Sensitive variables that are encrypted and only accessible to workflows. | `${{ secrets.DB_PASSWORD }}` | ⚠️ Never print secrets to the console; GitHub attempts to mask them, but it's not foolproof.
- **Environment** — A logical target for deployments (e.g., Production, Staging) with protection rules. | `environment: production` | ⚠️ Can require manual approval or specific branch restrictions before running.
- **Matrix** — A way to run a single job across multiple versions of software or OS. | `matrix: node: [18, 20, 22]` | ⚠️ Be mindful of the total number of jobs generated to avoid hitting concurrency limits.
- **OIDC (OpenID Connect)** — Securely connecting to cloud providers (AWS/GCP/Azure) without long-lived secrets. | `permissions: id-token: write` | ⚠️ The most secure way to handle cloud authentication in CI/CD.

## Section 2: Key Commands & Workflows

- `name: ...` — Sets the display name for the workflow or job. | _Labeling._
- `on: push` — Triggers on every code push to the repository. | _Continuous Integration._
- `uses: actions/checkout@v5` — Fetches the repository code onto the runner. | _Initial step for most jobs._
- `with: ...` — Passes input parameters to an action. | _Action configuration._
- `env: ...` — Defines environment variables for a step or job. | _Parameterization._
- `if: github.event_name == 'push'` — Conditionally executes a job or step. | _Flow control._
- `needs: [job1, job2]` — Ensures current job only runs after dependencies finish. | _Sequential pipelines._
- `actions/cache@v4` — Persists dependencies (like node*modules) between runs. | \_Performance optimization.*

## Section 3: Architecture & Component Relationships

```
GitHub Event (Push/PR)
       ↓
Workflow Parser (.github/workflows/*.yml)
       ↓
Workflow Run (Visualized in UI)
       ↓
[Job 1] (Runner VM)  [Job 2] (Runner VM)
       ↓                     ↓
[Step 1] (Shell/Action)   [Step 1] (Shell/Action)
       ↓                     ↓
Cloud Auth (OIDC) ←→ External APIs (AWS/GCP/Docker)
```

**Key Flow:** An **Event** triggers the **Workflow**, which orchestrates multiple **Jobs**. Each Job runs on a clean **Runner**, executing **Steps** that utilize **Actions** to interact with the code or **External APIs** via secure **OIDC** tokens.

## Section 4: Documentation Links

- [Official GitHub Actions Docs](https://docs.github.com/en/actions) — _Comprehensive guides and syntax reference._
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) — _Every available YAML key._
- [GitHub Marketplace](https://github.com/marketplace?type=actions) — _Searchable directory of thousands of actions._
- [OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect) — _Deep dive into secure cloud connectivity._
- [Self-Hosted Runners Guide](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners) — _Setting up your own infrastructure for CI/CD._
