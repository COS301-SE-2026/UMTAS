"use client";

// Animated loading state rendered inside the Generate panel

import React from "react";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";

export function GeneratingSkeleton() {
  return (
    <div className="flex flex-col items-center gap-5 py-10 px-6">
      {/* Spinning ring */}
      <div className="relative flex h-14 w-14 items-center justify-center">
        <svg
          className="animate-spin"
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
        >
          <circle
            cx="28"
            cy="28"
            r="24"
            stroke="var(--border)"
            strokeWidth="3"
          />
          <path
            d="M28 4a24 24 0 0 1 24 24"
            stroke="var(--text-primary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Generating your schedules…
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          Finding conflict-free options based on your preferences.
        </p>
      </div>

      <div className="w-full space-y-2.5">
        <Skeleton className="h-3 w-full bg-[var(--bg-elevated)]" />
        <Skeleton className="h-3 w-4/5 bg-[var(--bg-elevated)]" />
        <Skeleton className="h-3 w-3/5 bg-[var(--bg-elevated)]" />
      </div>
    </div>
  );
}
