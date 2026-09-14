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

  it('should handle summer gaps and day swaps for recurring events', () => {
    const service = new AcademicCalendarGenerationService();
    const daySwap = createCalendarRestriction({
      id: 'day-swap-1',
      type: 'DAY_SWAP',
      startDate: '2026-03-16',
      endDate: '2026-03-16',
      replacementWeekday: 'TUESDAY',
    });

    const payload = service.build(
      calendar,
      'Timetable',
      [...restrictions, daySwap],
      [
        sourceEvent({
          criteria: {
            eventSource: EventSource.UNIVERSITY,
            dayOfWeek: 'monday',
            startTime: '08:30',
            endTime: '09:20',
          },
        }),
      ],
    );

    expect(payload.recurringEvents[0].excludedDates).toContain('2026-03-16');
  });

  it('should exclude summer gaps and skip day swaps outside the semester', () => {
    const service = new AcademicCalendarGenerationService();
    const inRangeDaySwap = createCalendarRestriction({
      id: 'day-swap-in-range',
      type: 'DAY_SWAP',
      startDate: '2026-03-16',
      endDate: '2026-03-16',
      replacementWeekday: 'TUESDAY',
    });
    const outsideRangeDaySwap = createCalendarRestriction({
      id: 'day-swap-outside-range',
      type: 'DAY_SWAP',
      startDate: '2026-12-01',
      endDate: '2026-12-01',
      replacementWeekday: 'TUESDAY',
    });

    const payload = service.build(
      calendar,
      'Timetable',
      [...restrictions, inRangeDaySwap, outsideRangeDaySwap],
      [
        sourceEvent({
          semester: 'YEAR',
          criteria: {
            eventSource: EventSource.UNIVERSITY,
            dayOfWeek: 'monday',
            startTime: '08:30',
            endTime: '09:20',
          },
        }),
      ],
    );

    expect(payload.recurringEvents[0].excludedDates).toContain('2026-06-15');
  });

  it('should exclude a day swap occurring on the event weekday', () => {
    const service = new AcademicCalendarGenerationService();
    const daySwap = createCalendarRestriction({
      id: 'day-swap-same-weekday',
      type: 'DAY_SWAP',
      startDate: '2026-03-16',
      endDate: '2026-03-16',
      replacementWeekday: 'TUESDAY',
    });

    const payload = service.build(
      calendar,
      'Timetable',
      [...restrictions, daySwap],
      [
        sourceEvent({
          criteria: {
            eventSource: EventSource.UNIVERSITY,
            dayOfWeek: 'monday',
            startTime: '08:30',
            endTime: '09:20',
          },
        }),
      ],
    );

    expect(payload.recurringEvents[0].excludedDates).toContain('2026-03-16');
  });

  it('should sort recurring and one-off events deterministically', () => {
    const service = new AcademicCalendarGenerationService();

    const payload = service.build(calendar, '  ', restrictions, [
      sourceEvent({
        id: 'event-2',
      }),
      sourceEvent({
        id: 'event-1',
      }),
      sourceEvent({
        id: 'event-4',
        isRecurring: false,
        criteria: {
          eventSource: EventSource.UNIVERSITY,
          date: '2026-03-12',
          startTime: '10:00',
          endTime: '11:00',
        },
      }),
      sourceEvent({
        id: 'event-3',
        isRecurring: false,
        criteria: {
          eventSource: EventSource.UNIVERSITY,
          date: '2026-03-12',
          startTime: '09:00',
          endTime: '10:00',
        },
      }),
    ]);

    expect(payload.name).toBe('Academic Calendar 2026');
    expect(payload.recurringEvents.map((event) => event.key)).toEqual([
      'event-event-1',
      'event-event-2',
    ]);
    expect(payload.oneOffEvents.map((event) => event.key)).toEqual([
      'event-event-3',
      'event-event-4',
    ]);
  });

  it('does not duplicate a module code already present in the event name', () => {
    const service = new AcademicCalendarGenerationService();

    const payload = service.build(calendar, 'Timetable', restrictions, [
      sourceEvent({ name: 'COS301 L2' }),
    ]);

    expect(payload.recurringEvents[0].title).toBe('COS301 L2');
  });

  it('should reject overlapping semester boundaries', () => {
    const service = new AcademicCalendarGenerationService();
    const invalidRestrictions = restrictions.map((restriction) => {
      if (restriction.type === 'SEMESTER_2_START') {
        return {
          ...restriction,
          startDate: '2026-06-01',
          endDate: '2026-06-01',
        };
      }

      return restriction;
    });

    expect(() =>
      service.build(calendar, 'Timetable', invalidRestrictions, []),
    ).toThrow(
      'Academic calendar semester boundaries overlap or are out of order',
    );
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

  it('should sort multiple warnings deterministically', () => {
    const service = new AcademicCalendarGenerationService();

    const payload = service.build(calendar, null, restrictions, [
      sourceEvent({
        id: 'event-b',
        criteria: {
          eventSource: EventSource.UNIVERSITY,
          dayOfWeek: 'monday',
          startTime: '10:00',
          endTime: '09:00',
        },
      }),
      sourceEvent({
        id: 'event-a',
        criteria: {
          eventSource: EventSource.UNIVERSITY,
          dayOfWeek: 'monday',
          startTime: '12:00',
          endTime: '11:00',
        },
      }),
    ]);

    expect(payload.recurringEvents).toEqual([]);
    expect(payload.warnings).toHaveLength(2);
    expect(payload.warnings[0].sourceId).toBe('event-a');
    expect(payload.warnings[1].sourceId).toBe('event-b');
  });

  it('should warn and omit a recurring event outside its semester', () => {
    const service = new AcademicCalendarGenerationService();
    const invalidSemesterRestrictions = restrictions.map((restriction) => {
      if (restriction.type === 'SEMESTER_1_START') {
        return {
          ...restriction,
          startDate: '2026-02-10',
        };
      }

      if (restriction.type === 'SEMESTER_1_END') {
        return {
          ...restriction,
          startDate: '2026-02-10',
          endDate: '2026-02-10',
        };
      }

      return restriction;
    });

    const payload = service.build(calendar, null, invalidSemesterRestrictions, [
      sourceEvent({
        semester: 'SEMESTER_1',
        criteria: {
          eventSource: EventSource.UNIVERSITY,
          dayOfWeek: 'monday',
          startTime: '08:30',
          endTime: '09:20',
        },
      }),
    ]);

    expect(payload.recurringEvents).toEqual([]);
    expect(payload.warnings).toEqual([
      expect.objectContaining({
        code: 'RECURRING_EVENT_OUTSIDE_SEMESTER',
      }),
    ]);
  });

  it('should omit invalid one-off event criteria', () => {
    const service = new AcademicCalendarGenerationService();

    const payload = service.build(calendar, null, restrictions, [
      sourceEvent({
        isRecurring: false,
        criteria: {
          eventSource: EventSource.UNIVERSITY,
          date: '2026-02-30',
          startTime: '10:00',
          endTime: '11:00',
        },
      }),
    ]);

    expect(payload.oneOffEvents).toEqual([]);
    expect(payload.warnings).toEqual([
      expect.objectContaining({
        code: 'ONE_OFF_EVENT_CRITERIA_INVALID',
      }),
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
