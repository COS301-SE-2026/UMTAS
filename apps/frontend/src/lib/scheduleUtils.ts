import { ModuleResponseDto } from "@/app/builder/utils/modules/requestBuilders";
import type { BuilderEvent } from "@/components/molecules/builder/EventCard";
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

export function getAllWeekStarts(events: BuilderEvent[]): Date[] {
  const weekStartSet = new Set<string>();

  for (const event of events) {
    if (!event.date) {
      continue;
    }
    const monday = getMonday(new Date(event.date));
    weekStartSet.add(isoDateStr(monday));
  }

  const sorted = Array.from(weekStartSet).sort();
  return sorted.map((s) => new Date(s));
}

export function resolveScheduleEvents(
  events: BuilderEvent[],
  modules: ModuleResponseDto[],
): ScheduleEvent[] {
  const resolved: ScheduleEvent[] = [];

  for (const event of events) {
    const isRecurring =
      event.isRecurring === true ||
      (event.isRecurring as unknown as string) === "true";

    if (event.type === "lecture") {
      const lectureModule = modules.find(
        (m) => String(m.moduleID) === event.moduleId,
      );
      resolved.push({
        id: event.id,
        name: event.name,
        code: event.code,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        isRecurring,
        accentColour: lectureModule ? lectureModule.styling || null : null,
        subLabel: lectureModule ? lectureModule.moduleCode : null,
      });
      continue;
    }

    // future event types
    resolved.push({
      id: event.id,
      name: event.name,
      code: event.code,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      isRecurring,
      accentColour: null,
      subLabel: null,
    });
  }

  return resolved;
}

export function generateICS(
  events: BuilderEvent[],
  modules: ModuleResponseDto[],
): string {
  const lines: string[] = [];

  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//UMTAS//Schedule//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push("X-WR-TIMEZONE:Africa/Johannesburg");

  for (const event of events) {
    if (!event.date || !event.startTime || !event.endTime) {
      continue;
    }

    const lectureModule = modules.find(
      (m) => String(m.moduleID) === event.moduleId,
    );
    const moduleName = lectureModule ? lectureModule.moduleName : "";
    const dateStr = event.date.replace(/-/g, "");
    const startStr = event.startTime.replace(":", "") + "00";
    const endStr = event.endTime.replace(":", "") + "00";
    const uid = event.id + "@umtas.vigil";
    const isRecurring =
      event.isRecurring === true ||
      (event.isRecurring as unknown as string) === "true";

    lines.push("BEGIN:VEVENT");
    lines.push("UID:" + uid);
    lines.push("DTSTART;TZID=Africa/Johannesburg:" + dateStr + "T" + startStr);
    lines.push("DTEND;TZID=Africa/Johannesburg:" + dateStr + "T" + endStr);
    lines.push("SUMMARY:" + event.name);
    lines.push(
      "DESCRIPTION:" + event.code + (moduleName ? " - " + moduleName : ""),
    );

    if (isRecurring) {
      lines.push("RRULE:FREQ=WEEKLY");
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
