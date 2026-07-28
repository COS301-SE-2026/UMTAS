import { randomUUID } from 'node:crypto';
import {
  EventVenue,
  EventsToTimetables,
  ModuleEnrollment,
  UniversityEvent,
  UniversityRole,
  UserTimetable,
} from '../../entities';

export function createUniversityRole(
  overrides: Partial<typeof UniversityRole.$inferInsert> = {},
): typeof UniversityRole.$inferInsert {
  return {
    UserID: randomUUID(),
    UniversityID: randomUUID(),
    role: 'STUDENT',
    ...overrides,
  };
}

export function createModuleEnrollment(
  overrides: Partial<typeof ModuleEnrollment.$inferInsert> = {},
): typeof ModuleEnrollment.$inferInsert {
  return {
    UserID: randomUUID(),
    ModuleID: randomUUID(),
    ...overrides,
  };
}

export function createUniversityEventRecord(
  overrides: Partial<typeof UniversityEvent.$inferInsert> = {},
): typeof UniversityEvent.$inferInsert {
  return {
    UniversityEventID: randomUUID(),
    moduleID: randomUUID(),
    eventID: randomUUID(),
    ...overrides,
  };
}

export function createEventVenueRecord(
  overrides: Partial<typeof EventVenue.$inferInsert> = {},
): typeof EventVenue.$inferInsert {
  return {
    EventID: randomUUID(),
    VenueID: randomUUID(),
    ...overrides,
  };
}

export function createUserTimetable(
  overrides: Partial<typeof UserTimetable.$inferInsert> = {},
): typeof UserTimetable.$inferInsert {
  return {
    UserTimetableID: randomUUID(),
    UserID: randomUUID(),
    TimetableID: randomUUID(),
    ...overrides,
  };
}

export function createEventToTimetable(
  overrides: Partial<typeof EventsToTimetables.$inferInsert> = {},
): typeof EventsToTimetables.$inferInsert {
  return {
    eventID: randomUUID(),
    timetableID: randomUUID(),
    ...overrides,
  };
}
