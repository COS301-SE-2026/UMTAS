"use client";

// Consistent header used at the top of each cascading detail panel.

import React from "react";
import { X } from "lucide-react";

interface PanelHeaderProps {
  title: string;
  onClose?: () => void;
  action?: React.ReactNode;
}

export function PanelHeader({ title, onClose, action }: PanelHeaderProps) {
  return (
    <div className="flex h-12 items-center justify-between border-b border-[var(--border)] px-4">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {action}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close panel"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
