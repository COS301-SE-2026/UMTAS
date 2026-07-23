"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { formatWeekRange } from "@/lib/scheduleUtils";

interface WeekNavBarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
}

export function WeekNavBar({
  selectedDate,
  onDateChange,
  weekStart,
  onPrev,
  onNext,
}: WeekNavBarProps) {
  const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 mb-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onPrev}
        className="h-8 w-8 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
      </Button>

      <div className="flex items-center gap-3 px-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {formatWeekRange(weekStart)}
        </span>
        <input
          type="date"
          value={dateString}
          onChange={(e) => {
            if (e.target.value) {
              onDateChange(new Date(e.target.value));
            }
          }}
          className="h-8 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onNext}
        className="h-8 w-8 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ChevronRight size={16} strokeWidth={1.5} />
      </Button>
    </div>
  );
}
