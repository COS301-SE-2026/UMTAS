//Service to test

//Actual services
import { RecurringEventService } from 'src/Events/recurring-event.service';

//Mock services and db
import { createMockDatabase, mockDbResult } from 'src/Testing/Mocks';
import * as mockServiceFactory from 'src/Testing/Mocks/services';

//Factories
import { createStudentEventRow } from 'src/Testing/Factories';

//Exceptions

// idk just imports man
import { Test } from '@nestjs/testing';
import { EventSource } from 'src/Events/dto/event.types';
import { RouteHelperService } from './route.helper.service';

describe('StudentRoutingService', () => {
  let service: RouteHelperService;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockRecurringEventService, reset: resetReccuringEventService } =
    mockServiceFactory.createMockRecurringEventService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RouteHelperService,
        { provide: RecurringEventService, useValue: mockRecurringEventService },
      ],
    }).compile();

    service = module.get(RouteHelperService);
  });

  afterEach(() => {
    resetReccuringEventService();
    resetDb();

    jest.clearAllMocks();
  });

  //Tests

  describe('Test_getStudentEventsForDate', () => {
    it('should map rows and delegate to selectFirstVenuePerEvent', async () => {
      //Arrange
      const row = createStudentEventRow({ eventId: 'event-1' });
      mockDbResult(mockDb.select, [row]);
      const spy = jest
        .spyOn(service, 'selectFirstVenuePerEvent')
        .mockReturnValue([row]);

      //Act
      const result = await (service as any).getStudentEventsForDate(
        'user-1',
        'uni-1',
        '2026-09-16',
        mockDb,
      );

      //Assert
      expect(result).toEqual([row]);
      expect(spy).toHaveBeenCalledWith(
        [expect.objectContaining({ eventId: 'event-1' })],
        '2026-09-16',
      );
    });
  }); //END_Test_getStudentEventsForDate

  describe('Test_selectFirstVenuePerEvent', () => {
    it('should return empty array when no events', () => {
      //Act
      const result = service.selectFirstVenuePerEvent([], '2026-09-16');

      //Assert
      expect(result).toEqual([]);
    });

    it('should skip events that do not occur on the date', () => {
      //Arrange
      jest
        .spyOn(mockRecurringEventService, 'occursOnDate')
        .mockReturnValue(false);
      const event = createStudentEventRow();

      //Act
      const result = service.selectFirstVenuePerEvent([event], '2026-09-16');

      //Assert
      expect(result).toEqual([]);
    });

    it('should keep the first occurrence per event ID', () => {
      //Arrange
      jest
        .spyOn(mockRecurringEventService, 'occursOnDate')
        .mockReturnValue(true);
      const first = createStudentEventRow({
        eventId: 'event-1',
        venueId: 'venue-1',
      });
      const duplicate = createStudentEventRow({
        eventId: 'event-1',
        venueId: 'venue-2',
      });

      //Act
      const result = service.selectFirstVenuePerEvent(
        [first, duplicate],
        '2026-09-16',
      );

      //Assert
      expect(result).toHaveLength(1);
      expect(result[0].venueId).toBe('venue-1');
    });
  }); //END_Test_selectFirstVenuePerEvent

  describe('Test_compareEventContexts', () => {
    it('should sort by startTime when start times differ', () => {
      //Arrange
      const l = { startTime: '08:00', eventId: 'event-2' } as any;
      const r = { startTime: '09:00', eventId: 'event-1' } as any;

      //Act
      const result = service.compareEventContexts(l, r);

      //Assert
      expect(result).toBeLessThan(0);
    });

    it('should sort by eventId when start times are equal', () => {
      //Arrange
      const l = { startTime: '08:00', eventId: 'event-1' } as any;
      const r = { startTime: '08:00', eventId: 'event-2' } as any;

      //Act
      const result = service.compareEventContexts(l, r);

      //Assert
      expect(result).toBeLessThan(0);
    });
  }); //END_Test_compareEventContexts

  describe('Test_toEventContext', () => {
    it('should map a student event row to a route event context', () => {
      //Arrange
      const event = {
        eventId: 'event-1',
        eventName: 'Networks Lecture',
        eventCriteria: {
          startTime: '08:30',
          endTime: '10:20',
          eventSource: EventSource.UNIVERSITY,
        },
        isRecurring: false,
        venueId: 'venue-1',
        buildingId: 'building-1',
      };

      //Act
      const result = service.toEventContext(event, '2026-09-16');

      //Assert
      expect(result).toEqual({
        eventId: 'event-1',
        eventName: 'Networks Lecture',
        occurrenceDate: '2026-09-16',
        startTime: '08:30',
        endTime: '10:20',
        venueId: 'venue-1',
        buildingId: 'building-1',
      });
    });
  }); //END_Test_toEventContext
}); //END_StudentRoutingService
