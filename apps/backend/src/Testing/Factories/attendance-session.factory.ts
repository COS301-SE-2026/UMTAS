import { randomUUID } from 'node:crypto';
import { AttendanceSession, SessionAttendance } from '../../entities';
import type { CreateAttendanceSessionDto } from '../../Attendance/dto/attendance-session.dto';

type Session = typeof AttendanceSession.$inferSelect;
type Attendance = typeof SessionAttendance.$inferSelect;

const start = new Date('2026-09-15T08:00:00.000Z');
const end = new Date('2026-09-15T10:00:00.000Z');

export function createAttendanceSession(
  overrides: Partial<Session> = {},
): Session {
  return {
    SessionID: randomUUID(),
    eventID: randomUUID(),
    scheduledStartAt: start,
    scheduledEndAt: end,
    createdAt: start,
    updatedAt: start,
    ...overrides,
  };
}

export function createAttendanceSessionDto(
  overrides: Partial<CreateAttendanceSessionDto> = {},
): CreateAttendanceSessionDto {
  return {
    eventID: randomUUID(),
    scheduledStartAt: start.toISOString(),
    scheduledEndAt: end.toISOString(),
    ...overrides,
  };
}

export function createSessionAttendance(
  overrides: Partial<Attendance> = {},
): Attendance {
  return {
    AttendanceID: randomUUID(),
    SessionID: randomUUID(),
    UserID: randomUUID(),
    guestCount: null,
    captureMethod: 'MANUAL',
    recordedAt: start,
    updatedAt: start,
    ...overrides,
  };
}
