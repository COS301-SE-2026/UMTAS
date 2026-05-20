"use client";

import React from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import type { ScheduleEvent } from "@/types/schedule";

interface EventBlockProps {
  event: ScheduleEvent;
}

export function EventBlock({ event }: EventBlockProps) {
  function getAccentStyle() {
    if (event.accentColour) {
      return { borderLeftColor: event.accentColour };
    }
    return { borderLeftColor: "var(--border)" };
  }

  return (
    <div
      className="flex flex-col gap-1 rounded-sm border-l-2 bg-[var(--bg-elevated)] px-2 py-1.5 h-full overflow-hidden"
      style={getAccentStyle()}
    >
      <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-tight">
        {event.name}
      </p>

      {event.subLabel && (
        <Badge
          variant="outline"
          className="w-fit px-1.5 py-0 text-[10px] font-medium uppercase tracking-[0.04em] border-[var(--border)] text-[var(--text-secondary)] bg-transparent"
        >
          {event.subLabel}
        </Badge>
      )}

      <div className="flex items-center gap-1 mt-auto">
        <Clock
          size={10}
          className="text-[var(--text-secondary)] flex-shrink-0"
          strokeWidth={1.5}
        />
        <p className="text-[10px] text-[var(--text-secondary)] font-medium truncate">
          {event.startTime} - {event.endTime}
        </p>
      </div>
    </div>
  );
}
