"use client";

import React from "react";
import { EventBlock } from "@/components/molecules/viewTimetable/EventBlock";
import { isoDateStr } from "@/lib/scheduleUtils";
import type { ScheduleEvent } from "@/types/schedule";

interface WeeklyGridProps {
  events: ScheduleEvent[];
  weekStart: Date;
}

const TimeSlots: string[] = [];
for (let h = 7; h <= 20; h++) {
  const hStr = String(h).padStart(2, "0");
  TimeSlots.push(hStr + ":00");
  if (h < 20) {
    TimeSlots.push(hStr + ":30");
  }
}

const SlotHeight = 40;
const TotalHeight = TimeSlots.length * SlotHeight;
const HeaderHeight = 48;
const TimeColWidth = 56;

function getWeekDates(weekStart: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatColumnHeader(date: Date): { day: string; date: string } {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return {
    day: days[dayIndex],
    date: date.getDate() + " " + months[date.getMonth()],
  };
}

function timeToSlotIndex(time: string): number {
  const parts = time.split(":");
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  return Math.floor(((hours - 7) * 60 + minutes) / 30);
}

function slotSpan(startTime: string, endTime: string): number {
  const startParts = startTime.split(":");
  const endParts = endTime.split(":");
  const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
  const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
  return Math.max(1, Math.ceil((endMinutes - startMinutes) / 30));
}

function getDayIndex(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay();
  if (day === 0) return 6;
  return day - 1;
}

export function WeeklyGrid({ events, weekStart }: WeeklyGridProps) {
  const weekDates = getWeekDates(weekStart);

  function getEventsForDay(date: Date): ScheduleEvent[] {
    const dateStr = isoDateStr(date);
    const result: ScheduleEvent[] = [];

    for (const event of events) {
      if (!event.date) {
        continue;
      }

      if (event.date === dateStr) {
        result.push(event);
        continue;
      }

      if (event.isRecurring) {
        const eventDayIndex = getDayIndex(event.date);
        const cellDayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
        const eventDate = new Date(event.date + "T00:00:00");

        if (eventDayIndex === cellDayIndex && date >= eventDate) {
          result.push(event);
        }
      }
    }

    return result;
  }

  function renderTimeColumn() {
    return (
      <div
        className="flex-shrink-0 border-r border-[var(--border)]"
        style={{ width: TimeColWidth }}
      >
        {/* time label header spacer */}
        <div
          className="border-b border-[var(--border)]"
          style={{ height: HeaderHeight }}
        />

        {/* time labels */}
        <div className="relative" style={{ height: TotalHeight }}>
          {TimeSlots.map((slot, index) => {
            if (!slot.endsWith(":00")) {
              return null;
            }

            return (
              <div
                key={slot}
                className="absolute right-0 pr-2 flex items-start justify-end"
                style={{
                  top: index * SlotHeight,
                  height: SlotHeight,
                  width: TimeColWidth,
                }}
              >
                <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] leading-none pt-1">
                  {slot}
                </span>
              </div>
            );
          })}

          {/* horizontal slot lines */}
          {TimeSlots.map((slot, index) => (
            <div
              key={"line-" + slot}
              className="absolute left-0 right-0 border-b border-[var(--border)]"
              style={{ top: (index + 1) * SlotHeight, width: "100%" }}
            />
          ))}
        </div>
      </div>
    );
  }

  function renderDayColumn(date: Date) {
    const dayEvents = getEventsForDay(date);

    return (
      <div
        key={isoDateStr(date)}
        className="flex-1 border-r border-[var(--border)] min-w-0"
      >
        {/* col headers */}
        <div
          className="flex flex-col items-center justify-center border-b border-[var(--border)] bg-[var(--bg-elevated)]"
          style={{ height: HeaderHeight }}
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
            {formatColumnHeader(date).day}
          </span>
          <span className="text-xs font-medium text-[var(--text-primary)]">
            {formatColumnHeader(date).date}
          </span>
        </div>

        {/* day body */}
        <div
          className="relative bg-[var(--bg-base)]"
          style={{ height: TotalHeight }}
        >
          {/* horizontal slot lines */}
          {TimeSlots.map((slot, index) => (
            <div
              key={"line-" + slot}
              className="absolute left-0 right-0 border-b border-[var(--border)]"
              style={{ top: (index + 1) * SlotHeight }}
            />
          ))}

          {/* events */}
          {dayEvents.map((event) => {
            const slotIndex = timeToSlotIndex(event.startTime);
            const span = slotSpan(event.startTime, event.endTime);
            const top = slotIndex * SlotHeight;
            const height = span * SlotHeight;

            return (
              <div
                key={event.id}
                className="absolute left-0 right-0 p-0.5 z-20"
                style={{ top, height }}
              >
                <EventBlock event={event} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]">
      <div className="flex w-full">
        {renderTimeColumn()}
        {weekDates.map((date) => renderDayColumn(date))}
      </div>
    </div>
  );
}
