import { randomUUID } from 'node:crypto';
import { AttendanceOperatorPreference } from '../../entities';

type AttendancePreference = typeof AttendanceOperatorPreference.$inferSelect;

export function createAttendancePreference(
  overrides: Partial<AttendancePreference> = {},
): AttendancePreference {
  const now = new Date('2026-09-15T08:00:00.000Z');
  return {
    ownerUserId: randomUUID(),
    universityId: randomUUID(),
    preferredEventId: randomUUID(),
    selectedAt: now,
    updatedAt: now,
    ...overrides,
  };
}
