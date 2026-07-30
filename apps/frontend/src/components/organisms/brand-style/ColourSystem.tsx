"use client";

import ColourPalette from "@/components/molecules/brand-style/ColourPalette";
import { StatusColoursList } from "@/types/BrandStyleData";

export function ColourSystem() {
  //these were hard coded so that it does not mess up the colours in dark mode
  const getLightText = (prefix: string) => {
    if (prefix === "error") return "#991b1b";
    if (prefix === "success") return "#15803d";
    return "#b45309";
  };

  const getDarkText = (prefix: string) => {
    if (prefix === "error") return "#fca5a5";
    if (prefix === "success") return "#86efac";
    return "#fcd34d";
  };

  return (
    <div className="w-full mx-auto py-8 text-[var(--text-secondary)]">
      <section className="space-y-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
            Colour System
          </h1>
          <p className="leading-relaxed text-base max-w-2xl">
            UMTAS supports both{" "}
            <strong className="text-[var(--text-primary)] font-semibold">
              Light Mode
            </strong>{" "}
            and{" "}
            <strong className="text-[var(--text-primary)] font-semibold">
              Dark Mode
            </strong>
            . The palette is monochrome.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 pb-1 border-b border-[var(--border)]">
            Colour Palette
          </h2>
          <ColourPalette />
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 pb-1 border-b border-[var(--border)]">
            Status Colours
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Status colours must be muted.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {StatusColoursList.map((status) => (
              <div
                key={status.label}
                className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-surface)]"
              >
                <div className="grid grid-cols-2 h-16 text-center text-[10px] tracking-wider uppercase font-semibold">
                  <div
                    className="flex items-center justify-center border-r border-[var(--border)]"
                    style={{
                      backgroundColor: status.lightHex,
                      color: getLightText(status.prefix),
                    }}
                  >
                    {status.label} (Light)
                  </div>
                  <div
                    className="flex items-center justify-center"
                    style={{
                      backgroundColor: status.darkHex,
                      color: getDarkText(status.prefix),
                    }}
                  >
                    {status.label} (Dark)
                  </div>
                </div>
                <div className="p-3 bg-[var(--bg-base)] text-[11px] font-mono text-[var(--text-secondary)] border-t border-[var(--border)] flex justify-between">
                  <span>
                    L: {status.lightHex} | {status.lightHsl} | {status.lightRgb}
                  </span>
                  <span>
                    D: {status.darkHex} | {status.darkHsl} | {status.darkRgb}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 pb-1 border-b border-[var(--border)]">
            Colour Rules
          </h2>
          <div className="p-5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
            <ul className="list-disc list-outside pl-5 space-y-2 text-sm text-[var(--text-secondary)]">
              <li>
                Limited hue-based colours. The only exception being the
                timetable event blocks.
              </li>
              <li>
                All interactive feedback (hover, focus, active) uses tonal
                shifts within the charcoal scale only.
              </li>
              <li>
                Never use colour as the sole indicator of state - always pair
                with text or iconography (WCAG requirement).
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
