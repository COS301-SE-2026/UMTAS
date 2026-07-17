"use client";

import { useState } from "react";
import { TypeScale } from "@/types/Typography";
import { Slider } from "@/components/atoms/baseShadcn/slider";

export function TypographySection() {
  const [scaleByNumber, setScaleByNumber] = useState(1);

  return (
    <div className="w-full text-left space-y-8 py-8 text-[var(--text-secondary)]">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          Typography
        </h1>
        <p className="leading-relaxed max-w-2xl">
          DM Sans, three weights, seven sizes. A single typeface across the
          entire system. Hierarchy through weight and size - never through
          colour or decoration. Drag the slider to see the scale at different
          base sizes.
        </p>
      </div>

      <div className="flex items-center gap-4 p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg max-w-md">
        <span className="text-[11px] font-medium tracking-[0.04em] text-[var(--text-secondary)] shrink-0">
          SCALE
        </span>

        <Slider
          min={0.75}
          max={1.5}
          step={0.05}
          value={[scaleByNumber]}
          onValueChange={(val) => setScaleByNumber(val[0])}
          className="flex-1"
        />

        <span className="text-[14px] font-medium text-[var(--text-primary)] min-w-[48px] text-right font-mono">
          {scaleByNumber.toFixed(2)}
        </span>
      </div>

      <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-surface)] w-full">
        {TypeScale.map((typographyItem) => (
          <div
            key={typographyItem.role}
            className="grid grid-cols-[1fr_175px] items-baseline gap-6 p-7 border-b border-[var(--border)] last:border-0 transition-colors 
            odd:bg-[var(--bg-surface)] even:bg-[var(--bg-base)]"
          >
            <p
              className="text-[var(--text-primary)] min-w-0 m-0"
              //this comes from the typography type
              style={{
                fontSize: typographyItem.size * scaleByNumber,
                fontWeight: typographyItem.weight,
                lineHeight: typographyItem.lh,
                letterSpacing: typographyItem.ls,
                textTransform: typographyItem.micro ? "uppercase" : "none",
              }}
            >
              {typographyItem.sample}
            </p>
            <div className="shrink-0 text-right">
              <p className="text-[14px] font-medium text-[var(--text-primary)] leading-[1.5] m-0">
                {typographyItem.role}
              </p>
              <p className="text-[11px] font-medium text-[var(--text-disabled)] tracking-[0.04em] uppercase mt-1 font-mono">
                {typographyItem.size}px - {typographyItem.weight} -{" "}
                {typographyItem.lh}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
