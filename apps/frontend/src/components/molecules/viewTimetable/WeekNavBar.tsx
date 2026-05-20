"use client";

import React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import { formatWeekRange } from "@/lib/scheduleUtils";

interface WeekNavBarProps {
  weekStart: Date;
  currentIndex: number;
  totalWeeks: number;
  onPrev: () => void;
  onNext: () => void;
}

export function WeekNavBar({
  weekStart,
  currentIndex,
  totalWeeks,
  onPrev,
  onNext,
}: WeekNavBarProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex >= totalWeeks - 1;

  return (
    <div className="flex items-center gap-3 mb-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onPrev}
        disabled={isFirst}
        aria-label="Previous week"
        className="h-8 w-8 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
      </Button>

      <div className="flex items-center gap-2">
        <CalendarDays
          size={14}
          className="text-[var(--text-secondary)]"
          strokeWidth={1.5}
        />
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {formatWeekRange(weekStart)}
        </span>
        {totalWeeks > 1 && (
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-[0.04em] border-[var(--border)] text-[var(--text-secondary)]"
          >
            {currentIndex + 1} / {totalWeeks}
          </Badge>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={isLast}
        aria-label="Next week"
        className="h-8 w-8 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
      >
        <ChevronRight size={16} strokeWidth={1.5} />
      </Button>
    </div>
  );
}
