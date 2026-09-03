import type { Weekday } from "./types";

const WALL_CLOCK_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function wallClockFormatter(tzid: string): Intl.DateTimeFormat {
  let formatter = WALL_CLOCK_FORMATTERS.get(tzid);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
      timeZone: tzid,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    WALL_CLOCK_FORMATTERS.set(tzid, formatter);
  }
  return formatter;
}

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function wallClockParts(tzid: string, instant: Date): DateTimeParts {
  const values = Object.fromEntries(
    wallClockFormatter(tzid)
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Partial<DateTimeParts>;
  if (
    values.year === undefined ||
    values.month === undefined ||
    values.day === undefined ||
    values.hour === undefined ||
    values.minute === undefined ||
    values.second === undefined
  ) {
    throw new RangeError(`Could not determine the wall-clock time for ${tzid}`);
  }
  return values as DateTimeParts;
}

export function getUtcOffsetMinutes(tzid: string, utcInstant: Date): number {
  if (Number.isNaN(utcInstant.getTime())) throw new RangeError("Invalid date");
  const parts = wallClockParts(tzid, utcInstant);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const instantSeconds = Math.floor(utcInstant.getTime() / 1_000) * 1_000;
  return (localAsUtc - instantSeconds) / 60_000;
}

function parseDate(date: string): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new RangeError(`Invalid calendar date: ${date}`);
  const parsed: [number, number, number] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ];
  const normalized = new Date(Date.UTC(parsed[0], parsed[1] - 1, parsed[2]));
  if (
    normalized.getUTCFullYear() !== parsed[0] ||
    normalized.getUTCMonth() !== parsed[1] - 1 ||
    normalized.getUTCDate() !== parsed[2]
  ) {
    throw new RangeError(`Invalid calendar date: ${date}`);
  }
  return parsed;
}

function parseTime(time: string): [number, number] {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) throw new RangeError(`Invalid wall-clock time: ${time}`);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new RangeError(`Invalid wall-clock time: ${time}`);
  }
  return [hour, minute];
}

function utcBasic(instant: Date): string {
  return instant
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function localToUtcBasic(
  tzid: string,
  date: string,
  time: string,
): string {
  const [year, month, day] = parseDate(date);
  const [hour, minute] = parseTime(time);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    offsets.add(
      getUtcOffsetMinutes(tzid, new Date(wallClockAsUtc + hours * 3_600_000)),
    );
  }
  const matches = [...offsets]
    .map((offset) => new Date(wallClockAsUtc - offset * 60_000))
    .filter((instant) => {
      const parts = wallClockParts(tzid, instant);
      return (
        parts.year === year &&
        parts.month === month &&
        parts.day === day &&
        parts.hour === hour &&
        parts.minute === minute
      );
    })
    .sort((left, right) => left.getTime() - right.getTime());
  if (matches.length === 0) {
    throw new RangeError(
      `The local time ${date} ${time} does not exist in ${tzid}`,
    );
  }
  return utcBasic(matches[0]);
}

export function toBasicDate(date: string): string {
  parseDate(date);
  return date.replace(/-/g, "");
}

export function toBasicDateTime(date: string, time: string): string {
  parseTime(time);
  return `${toBasicDate(date)}T${time.replace(":", "")}00`;
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = parseDate(date);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

const ICAL_WEEKDAYS: Record<Weekday, string> = {
  MONDAY: "MO",
  TUESDAY: "TU",
  WEDNESDAY: "WE",
  THURSDAY: "TH",
  FRIDAY: "FR",
  SATURDAY: "SA",
  SUNDAY: "SU",
};

export function weekdayToIcalCode(weekday: Weekday): string {
  return ICAL_WEEKDAYS[weekday];
}

export function buildWeeklyRrule({
  weekday,
  endsOn,
  startTime,
  tzid,
}: {
  weekday: Weekday;
  endsOn: string;
  startTime: string;
  tzid: string;
}): string {
  return `FREQ=WEEKLY;BYDAY=${weekdayToIcalCode(weekday)};UNTIL=${localToUtcBasic(tzid, endsOn, startTime)}`;
}

function offsetToIcal(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(offsetMinutes);
  return `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}${String(absolute % 60).padStart(2, "0")}`;
}

function transitionLocalBasic(instantMs: number, offsetBefore: number): string {
  const local = new Date(instantMs + offsetBefore * 60_000);
  return local.toISOString().replace(/[-:]/g, "").slice(0, 15);
}

interface OffsetTransition {
  instantMs: number;
  from: number;
  to: number;
}

function findTransition(
  tzid: string,
  lowerMs: number,
  upperMs: number,
  from: number,
): OffsetTransition {
  let lowMinute = Math.floor(lowerMs / 60_000);
  let highMinute = Math.ceil(upperMs / 60_000);

  while (lowMinute + 1 < highMinute) {
    const middle = Math.floor((lowMinute + highMinute) / 2);
    if (getUtcOffsetMinutes(tzid, new Date(middle * 60_000)) === from) {
      lowMinute = middle;
    } else {
      highMinute = middle;
    }
  }

  const instantMs = highMinute * 60_000;
  return {
    instantMs,
    from,
    to: getUtcOffsetMinutes(tzid, new Date(instantMs)),
  };
}

export function buildVTimezone(
  tzid: string,
  fromYear: number,
  toYear: number,
): string[] {
  if (toYear < fromYear) {
    throw new RangeError("VTIMEZONE end year must not precede its start year");
  }

  const rangeStart = Date.UTC(fromYear, 0, 1);
  const rangeEnd = Date.UTC(toYear + 1, 0, 1);
  const transitions: OffsetTransition[] = [];
  let previousMs = rangeStart;
  let previousOffset = getUtcOffsetMinutes(tzid, new Date(previousMs));

  for (
    let scanMs = rangeStart + 24 * 60 * 60_000;
    scanMs <= rangeEnd;
    scanMs += 24 * 60 * 60_000
  ) {
    const offset = getUtcOffsetMinutes(tzid, new Date(scanMs));
    if (offset !== previousOffset) {
      const transition = findTransition(
        tzid,
        previousMs,
        scanMs,
        previousOffset,
      );
      transitions.push(transition);
      previousOffset = transition.to;
    }
    previousMs = scanMs;
  }

  const lines = ["BEGIN:VTIMEZONE", `TZID:${tzid}`];
  if (transitions.length === 0) {
    const offset = getUtcOffsetMinutes(tzid, new Date(rangeStart));
    lines.push(
      "BEGIN:STANDARD",
      `DTSTART:${fromYear}0101T000000`,
      `TZOFFSETFROM:${offsetToIcal(offset)}`,
      `TZOFFSETTO:${offsetToIcal(offset)}`,
      "END:STANDARD",
    );
  } else {
    for (const transition of transitions) {
      const component =
        transition.to > transition.from ? "DAYLIGHT" : "STANDARD";
      lines.push(
        `BEGIN:${component}`,
        `DTSTART:${transitionLocalBasic(transition.instantMs, transition.from)}`,
        `TZOFFSETFROM:${offsetToIcal(transition.from)}`,
        `TZOFFSETTO:${offsetToIcal(transition.to)}`,
        `END:${component}`,
      );
    }
  }
  lines.push("END:VTIMEZONE");
  return lines;
}
