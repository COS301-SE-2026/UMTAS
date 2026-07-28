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

// add more types post demo 1
export type EventType = "lecture" | "tutorial" | "prac" | "exam" | "test";

export interface EventOption {
  value: EventType;
  label: string;
  icon: React.ReactNode;
}

const Event_Types: EventOption[] = [
  {
    value: "lecture",
    label: "Lecture",
    icon: <BookOpen size={15} />,
  },
  {
    value: "tutorial",
    label: "Tutorial",
    icon: <BookOpen size={15} />,
  },
  {
    value: "prac",
    label: "Practical",
    icon: <BookOpen size={15} />,
  },
  {
    value: "exam",
    label: "Exam",
    icon: <BookOpen size={15} />,
  },
  {
    value: "test",
    label: "Test",
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
        data-testid="event-Type-Select"
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
            value={type.value}
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
