"use client";

import { useState } from "react";
import { SpacingToken } from "@/types/BrandStyle";

const brandSpacingTokensData: SpacingToken[] = [
  { token: "space-1", px: 4, usage: "Micro gaps, icon/label" },
  { token: "space-2", px: 8, usage: "Badge padding, small gaps" },
  { token: "space-3", px: 12, usage: "Input internal padding" },
  { token: "space-4", px: 16, usage: "Card padding, row heights" },
  { token: "space-6", px: 24, usage: "Gaps between cards" },
  { token: "space-8", px: 32, usage: "Section spacing" },
  { token: "space-12", px: 48, usage: "Major section dividers" },
];

export function SpacingSection() {
  const [selectedToken, setSelectedToken] = useState<string>("");

  const tokenToDisplay =
    brandSpacingTokensData.find((tokens) => tokens.token === selectedToken) ||
    //default one is px16
    brandSpacingTokensData[3];

  return (
    <div className="w-full text-left space-y-8 py-8 text-[var(--text-secondary)]">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          Spacing and Density
        </h1>
        <p className="leading-relaxed max-w-2xl">
          A 4px base unit. Every margin and padding in the system derives from
          this rhythm. Hover over the tokens below to see them applied to a live
          component preview.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
        <div className="flex flex-col gap-1.5">
          {brandSpacingTokensData.map((token) => {
            const isHovered = selectedToken === token.token;

            return (
              <div
                key={token.token}
                //set the selected token
                onMouseEnter={() => setSelectedToken(token.token)}
                onMouseLeave={() => setSelectedToken("")}
                className={`grid grid-cols-[100px_1fr_60px] items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                  isHovered ? "bg-[var(--bg-surface)]" : "bg-transparent"
                }`}
              >
                <span className="text-xs font-medium text-[var(--text-primary)] font-mono">
                  {token.token}
                </span>

                <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[var(--text-primary)] transition-all duration-300 ease-out"
                    //the "progress bar" showing the min/max from the og brand style guide
                    style={{ width: `${(token.px / 48) * 100}%` }}
                  />
                </div>

                <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] text-right">
                  {token.px}px
                </span>
              </div>
            );
          })}
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 sticky top-31">
          <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)] mb-1 block">
            Applied as Padding
          </span>
          <p className="text-[13px] text-[var(--text-primary)] font-mono mb-6">
            padding:{" "}
            <span className="text-[var(--text-secondary)]">
              {tokenToDisplay.px}px
            </span>
          </p>

          <div
            className="border border-dashed border-[var(--border)] rounded-lg bg-[var(--bg-base)] transition-[padding] duration-300 ease-out min-h-[140px]"
            //set the padding to the token to display
            style={{ padding: `${tokenToDisplay.px}px` }}
          >
            <div className="bg-[var(--bg-surface)] rounded-md p-4 border border-[var(--border)]">
              <p className="text-sm font-medium text-[var(--text-primary)] leading-tight mb-1">
                COS301 - My favourite lecture
              </p>
              <p className="text-xs text-[var(--text-secondary)] leading-snug">
                Software Engineering - 08:30-09:20
              </p>
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] mt-4 leading-relaxed">
            {tokenToDisplay.usage}
          </p>
        </div>
      </div>
    </div>
  );
}
