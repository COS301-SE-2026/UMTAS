# Husky Reference Manual (v9.1.x)

## Section 0: Quick Start

Immediate hands-on path for automating Git hooks.

```bash
# Install husky
pnpm add --save-dev husky

# Initialize husky
pnpm exec husky init
```

Verify `.husky/pre-commit` exists. Add `pnpm test` to it to run tests before every commit.

---

## Section 1: Key Language Terms & Features

- **Git Hooks** — Scripts that Git executes before or after events like commit, push, and receive | `.git/hooks` | ⚠️ Husky makes managing these hooks easier by keeping them in your repository.
- **pre-commit** — Hook that runs before you even type a commit message | `husky.add('.husky/pre-commit', 'npm test')` | ⚠️ Use this for linting and unit tests to ensure code quality.
- **pre-push** — Hook that runs before code is pushed to a remote repository | `husky.add('.husky/pre-push', 'npm run build')` | ⚠️ Ideal for running slow tests or build checks that shouldn't block local commits.
- **commit-msg** — Hook used to validate the commit message format | `npx --no -- commitlint --edit ${1}` | ⚠️ Use with `commitlint` to enforce Conventional Commits.
- **init** — The recommended way to quickly set up Husky in a project | `husky init` | ⚠️ `husky init` sets up the `prepare` script in `package.json` automatically.
- **prepare script** — Lifecycle script that runs after `npm install` to ensure hooks are set up | `"prepare": "husky"` | ⚠️ If this script is missing, hooks won't be installed for other team members.
- **HUSKY_SKIP_INSTALL** — Environment variable to skip Husky installation in CI environments | `export HUSKY_SKIP_INSTALL=1` | ⚠️ Use this in Docker or CI to avoid unnecessary overhead.
- **Manual Setup** — Creating hooks without using `husky init` | `husky install && husky add ...` | ⚠️ Older versions used `install`; v9+ prefers the simpler `init` flow.

---

## Section 2: Key Commands & Workflows

- `pnpm exec husky init` — Recommended one-command setup for new projects | _Initial setup._
- `npx husky add .husky/pre-commit "pnpm lint"` — Adds a new hook (v8 style) | _When adding specific hooks manually._
- `chmod +x .husky/pre-commit` — Ensures the hook script is executable | _When hooks fail to run on Unix systems._
- `git commit -m "..." --no-verify` — Commits while bypassing all Git hooks | _Emergency use only._
- `pnpm exec husky` — Runs the husky installer (usually via `prepare` script) | _Ensuring hooks are active after install._
- `npx husky uninstall` — Removes husky and restores original hooks | _Removing the library._
- `set -e` — Shell command often used in hooks to stop on the first error | _Inside hook scripts._
- `echo "..."` — Used for providing feedback to the user during hook execution | _Logging in hooks._

---

## Section 3: Architecture & Component Relationships

Husky links Git's native hook system to scripts stored within your project.

```text
Git Event (e.g., Commit)
        ↓
   .git/hooks/
        ↓ (Husky Redirect)
   .husky/pre-commit
        ↓
[ User Script (e.g., Lint, Test) ]
        ↓
   Success / Failure
```

---

## Section 4: Documentation Links

- [Official Documentation](https://typicode.github.io/husky/) — _Getting started and usage._
- [Git Hooks Guide](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks) — _Understanding native Git hooks._
- [Commitlint Integration](https://commitlint.js.org/) — _Enforcing commit message standards._
- [Husky GitHub](https://github.com/typicode/husky) — _Source code and issues._
- [Troubleshooting FAQ](https://typicode.github.io/husky/troubleshooting.html) — _Common fixes._
