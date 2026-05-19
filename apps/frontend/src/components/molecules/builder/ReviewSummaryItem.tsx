"use client";

import React from "react";

interface ReviewSummaryItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onEdit?: () => void;
}

export function ReviewSummaryItem({
  icon,
  label,
  value,
  onEdit,
}: ReviewSummaryItemProps) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[var(--border)] last:border-b-0">
      <span className="mt-0.5 flex-shrink-0 text-[var(--text-secondary)]">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className="text-sm text-[var(--text-primary)] leading-snug mt-0.5">
          {value}
        </p>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex-shrink-0 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline-offset-2 hover:underline transition-colors"
        >
          Edit
        </button>
      )}
    </div>
  );
}
