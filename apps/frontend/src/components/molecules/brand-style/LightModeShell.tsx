"use client";

import { useState, CSSProperties } from "react";
import { Token } from "@/types/BrandStyle";
import { LightPalette } from "@/types/BrandStyleData";
import { Inspector } from "@/components/molecules/brand-style/InspectorGadget";

export function LightModeShell() {
  const [selectedToken, setSelectedToken] = useState<Token>(LightPalette[0]);

  //this is a bit unnecessary, but without it the light/dark mode
  //colours would change to the wrong colour based on the
  //current theme
  const localStoredColour = LightPalette.reduce(
    (colourName, token) => {
      colourName[token.token] = token.hex;
      return colourName;
    },
    //I am basically matching the colourName with its corresponding token
    {} as Record<string, string>,
  );

  return (
    <div
      data-theme="light"
      style={localStoredColour}
      className="grid grid-cols-1 md:grid-cols gap-6 w-full text-left"
    >
      <div className="p-4 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl space-y-1 h-fit">
        {LightPalette.map((token) => (
          <div
            key={token.token}
            onClick={() => setSelectedToken(token)}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              selectedToken.token === token.token
                ? "bg-[var(--bg-elevated)]"
                : "hover:bg-[var(--bg-surface)]"
            }`}
          >
            <div
              className="w-6 h-6 rounded-md border border-[var(--border)] flex-shrink-0"
              style={{ backgroundColor: `var(${token.token})` }}
            />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] m-0">
                {token.label}
              </p>
              <p className="text-xs font-mono text-[var(--text-secondary)] m-0">
                {token.token}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Inspector token={selectedToken} />
    </div>
  );
}
