"use client";

import React from "react";

interface PreferenceRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  stacked?: boolean;
}

export function PreferenceRow({
  label,
  description,
  children,
  stacked,
}: PreferenceRowProps) {
  return (
    <div
      className={[
        "py-3 border-b border-[var(--border)] last:border-b-0",
        stacked
          ? "flex flex-col gap-3"
          : "flex items-center justify-between gap-4",
      ].join(" ")}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </span>
        {description && (
          <span className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {description}
          </span>
        )}
      </div>
      <div className={stacked ? "" : "flex-shrink-0"}>{children}</div>
    </div>
  );
}
