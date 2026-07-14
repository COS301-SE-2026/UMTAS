"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/types/BrandStyle";
import { BrandIdentity } from "@/components/organisms/brand-style/BrandIdentity";
import { ColourSystem } from "@/components/organisms/brand-style/ColourSystem";
import { ComponentSection } from "@/components/molecules/brand-style/ComponentsSection";
import { TypographySection } from "@/components/organisms/brand-style/TypographySection";
import { SpacingSection } from "@/components/organisms/brand-style/SpacingSection";
import { RadiusSection } from "@/components/organisms/brand-style/RadiusSection";
import { ShadowSection } from "@/components/organisms/brand-style/ShadowSection";
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

const Links: Link[] = [
  { id: "identity", label: "Brand Identity", Icon: Sparkle },
  { id: "colour", label: "Colour System", Icon: Aperture },
  { id: "typography", label: "Typography", Icon: TypeIcon },
  { id: "border", label: "Border Radius", Icon: CornerDownRight },
  { id: "spacing", label: "Spacing & Density", Icon: Ruler },
  { id: "shadows", label: "Shadow & Elevation", Icon: Layers },
  { id: "motion", label: "Motion Tokens", Icon: Zap },
  { id: "icons", label: "Icons", Icon: Component },
  { id: "components", label: "Components", Icon: Box },
  { id: "mode", label: "Mode switching", Icon: Moon },
  { id: "accessibility", label: "Accessibility", Icon: Eye },
  { id: "breakpoints", label: "Responsiveness", Icon: Globe },
];

export default function BrandStyleShell() {
  const [selectedNav, setSelectedNav] = useState("identity");

  //I use the way the old brand style did "section viewing"

  //store the observer
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    //here we disconnect old observers to prevent issues with dupes
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    //here is where new observers are made and are set to the "observed" sections
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            //this handles the actual styling that happens when you are in that section
            setSelectedNav(entry.target.id);
          }
        }
      },
      //this is more or less mapped to the top-middle of the screen
      // where users usually read (just to make it feel more natural)
      { rootMargin: "-30% 0px -65% 0px" },
    );

    //this loop checks "is this link section currently being observed"
    for (const link of Links) {
      const linkElementA = document.getElementById(link.id);
      if (linkElementA && observerRef.current) {
        observerRef.current.observe(linkElementA);
      }
    }

    //disconnects observers once they are "finished" (moved past that section or clicked on another link)
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="mx-auto w-full px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
        <div className="md:col-span-1 md:border-r border-border pr-10">
          <div className="flex flex-col items-end sticky top-31">
            <div className="flex flex-col gap-2 items-start text-[var(--text-secondary)]">
              <p>NAVIGATION</p>
              {Links.map((link) => {
                const isActive = selectedNav === link.id;
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={() => setSelectedNav(link.id)}
                    className={`rounded-md flex flex-row flex-nowrap items-center justify-start gap-3 whitespace-nowrap w-full px-3 py-2 transition-all 
                      duration-[var(--duration-fast)] cursor-pointer text-sm
                      ${
                        isActive
                          ? "font-bold text-[var(--text-primary)] bg-[var(--bg-surface)] border-l-[3px] border-[var(--text-primary)]"
                          : "font-normal text-[var(--text-secondary)] border-l-[3px] border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50"
                      }`}
                  >
                    <link.Icon size={14} className="shrink-0" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
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
            <RadiusSection />
          </section>
          <section id="spacing">
            <SpacingSection />
          </section>
          <section id="shadows">
            <ShadowSection />
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
