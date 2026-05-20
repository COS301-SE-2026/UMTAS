"use client";

import React from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import type { ScheduleEvent } from "@/types/schedule";

interface EventBlockProps {
  event: ScheduleEvent;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function EventBlock({ event }: EventBlockProps) {
  function getBlockStyle() {
    if (!event.accentColour) {
      return {
        borderLeftColor: "var(--border)",
        backgroundColor: "var(--bg-elevated)",
      };
    }

    const rgb = hexToRgb(event.accentColour);
    if (!rgb) {
      return {
        borderLeftColor: event.accentColour,
        backgroundColor: "var(--bg-elevated)",
      };
    }

    return {
      borderLeftColor: event.accentColour,
      backgroundColor: "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ", 0.12)",
    };
  }

  return (
    <div
      className="flex flex-col gap-1 rounded-sm border-l-2 px-2 py-1.5 h-full overflow-hidden"
      style={getBlockStyle()}
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
