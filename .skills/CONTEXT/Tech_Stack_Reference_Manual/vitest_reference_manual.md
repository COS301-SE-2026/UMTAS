# Vitest Reference Manual (v4.1)

## Section 0: Quick Start

Add Vitest to your Vite project and run tests:

```bash
npm install -D vitest @vitest/browser
npx vitest
```

Expected: Vitest UI opens or terminal shows `PASS` for `./src/App.test.ts`.

## Section 1: Key Language Terms/Features

- **Browser Mode** — Runs tests in real browsers (Chrome/Safari) | `test: { browser: { enabled: true } }` | ⚠️ Use for component testing to ensure CSS/Event fidelity.
- **In-source Testing** — Write tests directly inside implementation files | `if (import.meta.vitest) { it(...) }` | ⚠️ Perfect for small utilities; requires `define` in config.
- **Mocking (vi)** — Comprehensive utility for spies, stubs, and timers | `vi.mock('./module')` | ⚠️ Always use `vi.restoreAllMocks()` in `afterEach` to stay clean.
- **Snapshot Testing** — Tracks UI/data changes over time | `expect(ui).toMatchSnapshot()` | ⚠️ Use `toMatchInlineSnapshot()` for smaller, more readable comparisons.
- **Agent Reporter** — Optimized output for AI agents and LLMs | `reporter: 'agent'` | ⚠️ Reduces token usage by stripping ANSI and redundant stack traces.
- **Visual Regression** — Pixel-perfect screenshot comparisons | `await expect(page).toMatchScreenshot()` | ⚠️ Only available in Browser Mode.
- **Concurrent Tests** — Runs multiple tests in parallel for speed | `it.concurrent(...)` | ⚠️ Ensure tests don't share state or modify global variables.
- **Type-Inference Fixtures** — Dependency injection for test contexts | `test.extend({ myFixture: ... })` | ⚠️ Provides full IDE autocomplete for complex setup data.

## Section 2: Key Commands & Workflows

- `vitest` — Starts watcher mode | _Standard TDD loop during feature development_
- `vitest run` — One-time execution | _CI/CD pipelines and pre-commit hooks_
- `vitest --ui` — Opens interactive graphical dashboard | _Debugging complex test suites and viewing traces_
- `vitest related ./src/User.ts` — Tests only files importing the target | _Fast verification of specific changes_
- `vitest bench` — Measures performance and execution time | _Optimizing hot paths and algorithms_
- `vitest coverage` — Generates report via v8 or istanbul | _Identifying untested code paths_

## Section 3: Architecture & Component Relationships

```
[Vite Config] ← [Vitest Config]
       ↓
[Source Files] → [Vitest Runner] → [Worker Threads]
                        ↓
             [Node.js] OR [Real Browsers]
                        ↓
            [Traces / Snapshots / Reports]
```

Vitest shares Vite's transformation pipeline, ensuring tests see the same code (TS, CSS, Assets) as the browser. It scales from Node-based unit tests to real-browser component tests.

## Section 4: Documentation Links

- [Vitest Docs](https://vitest.dev) — _Official guides and configuration_
- [Browser Mode Guide](https://vitest.dev/guide/browser) — _Setting up real-browser testing_
- [Mocking API](https://vitest.dev/api/vi) — _Deep dive into the `vi` utility_
- [GitHub Repository](https://github.com/vitest-dev/vitest) — _Issue tracker and roadmap_
