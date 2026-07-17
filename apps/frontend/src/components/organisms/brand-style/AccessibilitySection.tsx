"use client";

import { AccessibilityRule } from "@/types/BrandStyle";
import { Card } from "@/components/atoms/baseShadcn/card";
import { Eye, Keyboard, SquareCode, Zap } from "lucide-react";

const accessibilityDataRules: AccessibilityRule[] = [
  {
    Icon: Eye,
    label: "Colour Contrast",
    sub: "WCAG 2.2 AA",
    body: "Body text: 4.5:1 minimum. Large text (Display, H1, H2): 3:1 minimum. Never use --text-secondary for body copy.",
  },
  {
    Icon: Keyboard,
    label: "Keyboard Nav",
    sub: "Tab-reachable",
    body: "Every interactive element reachable by Tab. Focus ring always visible. No keyboard traps anywhere.",
  },
  {
    Icon: SquareCode,
    label: "Semantics",
    sub: "Meaningful markup",
    body: "Use <nav>, <main>, <section>, <button>. Icon-only buttons need aria-label. Inputs need <label>. Placeholder is not equal to label.",
  },
  {
    Icon: Zap,
    label: "Motion",
    sub: "prefers-reduced-motion",
    body: "All CSS transitions suppressed at 0.01ms under reduced-motion. Only opacity and transform are ever animated.",
  },
];

export function AccessibilitySection() {
  return (
    <div className="w-full text-left space-y-8 py-8 text-[var(--text-secondary)]">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          Accessibility
        </h1>
        <p className="leading-relaxed max-w-2xl">
          WCAG 2.2 AA. Baked in, not bolted on. Accessibility is a system
          property. Every token, every component, every pattern is designed to
          meet AA by default.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 mb-12">
        {accessibilityDataRules.map(({ Icon: RuleIcon, label, sub, body }) => (
          <Card
            key={label}
            className="bg-[var(--bg-surface)] border-[var(--border)] rounded-[10px] p-[20px_20px_22px] shadow-none"
          >
            <div className="flex items-center gap-[10px] mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                <RuleIcon size={15} className="text-[var(--text-primary)]" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-[var(--text-primary)] m-0 leading-[1.3]">
                  {label}
                </p>
                <p className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] m-[2px_0_0]">
                  {sub}
                </p>
              </div>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] m-0 leading-[1.6]">
              {body}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
