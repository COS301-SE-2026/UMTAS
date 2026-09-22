import type { EventCriteria } from '../Events/dto/event.types';

export interface OccurrenceEvent {
  isRecurring: boolean;
  eventCriteria: EventCriteria;
}

export interface EventOccurrence {
  scheduledStartAt: Date;
  scheduledEndAt: Date;
}

export const ATTENDANCE_CAPTURE_BUFFER_MS = 10 * 60_000;

export const DEFAULT_ATTENDANCE_TIME_ZONE = 'Africa/Johannesburg';

function formatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

function partsAt(date: Date, timeZone: string): Record<string, string> {
  return Object.fromEntries(
    formatter(timeZone)
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
}

export function localDateAt(date: Date, timeZone: string): string {
  const parts = partsAt(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function localDateTimeToUtc(
  date: string,
  time: string,
  timeZone: string,
): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  let utcMillis = wallClock;
  try {
    // Correct the assumed UTC instant until its displayed wall time matches
    // the requested local time. This also respects timezone offset changes.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const parts = partsAt(new Date(utcMillis), timeZone);
      const displayedWallClock = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
      );
      const difference = wallClock - displayedWallClock;
      utcMillis += difference;
      if (difference === 0) break;
    }
  } catch {
    return null;
  }
  return new Date(utcMillis);
}

export function localDayBounds(
  date: string,
  timeZone = process.env.ATTENDANCE_TIME_ZONE ?? DEFAULT_ATTENDANCE_TIME_ZONE,
): { start: Date; end: Date } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const nextDay = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 1),
  );
  const nextDate = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, '0')}-${String(nextDay.getUTCDate()).padStart(2, '0')}`;
  const start = localDateTimeToUtc(date, '00:00', timeZone);
  const end = localDateTimeToUtc(nextDate, '00:00', timeZone);
  return start && end ? { start, end } : null;
}

export function occurrenceOnLocalDate(
  event: OccurrenceEvent,
  date: string,
  timeZone = process.env.ATTENDANCE_TIME_ZONE ?? DEFAULT_ATTENDANCE_TIME_ZONE,
): EventOccurrence | null {
  const criteria = event.eventCriteria;
  let localWeekday: string;
  try {
    localWeekday = partsAt(
      localDateTimeToUtc(date, '12:00', timeZone) ?? new Date(),
      timeZone,
    ).weekday.toLowerCase();
  } catch {
    return null;
  }

  if (event.isRecurring) {
    if (!criteria.dayOfWeek || criteria.dayOfWeek !== localWeekday) return null;
  } else if (criteria.date !== date) {
    return null;
  }

  const scheduledStartAt = localDateTimeToUtc(
    date,
    criteria.startTime,
    timeZone,
  );
  const scheduledEndAt = localDateTimeToUtc(date, criteria.endTime, timeZone);
  if (
    !scheduledStartAt ||
    !scheduledEndAt ||
    scheduledStartAt >= scheduledEndAt
  ) {
    return null;
  }
  return { scheduledStartAt, scheduledEndAt };
}

export function currentOccurrence(
  event: OccurrenceEvent,
  now = new Date(),
  timeZone = process.env.ATTENDANCE_TIME_ZONE ?? DEFAULT_ATTENDANCE_TIME_ZONE,
): EventOccurrence | null {
  const occurrence = occurrenceOnLocalDate(
    event,
    localDateAt(now, timeZone),
    timeZone,
  );
  if (
    !occurrence ||
    now < occurrence.scheduledStartAt ||
    now >= occurrence.scheduledEndAt
  ) {
    return null;
  }
  return occurrence;
}

export function attendanceAvailable(
  occurrence: EventOccurrence,
  now = new Date(),
): boolean {
  return (
    now.getTime() >=
      occurrence.scheduledStartAt.getTime() - ATTENDANCE_CAPTURE_BUFFER_MS &&
    now.getTime() <
      occurrence.scheduledEndAt.getTime() + ATTENDANCE_CAPTURE_BUFFER_MS
  );
}
