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
import { ActivityTypesEvents } from "@/app/builder/utils/events/eventRequestBuilder";

// add more types post demo 1
export type EventType = ActivityTypesEvents;

export interface EventOption {
  value: EventType;
  label: string;
  icon: React.ReactNode;
}

const Event_Types: EventOption[] = [
  {
    value: "lecture",
    label: "lecture",
    icon: <BookOpen size={15} />,
  },
  {
    value: "tutorial",
    label: "tut",
    icon: <BookOpen size={15} />,
  },
  {
    value: "prac",
    label: "prac",
    icon: <BookOpen size={15} />,
  },
  {
    value: "test",
    label: "test",
    icon: <BookOpen size={15} />,
  },
];

interface EventTypeDropdownProps {
  value: EventType | "";
  onChange: (value: EventType) => void;
  disabled?: boolean;
}

export function EventTypeDropdown({
  value,
  onChange,
  disabled,
}: EventTypeDropdownProps) {
  console.log(value);
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as EventType)}
      disabled={disabled}
    >
      <SelectTrigger
        className={[
          "h-10 w-full bg-[var(--bg-elevated)] border-[var(--border)]",
          "text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]",
          !value ? "text-[var(--text-secondary)]" : "",
        ].join(" ")}
      >
        <SelectValue placeholder="Select event type…" />
      </SelectTrigger>
      <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
        {Event_Types.map((type) => (
          <SelectItem
            key={type.value}
            value={type.value || ""}
            className="text-[var(--text-primary)] focus:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)]">{type.icon}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{type.label}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
