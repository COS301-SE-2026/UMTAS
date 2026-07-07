"use client";

import { BrandIdentity } from "@/components/organisms/brand-style/BrandIdentity";

export default function BrandStyleShell() {
  return (
    <div className="mx-auto w-full px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
        <div className="md:col-span-1 md:border-r border-border pr-6 flex flex-col gap-2 items-start text-[var(--text-secondary)]">
          <a className="brand-nav-link">Brand Identity</a>
          <a className="brand-nav-link">Colour System</a>
          <a className="brand-nav-link">Typography</a>
          <a className="brand-nav-link">Border Radius</a>
          <a className="brand-nav-link">Spacing & Density</a>
          <a className="brand-nav-link">Shadow & Elevation</a>
          <a className="brand-nav-link">Motion Tokens</a>
          <a className="brand-nav-link">Icons</a>
          <a className="brand-nav-link">Components</a>
          <a className="brand-nav-link">Mode switching</a>
          <a className="brand-nav-link">Accessibility</a>
          <a className="brand-nav-link">Responsiveness</a>
        </div>

        <div className="md:col-span-3">
          <section className="max-w-6xl">
            <BrandIdentity />
          </section>
          <section>
            <h1>Colour System</h1>
            <h2>Dark Mode Palette</h2>
            <h2>Light Mode Palette</h2>
            <h2>Status Colours</h2>
            <h2>Colour Rules</h2>
          </section>
          <section>
            <h1>Typography</h1>
            <h2>Type Scale</h2>
            <h2>Typography Rules</h2>
          </section>
          <section>
            <h1>Border Radius</h1>
          </section>
          <h1>Spacing & Density</h1>
          <section>
            <h1>Shadow & Elevation</h1>
          </section>
          <section>
            <h1>Motion Tokens</h1>
            <h2>Duration Tokens</h2>
            <h2>Easing</h2>
            <h2>Motion Rules</h2>
          </section>
          <section>
            <h1>Icons</h1>
          </section>
          <section>
            <h1>Component Standards</h1>
          </section>
          <section>
            <h1>Mode Switching</h1>
          </section>
          <section>
            <h1>Accessibility</h1>
            <h2>Colour Contrast</h2>
            <h2>Keyboard Navigation</h2>
            <h2>Semantics</h2>
            <h2>Motion</h2>
          </section>
          <section>
            <h1>Responsive Breakpoints</h1>
          </section>
        </div>
      </div>
    </div>
  );
}
