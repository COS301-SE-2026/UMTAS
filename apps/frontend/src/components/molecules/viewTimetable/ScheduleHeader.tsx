"use client";

import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";

interface ScheduleHeaderProps {
  eventCount: number;
  moduleCount: number;
  onExport: () => void;
}

export function ScheduleHeader({
  eventCount,
  moduleCount,
  onExport,
}: ScheduleHeaderProps) {
  function buildSubtitle() {
    if (eventCount === 0) {
      return "No events generated yet.";
    }

    const eventStr = eventCount + " event" + (eventCount !== 1 ? "s" : "");
    const moduleStr = moduleCount + " module" + (moduleCount !== 1 ? "s" : "");

    return eventStr + " - " + moduleStr;
  }

  return (
    <div className="px-8 py-5 border-b border-[var(--border)] bg-[var(--bg-base)]">
      <div className="mx-auto max-w-6xl flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Your Schedule
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {buildSubtitle()}
          </p>
        </div>

        {eventCount > 0 && (
          <Button
            type="button"
            onClick={onExport}
            variant="outline"
            className="flex items-center gap-2 border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors duration-[var(--duration-fast)]"
          >
            <Download size={16} strokeWidth={1.5} />
            Export .ics
          </Button>
        )}
      </div>
    </div>
  );
}
