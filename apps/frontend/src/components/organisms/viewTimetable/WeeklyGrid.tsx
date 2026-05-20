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

  function getEventsForCell(date: Date): ScheduleEvent[] {
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

  function renderCell(date: Date, slotIndex: number) {
    const slotTime = TimeSlots[slotIndex];
    const cellKey = isoDateStr(date) + "-" + slotTime;

    const cellEvents = getEventsForCell(date).filter(
      (e) => timeToSlotIndex(e.startTime) === slotIndex,
    );

    if (cellEvents.length === 0) {
      return (
        <div
          key={cellKey + "-empty"}
          className="border border-[var(--border)] rounded-[4px] bg-[var(--bg-base)]"
          style={{ height: SlotHeight }}
        />
      );
    }

    const event = cellEvents[0];
    const span = slotSpan(event.startTime, event.endTime);

    return (
      <div
        key={cellKey + "-event"}
        style={{
          height: span * SlotHeight,
          gridRow: "span " + span,
        }}
      >
        <EventBlock event={event} />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]">
      <div
        className="min-w-[640px]"
        style={{
          display: "grid",
          gridTemplateColumns: "56px repeat(5, 1fr)",
        }}
      >
        <div className="h-12 border-b border-[var(--border)]" />

        {/* column head */}
        {weekDates.map((date) => {
          const header = formatColumnHeader(date);
          return (
            <div
              key={isoDateStr(date)}
              className="h-12 flex flex-col items-center justify-center border-b border-l border-[var(--border)]"
            >
              <span className="text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
                {header.day}
              </span>
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {header.date}
              </span>
            </div>
          );
        })}

        {/* time rows */}
        {TimeSlots.map((slot, slotIndex) => {
          return (
            <React.Fragment key={"row-" + slot}>
              <div
                className="border-b border-[var(--border)] flex items-start justify-end pr-2 pt-1"
                style={{ height: SlotHeight }}
              >
                {slot.endsWith(":00") && (
                  <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] leading-none">
                    {slot}
                  </span>
                )}
              </div>

              {/* day */}
              {weekDates.map((date) => renderCell(date, slotIndex))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
