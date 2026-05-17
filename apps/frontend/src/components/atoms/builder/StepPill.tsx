"use client";

// clickable row button that sits in the left panel and opens the next cascading panel (inspired by subnautica :))

import React from "react";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@/../utilities/utils";

interface StepPillProps {
  icon: React.ReactNode;
  label: string;

  summary?: string;
  isActive?: boolean;
  isComplete?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function StepPill({
  icon,
  label,
  summary,
  isActive,
  isComplete,
  onClick,
  disabled,
}: StepPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200",
        "border border-transparent",
        isActive
          ? "bg-[var(--bg-elevated)] border-[var(--border)] shadow-sm"
          : "hover:bg-[var(--bg-elevated)] hover:border-[var(--border)]",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
      )}
    >
      {/* Icon circle */}
      <span
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors",
          isComplete
            ? "bg-[var(--text-primary)] text-[var(--bg-base)]"
            : isActive
              ? "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
              : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]",
        )}
      >
        {isComplete ? <Check size={15} strokeWidth={2.5} /> : icon}
      </span>

      {/* Label and summary */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "text-sm font-medium leading-tight",
            isActive || isComplete
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-secondary)]",
          )}
        >
          {label}
        </span>
        {summary && (
          <span className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
            {summary}
          </span>
        )}
      </div>

      {/* chevron */}
      <ChevronRight
        size={15}
        className={cn(
          "flex-shrink-0 transition-transform duration-200",
          isActive
            ? "rotate-90 text-[var(--text-primary)]"
            : "text-[var(--text-secondary)]",
          "group-hover:text-[var(--text-primary)]",
        )}
      />
    </button>
  );
}
