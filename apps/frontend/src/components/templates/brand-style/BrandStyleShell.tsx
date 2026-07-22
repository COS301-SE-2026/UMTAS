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
import { MotionSection } from "@/components/organisms/brand-style/MotionTokenSection";
import { AccessibilitySection } from "@/components/organisms/brand-style/AccessibilitySection";
import { IconsSection } from "@/components/organisms/brand-style/IconsSection";
import { BreakpointSection } from "@/components/organisms/brand-style/BreakpointsSection";
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

  //how animations are handled (uses same api as observing which section is being viewed)
  useEffect(() => {
    const animationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("opacity-0", "translate-y-6");
            entry.target.classList.add("opacity-100", "translate-y-0");
            animationObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 },
    );

    const sections = document.querySelectorAll("section");
    sections.forEach((section) => {
      section.classList.add(
        "opacity-0",
        "translate-y-6",
        "transition-all",
        "duration-[600ms]",
        "ease-[cubic-bezier(0.4,0,0.2,1)]",
      );
      animationObserver.observe(section);
    });

    return () => animationObserver.disconnect();
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
          <section id="identity" className="brand-card">
            <BrandIdentity />
          </section>
          <section
            id="colour"
            className="w-full mb-8 border border-[var(--border)] rounded-2xl px-8"
          >
            <ColourSystem />
          </section>
          <section id="typography" className="brand-card">
            <TypographySection />
          </section>
          <section
            id="border"
            className="w-full  mb-8 border border-[var(--border)] rounded-2xl px-8"
          >
            <RadiusSection />
          </section>
          <section id="spacing" className="brand-card">
            <SpacingSection />
          </section>
          <section
            id="shadows"
            className="w-full  mb-8 border border-[var(--border)] rounded-2xl px-8"
          >
            <ShadowSection />
          </section>
          <section id="motion" className="brand-card">
            <MotionSection />
          </section>
          <section
            id="icons"
            className="w-full  mb-8 border border-[var(--border)] rounded-2xl px-8"
          >
            <IconsSection />
          </section>
          <section id="components" className="brand-card">
            <ComponentSection />
          </section>
          <section
            id="accessibility"
            className="w-full  mb-8 border border-[var(--border)] rounded-2xl px-8"
          >
            <AccessibilitySection />
          </section>
          <section id="breakpoints" className="brand-card">
            <BreakpointSection />
          </section>
        </div>
      </div>
    </div>
  );
}
