"use client";

import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { RadiusElement } from "@/types/BrandStyle";

const radiusElements: RadiusElement[] = [
  { name: "Cards", value: "0.5rem", px: "8px", radiusPx: 8 },
  { name: "Buttons", value: "0.5rem", px: "8px", radiusPx: 8 },
  { name: "Inputs", value: "0.5rem", px: "8px", radiusPx: 8 },
  { name: "Modals / Dialogs", value: "0.75rem", px: "12px", radiusPx: 12 },
  { name: "Badges / Tags", value: "9999px", px: "pill", radiusPx: 9999 },
  { name: "Tooltips", value: "0.375rem", px: "6px", radiusPx: 6 },
  { name: "Weekly grid cells", value: "0.25rem", px: "4px", radiusPx: 4 },
];

export function RadiusSection() {
  return (
    <div className="w-full text-left space-y-8 py-8 text-[var(--text-secondary)]">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          Border Radius
        </h1>
        <p className="leading-relaxed max-w-4xl">
          Default Shadcn radius used for borders. Every element shares this
          single radius value unless overridden.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {radiusElements.map((radiusElement) => (
          <Card
            key={radiusElement.name}
            className="bg-[var(--bg-surface)] border-[var(--border)] shadow-none rounded-xl"
          >
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div
                className="w-24 h-14 bg-[var(--bg-elevated)] border border-[var(--border)]"
                style={{
                  borderRadius:
                    radiusElement.radiusPx === 9999
                      ? "9999px"
                      : `${radiusElement.radiusPx}px`,
                }}
              />

              <div className="text-center">
                <p className="text-[13px] font-medium text-[var(--text-primary)] leading-[1.3] m-0">
                  {radiusElement.name}
                </p>
                <p className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mt-1 font-mono">
                  {radiusElement.px}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
