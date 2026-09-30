"use client";

import React from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";

interface ScheduleHeaderProps {
  eventCount: number;
  moduleCount: number;
  onExport: () => void;
  isGenerateMode?: boolean;
  onBack?: () => void;
}

export function ScheduleHeader({
  eventCount,
  moduleCount,
  onExport,
  isGenerateMode = false,
  onBack,
}: ScheduleHeaderProps) {
  function buildSubtitle() {
    if (isGenerateMode) {
      return "Check your events before generating your schedule.";
    }

    if (eventCount === 0) {
      return "No events generated yet.";
    }

    const eventStr = eventCount + " event" + (eventCount !== 1 ? "s" : "");
    const moduleStr = moduleCount + " module" + (moduleCount !== 1 ? "s" : "");

    return eventStr + " - " + moduleStr;
  }

  return (
    <div className="px-8">
      <div className="mx-auto max-w-6xl flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg-base)] pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            {isGenerateMode ? "Review and generate" : "Your Schedule"}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {buildSubtitle()}
          </p>
        </div>

        {isGenerateMode ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            Back
          </Button>
        ) : (
          eventCount > 0 && (
            <Button
              hidden
              type="button"
              onClick={onExport}
              variant="outline"
              className="flex items-center gap-2 border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors duration-[var(--duration-fast)]"
            >
              <Download size={16} strokeWidth={2} />
              Export .ics
            </Button>
          )
        )}
      </div>
    </div>
  );
}
