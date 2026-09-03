import { EventSource } from '../Events/dto/event.types';
import {
  createAcademicCalendar,
  createCalendarRestriction,
} from '../Testing/Factories';
import {
  AcademicCalendarGenerationService,
  type CalendarSourceEvent,
} from './academic-calendar-generation.service';

describe('AcademicCalendarGenerationService', () => {
  const calendar = createAcademicCalendar({ year: 2026 });
  const restrictions = [
    createCalendarRestriction({
      id: 'semester-1-start',
      type: 'SEMESTER_1_START',
      startDate: '2026-02-09',
      endDate: '2026-02-09',
    }),
    createCalendarRestriction({
      id: 'semester-1-end',
      type: 'SEMESTER_1_END',
      startDate: '2026-06-12',
      endDate: '2026-06-12',
    }),
    createCalendarRestriction({
      id: 'semester-2-start',
      type: 'SEMESTER_2_START',
      startDate: '2026-07-20',
      endDate: '2026-07-20',
    }),
    createCalendarRestriction({
      id: 'semester-2-end',
      type: 'SEMESTER_2_END',
      startDate: '2026-11-06',
      endDate: '2026-11-06',
    }),
  ];

  const sourceEvent = (
    overrides: Partial<CalendarSourceEvent> = {},
  ): CalendarSourceEvent => ({
    id: 'event-1',
    name: 'Lecture',
    activityCode: ' L1 ',
    activityType: 'lecture',
    criteria: {
      eventSource: EventSource.UNIVERSITY,
      dayOfWeek: 'monday',
      startTime: '08:30',
      endTime: '09:20',
    },
    isRecurring: true,
    moduleId: 'module-1',
    moduleCode: 'COS301',
    moduleName: ' Software Engineering ',
    semester: 'SEMESTER_1',
    moduleColour: '#123456',
    venues: ['Room B', 'Room A'],
    ...overrides,
  });

  it('produces deterministic text fields', () => {
    const service = new AcademicCalendarGenerationService();

    const payload = service.build(calendar, 'Timetable', restrictions, [
      sourceEvent(),
    ]);

    expect(payload.recurringEvents[0]).toMatchObject({
      title: 'COS301 Lecture',
      description: 'Software Engineering - L1',
      location: 'Room A, Room B',
    });
  });

  it('does not duplicate a module code already present in the event name', () => {
    const service = new AcademicCalendarGenerationService();

    const payload = service.build(calendar, 'Timetable', restrictions, [
      sourceEvent({ name: 'COS301 L2' }),
    ]);

    expect(payload.recurringEvents[0].title).toBe('COS301 L2');
  });

  it('warns and omits malformed time ranges', () => {
    const service = new AcademicCalendarGenerationService();

    const payload = service.build(calendar, null, restrictions, [
      sourceEvent({
        criteria: {
          eventSource: EventSource.UNIVERSITY,
          dayOfWeek: 'monday',
          startTime: '10:00',
          endTime: '09:00',
        },
      }),
    ]);

    expect(payload.recurringEvents).toEqual([]);
    expect(payload.warnings).toEqual([
      expect.objectContaining({ code: 'RECURRING_EVENT_CRITERIA_INVALID' }),
    ]);
  });

  it('omits one-off events outside the academic calendar year', () => {
    const service = new AcademicCalendarGenerationService();

    const payload = service.build(calendar, null, restrictions, [
      sourceEvent({
        isRecurring: false,
        criteria: {
          eventSource: EventSource.UNIVERSITY,
          date: '2027-01-10',
          startTime: '10:00',
          endTime: '11:00',
        },
      }),
    ]);

    expect(payload.oneOffEvents).toEqual([]);
    expect(payload.warnings).toEqual([
      expect.objectContaining({ code: 'ONE_OFF_EVENT_OUTSIDE_CALENDAR' }),
    ]);
  });
});
