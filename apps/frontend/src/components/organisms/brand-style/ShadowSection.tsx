"use client";

import { ShadowItem } from "@/types/BrandStyle";
import { Card } from "@/components/atoms/baseShadcn/card";

const shadowsTokens: ShadowItem[] = [
  {
    level: "None",
    shadow: "none",
    usage: "Flat surfaces, dividers",
  },
  {
    level: "Low",
    shadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
    usage: "Default cards",
  },
  {
    level: "Medium",
    shadow: "0 4px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.10)",
    usage: "Modals, dropdowns",
  },
  {
    level: "High",
    shadow: "0 10px 15px rgba(0,0,0,0.20), 0 4px 6px rgba(0,0,0,0.12)",
    usage: "Floating overlays",
  },
];

export function ShadowSection() {
  return (
    <div className="w-full text-left space-y-8 py-8 text-[var(--text-secondary)]">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          Shadow and Elevation
        </h1>
        <p className="leading-relaxed max-w-4xl">
          Subtle elevation strategy. Cards feel slightly lifted off the surface,
          but shadows never overpower. In dark mode, multiply shadow alpha
          values by 2x for visibility.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {shadowsTokens.map((shadowToken) => (
          <div key={shadowToken.level} className="flex flex-col gap-4">
            <Card
              className="h-32 bg-[var(--bg-surface)] border-[var(--border)] p-6"
              style={{ boxShadow: shadowToken.shadow }}
            >
              {" "}
              <div>
                <p className="text-[14px] font-medium text-[var(--text-primary)] leading-[1.3] m-0">
                  {shadowToken.level}
                </p>
                <p className="text-[12px] text-[var(--text-secondary)] mt-1 mb-3">
                  {shadowToken.usage}
                </p>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
