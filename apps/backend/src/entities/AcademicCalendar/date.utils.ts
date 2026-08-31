import type { Weekday } from './calendar.types';

const DAY_TO_INDEX: Record<Lowercase<Weekday>, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const WEEKDAYS: Weekday[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export function dateFromDomain(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function domainDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const current = dateFromDomain(date);
  return domainDate(new Date(current.getTime() + days * 86_400_000));
}

export function firstWeekdayOnOrAfter(
  date: string,
  day: Lowercase<Weekday>,
): string {
  const current = dateFromDomain(date);
  const delta = (DAY_TO_INDEX[day] - current.getUTCDay() + 7) % 7;
  return addDays(date, delta);
}

export function lastWeekdayOnOrBefore(
  date: string,
  day: Lowercase<Weekday>,
): string {
  const current = dateFromDomain(date);
  const delta = (current.getUTCDay() - DAY_TO_INDEX[day] + 7) % 7;
  return addDays(date, -delta);
}

export function weekdayForDate(date: string): Weekday {
  return WEEKDAYS[dateFromDomain(date).getUTCDay()];
}
