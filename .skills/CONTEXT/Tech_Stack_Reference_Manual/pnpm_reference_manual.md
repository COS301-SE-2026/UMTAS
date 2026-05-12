# pnpm Reference Manual (v10.33.0)

## Section 0: Quick Start

Immediate hands-on path for fast, disk-efficient package management.

```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Initialize and install dependencies
pnpm init
pnpm add next react react-dom
pnpm install
```

Verify `node_modules` contains a `.pnpm` directory (content-addressable store).

---

## Section 1: Key Language Terms & Features

- **Content-addressable Store** — Single global storage for all packages on a machine, preventing duplicate downloads | `~/.local/share/pnpm/store` | ⚠️ Do not manually modify the store; use `pnpm store` commands.
- **Symlinked node_modules** — Uses hard links and symlinks to create a nested structure that prevents illegal access to non-dependency packages | `node_modules/my-pkg -> .pnpm/...` | ⚠️ Prevents "phantom dependencies" that occur in npm/yarn.
- **Workspaces** — Native support for monorepos, allowing multiple packages to be managed in one repository | `pnpm-workspace.yaml` | ⚠️ Always define the `packages:` array in the workspace root.
- **Lockfile** — Deterministic `pnpm-lock.yaml` file ensuring consistent installs across environments | `pnpm-lock.yaml` | ⚠️ Never manually edit the lockfile; always regenerate via `pnpm install`.
- **Recursive Commands** — Ability to run commands across all packages in a workspace | `pnpm -r run build` | ⚠️ Use `--filter` to target specific packages and save time.
- **Strict Mode** — By default, pnpm only allows code to access dependencies explicitly listed in `package.json` | `shamefully-hoist=false` | ⚠️ Setting `shamefully-hoist=true` breaks strictness but helps with legacy projects.
- **Peer Dependency Resolution** — Unique way of handling peer dependencies by creating separate sets of dependencies for different peer versions | `auto-install-peers=true` | ⚠️ Enable `auto-install-peers` for a smoother experience with complex plugin ecosystems.
- **Catalogs** — Shared dependency version definitions for monorepos (pnpm v9.5+) | `catalog:default` | ⚠️ Use catalogs to keep versions synchronized across multiple workspace packages.

---

## Section 2: Key Commands & Workflows

- `pnpm add <pkg>` — Adds a dependency to the project and updates `package.json` | _When adding new libraries._
- `pnpm install` — Installs all dependencies based on `package.json` and the lockfile | _Initial setup or after cloning._
- `pnpm run <script>` — Executes a script defined in `package.json` | _Running dev, build, or test scripts._
- `pnpm -r <command>` — Runs a command recursively in every package of a workspace | _Monorepo management._
- `pnpm update` — Updates packages to their latest version based on semver | _Keeping dependencies current._
- `pnpm store prune` — Removes unreferenced packages from the global store | _Freeing up disk space._
- `pnpm dlx <pkg>` — Fetches a package and runs its default executable without installing it locally | _One-off commands like `create-next-app`._
- `pnpm setup` — Configures the pnpm environment and paths | _First-time setup on a new machine._

---

## Section 3: Architecture & Component Relationships

pnpm uses a content-addressable storage model to maximize speed and minimize disk usage.

```text
Global Store (Content-addressable)
       ↓ (Hard Link)
Project .pnpm directory (Flat structure)
       ↓ (Symlink)
Project node_modules (Strict, nested structure)
       ↓
Application Code
```

---

## Section 4: Documentation Links

- [Official Documentation](https://pnpm.io/motivation) — _Core concepts and installation._
- [Workspaces Guide](https://pnpm.io/workspaces) — _Managing monorepos._
- [CLI Reference](https://pnpm.io/cli/add) — _Full command list._
- [Comparison with npm/yarn](https://pnpm.io/pnpm-vs-npm) — _Technical benchmarks._
- [Troubleshooting](https://pnpm.io/faq) — _Common issues and solutions._
