import { randomUUID } from 'crypto';
import {
  EventAttendance,
  AttendanceState,
  AttendanceStateType,
} from '../../entities';
import { CreateAttendanceDto } from '../../Attendance/dto/attendance.dto';

const DATE: string = '2026-01-02';
const STATE: AttendanceStateType = AttendanceState[0];

type Attendance = typeof EventAttendance.$inferSelect;

export function createAttendance(
  overrides: Partial<Attendance> = {},
): Attendance {
  return {
    AttendanceID: randomUUID(),
    eventID: randomUUID(),
    UserID: randomUUID(),
    eventDate: DATE,
    state: STATE,

    ...overrides,
  };
} //END_createAttendance

export function createAttendanceDto(
  overrides: Partial<CreateAttendanceDto> = {},
): CreateAttendanceDto {
  return {
    eventID: randomUUID(),
    eventDate: DATE,
    state: STATE,

    ...overrides,
  };
} //END_createAttendanceDto
