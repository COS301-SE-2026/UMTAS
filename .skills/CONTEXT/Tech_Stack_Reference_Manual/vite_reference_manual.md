# Vite Reference Manual (v8.0)

## Section 0: Quick Start

Immediate setup for a modern Vite 8 project:

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app && npm install
npm run dev
```

Visit `http://localhost:5173` → See the Vite + React splash page with HMR active.

## Section 1: Key Language Terms/Features

- **Rolldown Engine** — Unified Rust-based bundler for both dev and production | `build: { rollupOptions: { ... } }` | ⚠️ Replaces Rollup/esbuild duo for 10x speed.
- **Hot Module Replacement (HMR)** — Updates code in browser without full reload | `if (import.meta.hot) { ... }` | ⚠️ State is preserved during updates.
- **Oxc Integration** — Ultra-fast parser and minifier used for AST transformations | (Automatic) | ⚠️ Dramatically reduces "cold start" and build times.
- **Dependency Pre-bundling** — Converts CommonJS/UMD to ESM using Rolldown | (Automatic) | ⚠️ Fixes waterfall requests for large node_modules.
- **Environment Variables** — Built-in support for `.env` files with validation | `import.meta.env.VITE_API_URL` | ⚠️ Only variables prefixed with `VITE_` are exposed.
- **CSS Modules** — Scoped CSS using `.module.css` extension | `import styles from './App.module.css'` | ⚠️ Generates unique class names to prevent collisions.
- **Vite Devtools** — Integrated UI for module graph and plugin performance | `devtools: true` in config | ⚠️ Useful for debugging slow transformations.
- **Assets Handling** — Importing static assets returns their resolved URL | `import img from './logo.svg'` | ⚠️ Large assets are automatically hashed for caching.

## Section 2: Key Commands & Workflows

- `vite` — Starts the development server | _Daily development and HMR testing_
- `vite build` — Bundles for production using Rolldown | _Preparing for deployment_
- `vite preview` — Locally boots the production build | _Final QA before shipping_
- `vite optimize` — Manually triggers dependency pre-bundling | _Resolving cache-related module issues_
- `npm run dev -- --host` — Exposes server to local network | _Testing on mobile devices_
- `vite --debug` — Runs with verbose logging | _Troubleshooting plugin or config errors_

## Section 3: Architecture & Component Relationships

```
[Source Code] + [node_modules]
       ↓
[Oxc Parser] → [Vite Dev Server] → [Browser (ESM + HMR)]
       ↓             ↑
[Rolldown Bundler] ← [Plugins API]
       ↓
[dist/ (Optimized Assets)]
```

Vite 8 uses a unified **Rolldown** core. Dev mode serves files as ESM for speed, while production builds use the same engine for consistent output.

## Section 4: Documentation Links

- [Official Documentation](https://vite.dev) — _Core guides and API reference_
- [Plugin API Reference](https://vite.dev/guide/api-plugin.html) — _Building custom extensions_
- [Rolldown Home](https://rolldown.rs) — _Details on the underlying Rust engine_
- [Awesome Vite](https://github.com/vitejs/awesome-vite) — _Community plugins and templates_
