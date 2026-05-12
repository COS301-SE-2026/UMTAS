# Playwright Reference Manual (v1.59)

## Section 0: Quick Start

Install Playwright and run the example tests:

```bash
npm init playwright@latest
npx playwright test
```

Expected: Browsers download, then `6 passed` in terminal. View results with `npx playwright show-report`.

## Section 1: Key Language Terms/Features

- **Locators** — Resilient way to find elements | `page.getByRole('button')` | ⚠️ Prefer `getByRole` and `getByLabel` over CSS selectors for accessibility.
- **Auto-waiting** — Automatically waits for elements to be ready | `await page.click('#submit')` | ⚠️ Eliminates the need for manual `sleep` or `waitFor`.
- **Fixtures** — Encapsulated test state and setup | `test('name', ({ page, auth }) => ...)` | ⚠️ Keeps tests DRY by sharing setup logic (like login).
- **AI Self-Healing** — Automatically suggests selector fixes on failure | `planner: 'ai'` in config | ⚠️ Requires traces to be enabled to analyze context.
- **Trace Viewer** — Post-mortem debugger with video and snapshots | `npx playwright show-trace` | ⚠️ Use `--trace on` to capture full execution details.
- **Projects** — Configuration for multiple environments/browsers | `projects: [{ name: 'chromium' }]` | ⚠️ Allows running same tests across mobile and desktop.
- **Assertions (Expect)** — Web-first, async assertions | `await expect(page).toHaveTitle('...')` | ⚠️ These automatically retry until the condition is met.
- **Browser Contexts** — Isolated, incognito-like environments | `browser.newContext()` | ⚠️ Fast to create; allows parallel tests in a single browser instance.

## Section 2: Key Commands & Workflows

- `npx playwright test` — Runs all tests | _Full suite validation_
- `npx playwright test --ui` — Interactive UI mode | _Live debugging and time-traveling through actions_
- `npx playwright codegen` — Records user actions to generate code | _Fast-tracking test creation_
- `npx playwright test --debug` — Opens inspector | _Stepping through tests line-by-line_
- `npx playwright show-report` — Opens HTML results | _Reviewing failures and performance metrics_
- `npx playwright test --project=mobile` — Runs specific project | _Targeted platform testing_

## Section 3: Architecture & Component Relationships

```
[Test Script] → [Playwright Runner] → [Playwright Library]
                                            ↓ (WebSocket)
[AI Agents] ← [Trace Files] ← [Browser Server (CDP/WebDriver)]
                                            ↓
                               [Chromium / WebKit / Firefox]
```

Playwright controls browsers via specialized protocols (CDP for Chromium). It provides deep isolation via **Contexts**, allowing many tests to run in parallel without interfering with each other.

## Section 4: Documentation Links

- [Playwright Docs](https://playwright.dev) — _Comprehensive guides and API_
- [Locators Guide](https://playwright.dev/docs/locators) — _Best practices for finding elements_
- [AI Capabilities](https://playwright.dev/docs/ai-testing) — _Using the Planner and Healer agents_
- [CI/CD Integration](https://playwright.dev/docs/ci) — _Setting up GitHub Actions/Lab_
