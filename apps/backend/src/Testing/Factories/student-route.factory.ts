import { randomUUID } from 'crypto';
import { EventCriteria } from 'src/Events/dto/event.types';
import { RouteEventContextDto } from 'src/Route/dto/route.dto';
import { StudentEventRow } from 'src/Route/student-routing.service';

export function createStudentEventRow(
  overrides: Partial<StudentEventRow> = {},
): StudentEventRow {
  return {
    eventId: randomUUID(),
    eventName: 'Sample Event',
    eventCriteria: {
      dayOfWeek: 'monday',
      startTime: '08:00',
      endTime: '09:00',
    } as EventCriteria,
    isRecurring: true,
    venueId: null,
    buildingId: null,

    ...overrides,
  };
} //END_createStudentEventRow

export function createEventContext(
  overrides: Partial<RouteEventContextDto> = {},
): RouteEventContextDto {
  return {
    eventId: randomUUID(),
    eventName: 'COS 301 Lecture',
    occurrenceDate: '2026-09-16',
    startTime: '08:30',
    endTime: '10:20',
    venueId: null,
    buildingId: null,

    ...overrides,
  };
} //END_createEventContext
