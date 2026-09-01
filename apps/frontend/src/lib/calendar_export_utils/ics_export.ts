import {
  addDays,
  buildVTimezone,
  buildWeeklyRrule,
  toBasicDate,
  toBasicDateTime,
} from "./calendar_time";
import type { GeneratedCalendarPayloadDto } from "./types";
import { assertCalendarPayload } from "./validation";

const TEXT_ENCODER = new TextEncoder();

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldLine(line: string): string[] {
  const folded: string[] = [];
  let current = "";
  let byteLength = 0;
  const limit = 75;

  for (const character of line) {
    const characterBytes = TEXT_ENCODER.encode(character).length;
    if (byteLength + characterBytes > limit && current.length > 0) {
      folded.push(current);
      current = ` ${character}`;
      byteLength = 1 + characterBytes;
    } else {
      current += character;
      byteLength += characterBytes;
    }
  }
  folded.push(current);
  return folded;
}

function utcTimestamp(now: Date): string {
  return now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function textProperty(name: string, value: string | undefined): string[] {
  return value === undefined ? [] : [`${name}:${escapeText(value)}`];
}

function colourProperty(colour: string | undefined): string[] {
  return colour?.trim() ? [`COLOR:${colour.trim().toUpperCase()}`] : [];
}

function eventEnvelope(key: string, now: Date, body: string[]): string[] {
  return [
    "BEGIN:VEVENT",
    `UID:${escapeText(key)}@umtas.vigil`,
    `DTSTAMP:${utcTimestamp(now)}`,
    ...body,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
  ];
}

function calendarYearRange(
  payload: GeneratedCalendarPayloadDto,
): [number, number] {
  const dates = [
    ...payload.recurringEvents.flatMap((event) => [
      event.startsOn,
      event.endsOn,
    ]),
    ...payload.oneOffEvents.map((event) => event.date),
    ...payload.allDayEvents.flatMap((event) => [
      event.startDate,
      event.endDate,
    ]),
  ];
  if (dates.length === 0) return [payload.year, payload.year];
  const years = dates.map((date) => Number(date.slice(0, 4)));
  return [Math.min(...years), Math.max(...years)];
}

export function generateAcademicCalendarICS(
  payload: GeneratedCalendarPayloadDto,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now = new Date(),
): string {
  assertCalendarPayload(payload, timezone);
  if (Number.isNaN(now.getTime())) throw new RangeError("Invalid DTSTAMP date");
  const [fromYear, toYear] = calendarYearRange(payload);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UMTAS//Academic Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(payload.name)}`,
    `X-WR-TIMEZONE:${timezone}`,
    ...buildVTimezone(timezone, fromYear, toYear),
  ];

  for (const event of payload.recurringEvents) {
    const exdates = event.excludedDates.map((date) =>
      toBasicDateTime(date, event.startTime),
    );
    const rdates = event.additionalDates.map((date) =>
      toBasicDateTime(date, event.startTime),
    );
    lines.push(
      ...eventEnvelope(event.key, now, [
        `DTSTART;TZID=${timezone}:${toBasicDateTime(event.startsOn, event.startTime)}`,
        `DTEND;TZID=${timezone}:${toBasicDateTime(event.startsOn, event.endTime)}`,
        `RRULE:${buildWeeklyRrule({ ...event, tzid: timezone })}`,
        ...(exdates.length
          ? [`EXDATE;TZID=${timezone}:${exdates.join(",")}`]
          : []),
        ...(rdates.length
          ? [`RDATE;TZID=${timezone}:${rdates.join(",")}`]
          : []),
        ...textProperty("SUMMARY", event.title),
        ...textProperty("DESCRIPTION", event.description),
        ...textProperty("LOCATION", event.location),
        ...colourProperty(event.moduleColour),
      ]),
    );
  }

  for (const event of payload.oneOffEvents) {
    lines.push(
      ...eventEnvelope(event.key, now, [
        `DTSTART;TZID=${timezone}:${toBasicDateTime(event.date, event.startTime)}`,
        `DTEND;TZID=${timezone}:${toBasicDateTime(event.date, event.endTime)}`,
        ...textProperty("SUMMARY", event.title),
        ...textProperty("DESCRIPTION", event.description),
        ...textProperty("LOCATION", event.location),
        ...colourProperty(event.moduleColour),
      ]),
    );
  }

  for (const event of payload.allDayEvents) {
    lines.push(
      ...eventEnvelope(event.key, now, [
        `DTSTART;VALUE=DATE:${toBasicDate(event.startDate)}`,
        `DTEND;VALUE=DATE:${toBasicDate(addDays(event.endDate, 1))}`,
        ...textProperty("SUMMARY", event.title),
        ...textProperty("DESCRIPTION", event.description),
      ]),
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.flatMap(foldLine).join("\r\n")}\r\n`;
}

export function downloadICS(content: string, filename: string): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
