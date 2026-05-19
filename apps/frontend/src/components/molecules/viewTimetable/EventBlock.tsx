"use client";

import React from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import type { BuilderEvent } from "@/components/molecules/builder/EventCard";
import type { Module } from "@/components/molecules/builder/ModuleCard";

interface EventBlockProps {
  event: BuilderEvent;
  module: Module | null;
}

export function EventBlock({ event, module }: EventBlockProps) {
  function getColourStyle() {
    if (module && module.colour) {
      return { borderLeftColor: module.colour };
    }
    return { borderLeftColor: "var(--border)" };
  }

  return (
    <div
      className="flex flex-col gap-1 rounded-sm border-l-2 bg-[var(--bg-elevated)] px-2 py-1.5 h-full overflow-hidden"
      style={getColourStyle()}
    >
      <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-tight">
        {event.name}
      </p>

      {module && (
        <Badge
          variant="outline"
          className="w-fit px-1.5 py-0 text-[10px] font-medium uppercase tracking-[0.04em] border-[var(--border)] text-[var(--text-secondary)] bg-transparent"
        >
          {module.code}
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
