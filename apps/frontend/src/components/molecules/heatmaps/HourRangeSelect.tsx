"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";

export interface HourSlot {
  startTime: string;
  endTime: string;
}

interface HourRangeSelectProps {
  value: HourSlot;
  onChange: (value: HourSlot) => void;
  error?: string;
  disabled?: boolean;
}

export const TIMES: string[] = [];
for (let h = 7; h <= 20; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 20) TIMES.push(`${String(h).padStart(2, "0")}:30`);
}

const triggerClass =
  "h-8 text-xs bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]";

export function HourRangeSelect({
  value,
  onChange,
  error,
  disabled,
}: HourRangeSelectProps) {
  function handleStartChange(newStart: string) {
    const newEnd = newStart > value.endTime ? newStart : value.endTime;
    onChange({ startTime: newStart, endTime: newEnd });
  }

  function handleEndChange(newEnd: string) {
    const newStart = newEnd < value.startTime ? newEnd : value.startTime;
    onChange({ startTime: newStart, endTime: newEnd });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Select
          disabled={disabled == undefined ? false : disabled}
          value={value.startTime}
          onValueChange={handleStartChange}
        >
          <SelectTrigger
            data-testid="event-TimeStart-Select"
            className={`${triggerClass} w-21`}
          >
            <SelectValue placeholder="Start" />
          </SelectTrigger>
          <SelectContent className="bg-bg-surface border-border max-h-44">
            {TIMES.map((time) => (
              <SelectItem
                key={time}
                value={time}
                className="text-xs text-(--text-primary) focus:bg-bg-elevated"
              >
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs text-(--text-secondary)">-</span>

        <Select
          disabled={disabled == undefined ? false : disabled}
          value={value.endTime}
          onValueChange={handleEndChange}
        >
          <SelectTrigger
            data-testid="event-TimeEnd-Select"
            className={`${triggerClass} w-21`}
          >
            <SelectValue placeholder="End" />
          </SelectTrigger>
          <SelectContent className="bg-bg-surface border-border max-h-44">
            {TIMES.map((time) => (
              <SelectItem
                key={time}
                value={time}
                className="text-xs text-(--text-primary) focus:bg-bg-elevated"
              >
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && <p className="text-xs text-(--text-error)">{error}</p>}
    </div>
  );
}
