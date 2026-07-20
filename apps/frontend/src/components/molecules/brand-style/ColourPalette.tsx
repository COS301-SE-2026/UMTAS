"use client";

import { useState } from "react";
import { LightModeShell } from "@/components/molecules/brand-style/LightModeShell";
import { DarkModeShell } from "@/components/molecules/brand-style/DarkModeShell";
import { ThemeMode } from "@/types/BrandStyle";

export default function ColourPalette() {
  const [viewMode, setViewMode] = useState<ThemeMode>("light");

  return (
    <div className="w-full space-y-4">
      <div className="inline-flex p-1 bg-[var(--bg-surface)] border border-border rounded-xl">
        <button
          onClick={() => setViewMode("light")}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${
            viewMode === "light"
              ? "bg-[var(--bg-base)] text-[var(--text-primary)] shadow-sm font-semibold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Light Mode
        </button>
        <button
          onClick={() => setViewMode("dark")}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${
            viewMode === "dark"
              ? "bg-[var(--bg-base)] text-[var(--text-primary)] shadow-sm font-semibold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Dark Mode
        </button>
      </div>

      <div className="w-full">
        {viewMode === "light" ? <LightModeShell /> : <DarkModeShell />}
      </div>
    </div>
  );
}
