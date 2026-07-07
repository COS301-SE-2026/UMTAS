"use client";

import { BrandIdentity } from "@/components/organisms/brand-style/BrandIdentity";

export default function BrandStyleShell() {
  return (
    <>
      <section className="max-w-4xl">
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
    </>
  );
}
