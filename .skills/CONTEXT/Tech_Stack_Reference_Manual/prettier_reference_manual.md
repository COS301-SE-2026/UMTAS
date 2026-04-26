# Prettier Reference Manual (v3.4.x)

## Section 0: Quick Start

Immediate hands-on path for consistent code formatting.

```bash
# Install Prettier
pnpm add --save-dev --save-exact prettier

# Format all files
pnpm exec prettier . --write
```

See files updated with consistent spacing, quotes, and semicolons.

---

## Section 1: Key Language Terms & Features

- **Opinionated Formatter** — Enforces a consistent style by parsing code and re-printing it with its own rules | `prettier --write` | ⚠️ Don't fight the defaults; Prettier is designed to end "style debates."
- **Configuration File** — Standardizes formatting options across the team | `.prettierrc` | ⚠️ Keep this file simple; most teams only need to toggle 2-3 settings.
- **Ignore File** — Prevents Prettier from formatting specific files or directories | `.prettierignore` | ⚠️ Always ignore `node_modules`, `dist`, and large data files to save time.
- **Plugins** — Extensions that add support for additional languages (e.g., XML, PHP, Tailwind) | `prettier-plugin-tailwindcss` | ⚠️ Plugins must be listed in your `.prettierrc` to be active in some environments.
- **Integrations** — Extensions for IDEs like VS Code or WebStorm to format on save | `esbenp.prettier-vscode` | ⚠️ Ensure your IDE is using the project's local version of Prettier.
- **Print Width** — The line length that the printer will wrap on | `printWidth: 80` | ⚠️ This is a "soft limit"; Prettier will try to wrap before this but might exceed it if necessary.
- **Tab Width** — The number of spaces per indentation level | `tabWidth: 2` | ⚠️ Consistency is key; match this with your ESLint config.
- **Semi** — Whether to print semicolons at the ends of statements | `semi: true` | ⚠️ Choose one and stick to it; Prettier will add or remove them globally.

---

## Section 2: Key Commands & Workflows

- `prettier . --write` — Formats all supported files in the current directory and subdirectories | _Primary cleanup command._
- `prettier . --check` — Checks if files are formatted without changing them | _Use this in CI to fail builds._
- `prettier <file> --write` — Formats a specific file | _Quick fixes._
- `pnpm exec prettier --version` — Checks the installed version | _Debugging._
- `npx prettier --find-config-path .` — Locates the active configuration file | _Debugging setup issues._
- `npx prettier --ignore-path .gitignore . --write` — Uses gitignore instead of prettierignore | _Convenience._
- `npx prettier --list-different` — Lists files that would be changed by Prettier | _Auditing._
- `npx prettier-eslint` — Runs Prettier then ESLint --fix | _When using both tools together._

---

## Section 3: Architecture & Component Relationships

Prettier works by converting code into an Abstract Syntax Tree (AST) and then re-printing it according to a set of rules.

```text
Source Code
     ↓
[ Parser ] (Babel, Flow, TypeScript, etc.)
     ↓
Abstract Syntax Tree (AST)
     ↓
[ Printer ] (Applies options like semi, tabWidth)
     ↓
Formatted Code
```

---

## Section 4: Documentation Links

- [Official Documentation](https://prettier.io/docs/en/index.html) — _Main landing page._
- [Configuration Options](https://prettier.io/docs/en/options.html) — _Full list of formatting rules._
- [Prettier vs. Linters](https://prettier.io/docs/en/comparison.html) — _Understanding the difference._
- [Integrating with Linters](https://prettier.io/docs/en/integrating-with-linters.html) — _Setup guides for ESLint/Stylelint._
- [Browser Playground](https://prettier.io/playground/) — _Test formatting in your browser._
