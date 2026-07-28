import { randomUUID } from 'node:crypto';
import { Timetable } from '../../entities';

export function createTimetable(
  overrides: Partial<typeof Timetable.$inferInsert> = {},
): typeof Timetable.$inferInsert {
  return {
    timetableID: randomUUID(),
    timetableName: 'Integration Timetable',
    ...overrides,
  };
}
