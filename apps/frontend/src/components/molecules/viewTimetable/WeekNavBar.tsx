"use client";

import React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
      {/* <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onPrev}
          className="h-8 w-8 shrink-0 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ChevronLeft
            aria-label="go back one week"
            size={16}
            strokeWidth={1.5}
          />
        </Button>

        <span className="text-sm font-medium text-[var(--text-primary)] px-2 whitespace-nowrap">
          {formatWeekRange(weekStart)}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="h-8 w-8 shrink-0 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ChevronRight
            aria-label="go forward one week"
            size={16}
            strokeWidth={1.5}
          />
        </Button>
      </div> */}

      <div className="relative flex items-center justify-center h-8 w-8 rounded-md border border-[var(--border)] hover:bg-[var(--accent)] cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <Calendar size={16} strokeWidth={1.5} className="pointer-events-none" />
        <input
          aria-label="select date "
          data-testid="schedules-Date-Input"
          type="date"
          value={dateString}
          onChange={(e) => {
            if (e.target.value) {
              onDateChange(new Date(e.target.value));
            }
          }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
    </div>
  );
}
