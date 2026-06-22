import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import { EventResponse } from "@/app/builder/utils/events/eventRequestBuilder";
import type { ScheduleEvent } from "@/types/schedule";

export function isoDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4);
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
  const startStr = weekStart.getDate() + " " + months[weekStart.getMonth()];
  const endStr =
    weekEnd.getDate() +
    " " +
    months[weekEnd.getMonth()] +
    " " +
    weekEnd.getFullYear();
  return startStr + " - " + endStr;
}

export function getAllWeekStarts(events: EventResponse[]): Date[] {
  const weekStartSet = new Set<string>();

  for (const event of events) {
    const day = event.event.eventCriteria?.day;
    if (!day) {
      continue;
    }
    const monday = getMonday(new Date(day));
    weekStartSet.add(isoDateStr(monday));
  }

  const sorted = Array.from(weekStartSet).sort();
  return sorted.map((s) => new Date(s));
}

export function resolveScheduleEvents(
  events: EventResponse[],
  modules: ModuleResponseDto[],
): ScheduleEvent[] {
  const resolved: ScheduleEvent[] = [];

  for (const event of events) {
    const criteria = event.event.eventCriteria;
    const isRecurring = false; // Temporarily disabled

    if (criteria?.type === "lecture") {
      const lectureModule = modules.find(
        (m) => m.moduleID === event.lecture?.moduleID,
      );
      resolved.push({
        id: String(event.event.eventID),
        name: criteria?.moduleCode || "",
        code: criteria?.moduleCode || "",
        date: criteria?.day || "",
        startTime: criteria?.startTime || "",
        endTime: criteria?.endTime || "",
        isRecurring,
        accentColour: lectureModule ? lectureModule.styling || null : null,
        subLabel: lectureModule ? lectureModule.moduleCode : null,
      });
      continue;
    }

    // future event types
    resolved.push({
      id: String(event.event.eventID),
      name: criteria?.moduleCode || "",
      code: criteria?.moduleCode || "",
      date: criteria?.day || "",
      startTime: criteria?.startTime || "",
      endTime: criteria?.endTime || "",
      isRecurring,
      accentColour: null,
      subLabel: null,
    });
  }

  return resolved;
}
