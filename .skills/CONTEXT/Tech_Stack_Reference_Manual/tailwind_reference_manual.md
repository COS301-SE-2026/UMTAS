# Tailwind CSS Reference Manual (v4.0.0)

## Section 0: Quick Start

Rapid setup using the v4 Oxide engine with CSS-native configuration.

```bash
# Install Tailwind CSS v4 and the Vite plugin
pnpm add -D tailwindcss @tailwindcss/vite

# In your main CSS file (app.css), import Tailwind
@import "tailwindcss";

# Use utility classes in HTML/React
<h1 class="text-3xl font-bold underline text-blue-600">
  Hello Tailwind v4!
</h1>
```

Expected output: Styled text with 30px size, bold weight, and blue color.

## Section 1: Key Language Terms & Features

- **Oxide Engine** — The high-performance Rust-based engine that powers Tailwind v4's lightning-fast builds. | `tailwindcss build` | ⚠️ No longer requires a `tailwind.config.js` for most projects.
- **CSS-First Config** — Configuring themes and plugins directly in CSS using variables. | `@theme { --color-brand: #3b82f6; }` | ⚠️ Ensure variable names follow the `--spacing-` or `--color-` prefixes.
- **JIT (Just-In-Time)** — The engine only generates CSS for the classes you actually use in your markup. | `bg-[#123456]` | ⚠️ JIT is now the only mode; no more purging configuration.
- **Utility-First** — Building complex designs by composing low-level utility classes instead of writing custom CSS. | `flex items-center p-4` | ⚠️ Avoid "class soup" by extracting repeated patterns into components.
- **Modifiers** — Conditional prefixes that apply styles on hover, focus, or different breakpoints. | `hover:bg-red-500 lg:p-8` | ⚠️ Ordering matters: `hover:lg:bg-blue` is invalid, use `lg:hover:bg-blue`.
- **Arbitrary Values** — Syntax for using exact values not defined in your theme. | `top-[117px] grid-cols-[1fr_500px_1fr]` | ⚠️ Overuse makes the codebase harder to maintain and less consistent.
- **Container Queries** — Styling elements based on the size of their parent container rather than the viewport. | `@container (min-width: 400px):flex-row` | ⚠️ Requires the parent to be marked with `@container`.
- **Automatic Content Detection** — Tailwind automatically scans all files in your project for classes. | `content: ["./src/**/*.{js,ts,jsx,tsx}"]` | ⚠️ Now largely handled by the build tool plugin (Vite/Next.js) automatically.
- **Modern Color Spaces** — Native support for high-gamut colors like P3 and OKLCH. | `bg-oklch(70% 0.2 150)` | ⚠️ Some older browsers still lack full OKLCH support.
- **Directives** — Custom CSS rules that instruct Tailwind how to process styles. | `@apply font-bold underline;` | ⚠️ Use `@apply` sparingly; it can lead to bloated CSS files if overused.

## Section 2: Key Commands & Workflows

- `npx tailwindcss -i ./src/input.css -o ./dist/output.css` — Compiles CSS using the CLI. | _Manual build process._
- `npx tailwindcss -w` — Starts the CLI in watch mode for automatic recompilation. | _Local development without a framework._
- `pnpm add -D @tailwindcss/vite` — Adds the official Vite plugin for seamless integration. | _Setting up Vite-based projects._
- `@theme { ... }` — Defines custom colors, spacing, and fonts directly in CSS. | _Theming and brand customization._
- `@plugin "..."` — Imports Tailwind plugins directly within the CSS file. | _Extending functionality like forms or typography._
- `@apply` — Inlines utility classes into custom CSS rules. | _Extracting complex component styles._
- `theme('colors.blue.500')` — Retrieves theme values for use in custom CSS. | _Mixing Tailwind values with raw CSS._

## Section 3: Architecture & Component Relationships

```
Source Files (.html, .tsx, .vue)
       ↓
[Oxide Engine (Rust)] ← CSS Input (@import "tailwindcss")
       ↓
Dependency Graph Analysis (Automatic)
       ↓
Optimized CSS Output (Minified & Purged)
       ↓
Browser Rendering
```

**Key Flow:** The **Oxide Engine** watches your source files, extracts used utility classes, merges them with your **@theme** definitions, and generates a minimal, high-performance CSS bundle.

## Section 4: Documentation Links

- [Official Documentation](https://tailwindcss.com/docs) — _Core guides and class reference._
- [Tailwind v4 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4-alpha) — _Deep dive into the Oxide engine changes._
- [Tailwind UI](https://tailwindui.com/) — _Professional component library (Paid)._
- [Headless UI](https://headlessui.com/) — _Unstyled, accessible UI components._
- [Tailwind Play](https://play.tailwindcss.com/) — _Online playground for testing styles._
