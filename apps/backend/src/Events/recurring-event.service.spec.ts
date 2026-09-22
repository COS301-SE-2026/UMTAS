import {
  EventForRecurrence,
  RecurringEventService,
} from './recurring-event.service';
import type { EventDto } from './dto/EventDto.dto';
import { EventCriteria, EventSource } from './dto/event.types';

describe('RecurringEventService', () => {
  let service: RecurringEventService;

  beforeEach(() => {
    service = new RecurringEventService();
  });

  const recurringEvent = (
    dayOfWeek: NonNullable<EventDto['eventCriteria']['dayOfWeek']>,
  ): EventForRecurrence => ({
    eventId: 'event-1',
    eventCriteria: {
      eventSource: EventSource.UNIVERSITY,
      dayOfWeek,
      startTime: '08:30',
      endTime: '10:20',
    },
    isRecurring: true,
  });

  const nonRecurringEvent = (date: string): EventForRecurrence => ({
    eventId: 'event-2',
    eventCriteria: {
      eventSource: EventSource.UNIVERSITY,
      date,
      startTime: '08:30',
      endTime: '10:20',
    },
    isRecurring: false,
  });

  describe('Test_occursOnDate', () => {
    const event = recurringEvent('monday');

    it('should return false when requestedDate is invalid', () => {
      //Arrange
      jest.spyOn(service as any, 'validateDate').mockReturnValue(false);

      //Act
      const result = service.occursOnDate(event, 'bad-date');

      //Assert
      expect(result).toBe(false);
    });

    it('should delegate to recurringEventOccursOnDate for recurring events', () => {
      //Arrange
      jest.spyOn(service as any, 'validateDate').mockReturnValue(true);
      const spy = jest
        .spyOn(service as any, 'recurringEventOccursOnDate')
        .mockReturnValue(true);

      //Act
      const result = service.occursOnDate(event, '2026-09-21');

      //Assert
      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledWith(event.eventCriteria, '2026-09-21');
    });

    it('should compare date directly for non-recurring events', () => {
      //Arrange
      jest.spyOn(service as any, 'validateDate').mockReturnValue(true);
      const nonRecurring = nonRecurringEvent('2026-09-16');

      //Act
      const result = service.occursOnDate(nonRecurring, '2026-09-16');

      //Assert
      expect(result).toBe(true);
    });

    it('should return false for non-recurring events on a different date', () => {
      //Arrange
      jest.spyOn(service as any, 'validateDate').mockReturnValue(true);
      const nonRecurring = nonRecurringEvent('2025-09-16');

      //Act
      const result = service.occursOnDate(nonRecurring, '2026-09-17');

      //Assert
      expect(result).toBe(false);
    });
  }); //END_Test_occursOnDate

  describe('Test_resolveOccurrenceOnDate', () => {
    const event = recurringEvent('monday');

    it('should return null when occursOnDate is false', () => {
      //Arrange
      jest.spyOn(service, 'occursOnDate').mockReturnValue(false);

      //Act
      const result = service.resolveOccurrenceOnDate(event, '2026-09-16');

      //Assert
      expect(result).toBeNull();
    });

    it('should return the occurrence when occursOnDate is true', () => {
      //Arrange
      jest.spyOn(service, 'occursOnDate').mockReturnValue(true);

      //Act
      const result = service.resolveOccurrenceOnDate(event, '2026-09-16');

      //Assert
      expect(result).toEqual({
        eventId: 'event-1',
        occurrenceDate: '2026-09-16',
      });
    });
  }); //END_Test_resolveOccurrenceOnDate

  describe('Test_resolveNextOccurrence', () => {
    it('should return null when fromDate is invalid', () => {
      //Arrange
      jest.spyOn(service as any, 'validateDate').mockReturnValue(false);
      const event = recurringEvent('monday');

      //Act
      const result = service.resolveNextOccurrence(event, 'bad-date');

      //Assert
      expect(result).toBeNull();
    });

    it('should delegate to resolveNextRecurringOccurrence for recurring events', () => {
      //Arrange
      jest.spyOn(service as any, 'validateDate').mockReturnValue(true);
      const spy = jest
        .spyOn(service as any, 'resolveNextRecurringOccurrence')
        .mockReturnValue({ eventId: 'event-1', occurrenceDate: '2026-09-21' });
      const event = recurringEvent('monday');

      //Act
      const result = service.resolveNextOccurrence(event, '2026-09-16');

      //Assert
      expect(result).toEqual({
        eventId: 'event-1',
        occurrenceDate: '2026-09-21',
      });
      expect(spy).toHaveBeenCalledWith(
        'event-1',
        event.eventCriteria,
        '2026-09-16',
      );
    });

    it('should return null when non-recurring event has no date', () => {
      //Arrange
      jest.spyOn(service as any, 'validateDate').mockReturnValue(true);
      const event = {
        eventId: 'event-2',
        eventCriteria: { eventSource: EventSource.UNIVERSITY },
        isRecurring: false,
      } as any;

      //Act
      const result = service.resolveNextOccurrence(event, '2026-09-16');

      //Assert
      expect(result).toBeNull();
    });

    it('should return null when non-recurring event has an invalid date', () => {
      //Arrange
      jest
        .spyOn(service as any, 'validateDate')
        .mockReturnValueOnce(true) // fromDate passes
        .mockReturnValueOnce(false); // criteria.date fails
      const event = nonRecurringEvent('bad-date');

      //Act
      const result = service.resolveNextOccurrence(event, '2026-09-16');

      //Assert
      expect(result).toBeNull();
    });

    it('should return null when the event date is before fromDate', () => {
      //Arrange
      jest.spyOn(service as any, 'validateDate').mockReturnValue(true);
      const event = nonRecurringEvent('2026-09-15');

      //Act
      const result = service.resolveNextOccurrence(event, '2026-09-16');

      //Assert
      expect(result).toBeNull();
    });

    it('should return the event date when on or after fromDate', () => {
      //Arrange
      jest.spyOn(service as any, 'validateDate').mockReturnValue(true);
      const event = nonRecurringEvent('2026-09-20');

      //Act
      const result = service.resolveNextOccurrence(event, '2026-09-16');

      //Assert
      expect(result).toEqual({
        eventId: 'event-2',
        occurrenceDate: '2026-09-20',
      });
    });
  }); //END_Test_resolveNextOccurrence

  //Helpers
  describe('Test_recurringEventOccursOnDate', () => {
    const baseCriteria: EventCriteria = {
      eventSource: EventSource.UNIVERSITY,
      dayOfWeek: 'monday',
      startTime: '08:30',
      endTime: '10:20',
    };

    it('should return false when criteria has a date', () => {
      //Arrange
      const criteria = { ...baseCriteria, date: '2026-09-21' };

      //Act
      const result = (service as any).recurringEventOccursOnDate(
        criteria,
        '2026-09-21',
      );

      //Assert
      expect(result).toBe(false);
    });

    it('should return false when dayOfWeek is missing', () => {
      //Arrange
      const criteria = { ...baseCriteria, dayOfWeek: undefined };

      //Act
      const result = (service as any).recurringEventOccursOnDate(
        criteria,
        '2026-09-21',
      );

      //Assert
      expect(result).toBe(false);
    });

    it('should return false when dayOfWeek is unknown', () => {
      //Arrange
      const criteria = { ...baseCriteria, dayOfWeek: 'funday' as any };

      //Act
      const result = (service as any).recurringEventOccursOnDate(
        criteria,
        '2026-09-21',
      );

      //Assert
      expect(result).toBe(false);
    });

    it('should return true when the weekday matches the date', () => {
      //Act
      const result = (service as any).recurringEventOccursOnDate(
        baseCriteria,
        '2026-09-21',
      );

      //Assert
      expect(result).toBe(true);
    });

    it('should return false when the weekday does not match the date', () => {
      //Act
      const result = (service as any).recurringEventOccursOnDate(
        baseCriteria,
        '2026-09-23',
      );

      //Assert
      expect(result).toBe(false);
    });
  }); //END_Test_recurringEventOccursOnDate

  describe('Test_resolveNextRecurringOccurrence', () => {
    const baseCriteria: EventCriteria = {
      eventSource: EventSource.UNIVERSITY,
      dayOfWeek: 'monday',
      startTime: '08:30',
      endTime: '10:20',
    };

    it('should return null when criteria has a date', () => {
      //Arrange
      const criteria = { ...baseCriteria, date: '2026-09-21' };

      //Act
      const result = (service as any).resolveNextRecurringOccurrence(
        'event-1',
        criteria,
        '2026-09-16',
      );

      //Assert
      expect(result).toBeNull();
    });

    it('should return null when dayOfWeek is missing', () => {
      //Arrange
      const criteria = { ...baseCriteria, dayOfWeek: undefined };

      //Act
      const result = (service as any).resolveNextRecurringOccurrence(
        'event-1',
        criteria,
        '2026-09-16',
      );

      //Assert
      expect(result).toBeNull();
    });

    it('should return null when dayOfWeek is unknown', () => {
      //Arrange
      const criteria = { ...baseCriteria, dayOfWeek: 'funday' as any };

      //Act
      const result = (service as any).resolveNextRecurringOccurrence(
        'event-1',
        criteria,
        '2026-09-16',
      );

      //Assert
      expect(result).toBeNull();
    });

    it('should return the current date when the weekday matches', () => {
      //Arrange
      const criteria = { ...baseCriteria, dayOfWeek: 'wednesday' as const };

      //Act
      const result = (service as any).resolveNextRecurringOccurrence(
        'event-1',
        criteria,
        '2026-09-16',
      );

      //Assert
      expect(result).toEqual({
        eventId: 'event-1',
        occurrenceDate: '2026-09-16',
      });
    });

    it('should return the next matching weekday', () => {
      //Act
      const result = (service as any).resolveNextRecurringOccurrence(
        'event-1',
        baseCriteria,
        '2026-09-16',
      );

      //Assert
      expect(result).toEqual({
        eventId: 'event-1',
        occurrenceDate: '2026-09-21',
      });
    });
  }); //END_Test_resolveNextRecurringOccurrence

  describe('Test_isValidDateOnly', () => {
    it('should return false when pattern does not match', () => {
      //Act
      const result = (service as any).validateDate('not-a-date');

      //Assert
      expect(result).toBe(false);
    });

    it('should return false for an invalid calendar date', () => {
      //Act
      const result = (service as any).validateDate('2026-02-30');

      //Assert
      expect(result).toBe(false);
    });

    it('should return true for a valid date', () => {
      //Act
      const result = (service as any).validateDate('2026-09-21');

      //Assert
      expect(result).toBe(true);
    });
  }); //END_Test_isValidDateOnly
}); //END_RecurringEventService
