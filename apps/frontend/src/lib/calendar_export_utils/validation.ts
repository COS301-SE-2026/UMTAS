import {
  getUtcOffsetMinutes,
  toBasicDate,
  toBasicDateTime,
} from "./calendar_time";
import type { GeneratedCalendarPayloadDto } from "./types";

function assertOrderedDates(start: string, end: string, label: string): void {
  toBasicDate(start);
  toBasicDate(end);
  if (end < start) {
    throw new RangeError(`${label} end date must not precede its start date`);
  }
}

function assertOrderedTimes(start: string, end: string, label: string): void {
  toBasicDateTime("2000-01-01", start);
  toBasicDateTime("2000-01-01", end);
  if (end <= start) {
    throw new RangeError(`${label} end time must be later than its start time`);
  }
}

export function assertCalendarPayload(
  payload: GeneratedCalendarPayloadDto,
  timezone: string,
): void {
  if (
    !Number.isInteger(payload.year) ||
    payload.year < 1000 ||
    payload.year > 9999
  ) {
    throw new RangeError(`Invalid calendar year: ${payload.year}`);
  }
  getUtcOffsetMinutes(timezone, new Date(Date.UTC(payload.year, 0, 1)));

  const keys = new Set<string>();
  const claimKey = (key: string) => {
    if (!key.trim())
      throw new RangeError("Calendar event keys must not be empty");
    if (keys.has(key))
      throw new RangeError(`Duplicate calendar event key: ${key}`);
    keys.add(key);
  };

  for (const event of payload.recurringEvents) {
    claimKey(event.key);
    assertOrderedDates(event.startsOn, event.endsOn, event.key);
    assertOrderedTimes(event.startTime, event.endTime, event.key);
    for (const date of [...event.excludedDates, ...event.additionalDates]) {
      toBasicDate(date);
    }
  }
  for (const event of payload.oneOffEvents) {
    claimKey(event.key);
    toBasicDate(event.date);
    assertOrderedTimes(event.startTime, event.endTime, event.key);
  }
  for (const event of payload.allDayEvents) {
    claimKey(event.key);
    assertOrderedDates(event.startDate, event.endDate, event.key);
  }
}
