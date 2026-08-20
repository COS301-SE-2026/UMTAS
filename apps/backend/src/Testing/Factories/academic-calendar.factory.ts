import { randomUUID } from 'crypto';
import {
  AcademicCalendar,
  CalendarRestriction,
  GeneratedCalendar,
} from '../../entities';

type AcademicCalendarRecord = typeof AcademicCalendar.$inferSelect;
type CalendarRestrictionRecord = typeof CalendarRestriction.$inferSelect;
type GeneratedCalendarRecord = typeof GeneratedCalendar.$inferSelect;

export function createAcademicCalendar(
  overrides: Partial<AcademicCalendarRecord> = {},
): AcademicCalendarRecord {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: randomUUID(),
    universityId: randomUUID(),
    name: null,
    year: 2026,
    subscriptions: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createCalendarRestriction(
  overrides: Partial<CalendarRestrictionRecord> = {},
): CalendarRestrictionRecord {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: randomUUID(),
    academicCalendarId: randomUUID(),
    type: 'PUBLIC_HOLIDAY',
    startDate: '2026-04-27',
    endDate: '2026-04-27',
    description: 'Freedom Day',
    replacementWeekday: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createGeneratedCalendar(
  overrides: Partial<GeneratedCalendarRecord> = {},
): GeneratedCalendarRecord {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: randomUUID(),
    academicCalendarId: randomUUID(),
    timetableId: randomUUID(),
    payload: {
      name: 'Generated calendar',
      year: 2026,
      recurringEvents: [],
      oneOffEvents: [],
      allDayEvents: [],
      warnings: [],
    },
    createdAt: now,
    ...overrides,
  };
}
