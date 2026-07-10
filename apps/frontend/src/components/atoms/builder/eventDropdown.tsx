"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";

// Add more sources when personal-event creation is available.
export type EventSource = "university";

export interface EventSourceOption {
  value: EventSource;
  label: string;
  icon: React.ReactNode;
}

const EVENT_SOURCES: EventSourceOption[] = [
  {
    value: "university",
    label: "university",
    icon: <BookOpen size={15} />,
  },
];

interface EventSourceDropdownProps {
  value: EventSource | "";
  onChange: (value: EventSource) => void;
  disabled?: boolean;
}

export function EventSourceDropdown({
  value,
  onChange,
  disabled,
}: EventSourceDropdownProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as EventSource)}
      disabled={disabled}
    >
      <SelectTrigger
        className={[
          "h-10 w-full bg-[var(--bg-elevated)] border-[var(--border)]",
          "text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]",
          !value ? "text-[var(--text-secondary)]" : "",
        ].join(" ")}
      >
        <SelectValue placeholder="Select event source…" />
      </SelectTrigger>
      <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
        {EVENT_SOURCES.map((source) => (
          <SelectItem
            key={source.value}
            value={source.value}
            className="text-[var(--text-primary)] focus:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)]">
                {source.icon}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{source.label}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
