import {
  attendanceAvailable,
  currentOccurrence,
  localDateAt,
  occurrenceOnLocalDate,
} from './attendance-occurrence';
import { EventSource } from '../Events/dto/event.types';

describe('attendance event occurrences', () => {
  const timeZone = 'Africa/Johannesburg';
  const datedEvent = {
    isRecurring: false,
    eventCriteria: {
      eventSource: EventSource.UNIVERSITY,
      date: '2026-09-17',
      startTime: '08:00',
      endTime: '10:00',
    },
  };

  it('resolves local schedule times to UTC for a dated event', () => {
    const occurrence = occurrenceOnLocalDate(
      datedEvent,
      '2026-09-17',
      timeZone,
    );

    expect(occurrence?.scheduledStartAt.toISOString()).toBe(
      '2026-09-17T06:00:00.000Z',
    );
    expect(occurrence?.scheduledEndAt.toISOString()).toBe(
      '2026-09-17T08:00:00.000Z',
    );
  });

  it('matches a recurring event only on its local weekday', () => {
    const recurringEvent = {
      isRecurring: true,
      eventCriteria: {
        eventSource: EventSource.UNIVERSITY,
        dayOfWeek: 'thursday' as const,
        startTime: '08:00',
        endTime: '10:00',
      },
    };

    expect(
      occurrenceOnLocalDate(recurringEvent, '2026-09-17', timeZone),
    ).not.toBeNull();
    expect(
      occurrenceOnLocalDate(recurringEvent, '2026-09-18', timeZone),
    ).toBeNull();
  });

  it('treats the scheduled end as exclusive when resolving the current event', () => {
    const atStart = new Date('2026-09-17T06:00:00.000Z');
    const beforeEnd = new Date('2026-09-17T07:59:59.999Z');
    const atEnd = new Date('2026-09-17T08:00:00.000Z');

    expect(currentOccurrence(datedEvent, atStart, timeZone)).not.toBeNull();
    expect(currentOccurrence(datedEvent, beforeEnd, timeZone)).not.toBeNull();
    expect(currentOccurrence(datedEvent, atEnd, timeZone)).toBeNull();
    expect(localDateAt(atStart, timeZone)).toBe('2026-09-17');
  });

  it('allows attendance for ten minutes before and after the event', () => {
    const occurrence = {
      scheduledStartAt: new Date('2026-09-17T06:00:00.000Z'),
      scheduledEndAt: new Date('2026-09-17T08:00:00.000Z'),
    };

    expect(
      attendanceAvailable(occurrence, new Date('2026-09-17T05:50:00.000Z')),
    ).toBe(true);
    expect(
      attendanceAvailable(occurrence, new Date('2026-09-17T08:09:59.999Z')),
    ).toBe(true);
    expect(
      attendanceAvailable(occurrence, new Date('2026-09-17T08:10:00.000Z')),
    ).toBe(false);
  });
});
