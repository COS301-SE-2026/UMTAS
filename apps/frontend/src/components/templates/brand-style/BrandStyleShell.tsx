"use client";

import { BrandIdentity } from "@/components/organisms/brand-style/BrandIdentity";
import { ColourSystem } from "@/components/organisms/brand-style/ColourSystem";
import { ComponentSection } from "@/components/molecules/brand-style/ComponentsSection";
import { TypographySection } from "@/components/organisms/brand-style/TypographySection";
import { SpacingSection } from "@/components/organisms/brand-style/SpacingSection";
import {
  Sparkle,
  Aperture,
  Type as TypeIcon,
  Ruler,
  CornerDownRight,
  Layers,
  Zap,
  Component,
  Box,
  Moon,
  Eye,
  Globe,
} from "lucide-react";

export default function BrandStyleShell() {
  return (
    <div className="mx-auto w-full px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
        <div className="md:col-span-1 md:border-r border-border pr-10">
          <div className="flex flex-col items-end sticky top-31">
            <div className="flex flex-col gap-2 items-start text-[var(--text-secondary)]">
              <a className="brand-nav-link" href="#identity">
                <Sparkle size={14} />
                <span>Brand Identity</span>
              </a>

              <a className="brand-nav-link" href="#colour">
                <Aperture size={14} />
                <span>Colour System</span>
              </a>

              <a className="brand-nav-link" href="#typography">
                <TypeIcon size={14} />
                <span>Typography</span>
              </a>

              <a className="brand-nav-link" href="#border">
                <CornerDownRight size={14} />
                <span>Border Radius</span>
              </a>

              <a className="brand-nav-link" href="#spacing">
                <Ruler size={14} />
                <span>Spacing & Density</span>
              </a>

              <a className="brand-nav-link" href="#shadows">
                <Layers size={14} />
                <span>Shadow & Elevation</span>
              </a>

              <a className="brand-nav-link" href="#motion">
                <Zap size={14} />
                <span>Motion Tokens</span>
              </a>

              <a className="brand-nav-link" href="#icons">
                <Component size={14} />
                <span>Icons</span>
              </a>

              <a className="brand-nav-link" href="#components">
                <Box size={14} />
                <span>Components</span>
              </a>

              <a className="brand-nav-link" href="#mode">
                <Moon size={14} />
                <span>Mode switching</span>
              </a>

              <a className="brand-nav-link" href="#accessibility">
                <Eye size={14} />
                <span>Accessibility</span>
              </a>

              <a className="brand-nav-link" href="#breakpoints">
                <Globe size={14} />
                <span>Responsiveness</span>
              </a>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <section id="identity" className="max-w-6xl">
            <BrandIdentity />
          </section>
          <section id="colour">
            <ColourSystem />
          </section>
          <section id="typography">
            <TypographySection />
          </section>
          <section id="border">
            <h1>Border Radius</h1>
          </section>
          <section id="spacing">
            <SpacingSection />
          </section>
          <section id="shadows">
            <h1>Shadow & Elevation</h1>
          </section>
          <section id="motion">
            <h1>Motion Tokens</h1>
            <h2>Duration Tokens</h2>
            <h2>Easing</h2>
            <h2>Motion Rules</h2>
          </section>
          <section id="icons">
            <h1>Icons</h1>
          </section>
          <section id="components">
            <ComponentSection />
          </section>
          <section id="mode">
            <h1>Mode Switching</h1>
          </section>
          <section id="accessibility">
            <h1>Accessibility</h1>
            <h2>Colour Contrast</h2>
            <h2>Keyboard Navigation</h2>
            <h2>Semantics</h2>
            <h2>Motion</h2>
          </section>
          <section id="breakpoints">
            <h1>Responsive Breakpoints</h1>
          </section>
        </div>
      </div>
    </div>
  );
}
