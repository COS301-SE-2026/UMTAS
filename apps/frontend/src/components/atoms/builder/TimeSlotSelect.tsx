"use client";

// One row for selecting day + start time + end time for a module time slot

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { X } from "lucide-react";

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface TimeSlotSelectProps {
  value: TimeSlot;
  onChange: (value: TimeSlot) => void;
  onRemove: () => void;
  error?: string;
  hideDaySelect?: boolean;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIMES: string[] = [];
for (let h = 7; h <= 20; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 20) TIMES.push(`${String(h).padStart(2, "0")}:30`);
}

const triggerClass =
  "h-8 text-xs bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]";

export function TimeSlotSelect({
  value,
  onChange,
  onRemove,
  error,
  hideDaySelect,
}: TimeSlotSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        {!hideDaySelect && (
          <Select
            value={value.day}
            onValueChange={(v) => onChange({ ...value, day: v })}
          >
            <SelectTrigger className={`${triggerClass} w-[120px]`}>
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
              {DAYS.map((d) => (
                <SelectItem
                  key={d}
                  value={d}
                  className="text-xs text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
                >
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={value.startTime}
          onValueChange={(v) => onChange({ ...value, startTime: v })}
        >
          <SelectTrigger className={`${triggerClass} w-[84px]`}>
            <SelectValue placeholder="Start" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)] max-h-44">
            {TIMES.map((t) => (
              <SelectItem
                key={t}
                value={t}
                className="text-xs text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
              >
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs text-[var(--text-secondary)]">–</span>

        <Select
          value={value.endTime}
          onValueChange={(v) => onChange({ ...value, endTime: v })}
        >
          <SelectTrigger className={`${triggerClass} w-[84px]`}>
            <SelectValue placeholder="End" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)] max-h-44">
            {TIMES.map((t) => (
              <SelectItem
                key={t}
                value={t}
                className="text-xs text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
              >
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-red-400 transition-colors"
          aria-label="Remove time slot"
        >
          <X size={13} />
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
