# ESLint Reference Manual (v10.2.1)

## Section 0: Quick Start

Setup the modern Flat Config for a TypeScript project.

```bash
# Initialize ESLint v10
npm init @eslint/config@latest

# Basic eslint.config.js (Flat Config)
export default [
    {
        files: ["src/**/*.ts"],
        rules: { "no-unused-vars": "error", "semi": "warn" }
    }
];

# Run linting
npx eslint .
```

Expected output: List of linting errors/warnings or a clean exit if all rules are followed.

## Section 1: Key Language Terms & Features

- **Flat Config** — The mandatory configuration system (v10+) that uses an array of objects in `eslint.config.js`. | `export default [...]` | ⚠️ `.eslintrc` files are no longer supported and will be ignored.
- **Language-Aware Rules** — (New in v10) Rules that can declare and validate specific languages via metadata. | `meta: { languages: ["javascript"] }` | ⚠️ Allows for better multi-language support in a single project.
- **Temporal API Support** — Built-in rules for correctly handling the modern JavaScript Temporal date/time API. | `rules: { "no-temporal-mutation": "error" }` | ⚠️ Essential for modern apps using the stable Temporal spec.
- **Plugins** — Sets of rules and configurations provided by the community (e.g., `@typescript-eslint`). | `plugins: { ts: tseslint.plugin }` | ⚠️ Plugins must be explicitly imported and added to the config object.
- **Parsers** — Tools that turn code into an AST (Abstract Syntax Tree) for ESLint to analyze. | `parser: tseslint.parser` | ⚠️ TypeScript requires the `@typescript-eslint/parser` to understand non-standard syntax.
- **Linter** — The core engine that executes rules against the AST and reports issues. | `npx eslint` | ⚠️ Performance is improved in v10 due to better AST caching.
- **Global Variables** — Predefined variables that ESLint should recognize as valid (e.g., `window`, `process`). | `languageOptions: { globals: globals.browser }` | ⚠️ Requires the `globals` npm package for standard environment definitions.
- **Fixer** — Logic within a rule that can automatically correct a detected issue. | `eslint --fix` | ⚠️ Not all rules support auto-fixing; some require manual intervention.
- **Ignores** — Global or local patterns for excluding files from linting. | `{ ignores: ["dist/"] }` | ⚠️ Ignores in Flat Config are more intuitive and replace `.eslintignore`.
- **In-Editor Linting** — Real-time feedback provided by IDE extensions (VS Code, WebStorm). | (Extension settings) | ⚠️ Ensure your IDE extension is updated to support the v10 Flat Config format.

## Section 2: Key Commands & Workflows

- `npm init @eslint/config` — Interactive wizard for setting up a new project. | _Initial configuration._
- `npx eslint .` — Lints all files in the current directory and subdirectories. | _Manual checks._
- `npx eslint . --fix` — Automatically fixes all repairable linting issues. | _Routine maintenance._
- `npx eslint --inspect-config` — Opens a web UI to visualize and debug your Flat Config. | _Troubleshooting complex configs._
- `npx eslint --print-config <file>` — Outputs the effective configuration for a specific file. | _Verifying rule application._
- `npx eslint --cache` — Stores results to only lint changed files in subsequent runs. | _CI/CD performance._
- `npx eslint --max-warnings 0` — Forces the command to fail if any warnings are present. | _Strict enforcement._

## Section 3: Architecture & Component Relationships

```
Source Code (.js, .ts, .vue)
       ↓
[Parser] (AST Generation)
       ↓
[Linter Engine] ← [Rules & Plugins]
       ↓ (Traversal & Analysis)
Report (Errors, Warnings, Fixes)
       ↓
[Formatter] (Console, JSON, HTML)
```

**Key Flow:** ESLint uses a **Parser** to convert your code into an **AST**. The **Linter Engine** traverses this tree, applying **Rules** from your **Flat Config** and **Plugins**, generating a **Report** that is then displayed via a **Formatter**.

## Section 4: Documentation Links

- [Official ESLint Docs](https://eslint.org/docs/head/) — _Core guides and rule reference._
- [Flat Config Migration Guide](https://eslint.org/docs/head/use/configure/migration-guide) — _Upgrading from .eslintrc._
- [ESLint Rules List](https://eslint.org/rules/) — _Searchable database of every built-in rule._
- [Config Inspector](https://eslint.org/blog/2024/04/eslint-config-inspector/) — _Debugging tool for modern configs._
- [TypeScript ESLint Docs](https://typescript-eslint.io/) — _Best practices for linting TypeScript._
