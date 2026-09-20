//Service to test
import {
  BuildTransitionOptions,
  StudentRoutingService,
} from './student-routing.service';

//Actual services
import { DatabaseService } from 'src/db/database.service';
import { recommendedRouteVariantOptions, RouteService } from './route.service';

//Mock services and db
import { createMockDatabase, mockDbResult } from 'src/Testing/Mocks';
import * as mockServiceFactory from 'src/Testing/Mocks/services';

//Factories
import {
  createEventContext,
  createStudentEventRow,
} from 'src/Testing/Factories';

//Exceptions
import { BadRequestException, NotFoundException } from '@nestjs/common';

// idk just imports man
import { Test } from '@nestjs/testing';
import { RouteHelperService } from './route.helper.service';

describe('StudentRoutingService', () => {
  let service: StudentRoutingService;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockRouteService, reset: resetRoute } =
    mockServiceFactory.createMockRouteService();
  const { mockRouteHelperService, reset: resetRouteHelper } =
    mockServiceFactory.createMockRouteHelperService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StudentRoutingService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: RouteService, useValue: mockRouteService },
        { provide: RouteHelperService, useValue: mockRouteHelperService },
      ],
    }).compile();

    service = module.get(StudentRoutingService);
  });

  afterEach(() => {
    resetDb();
    resetRoute();
    resetRouteHelper();

    jest.clearAllMocks();
  });

  //Tests
  describe('Test_getRoutesForDate', () => {
    it('should return empty events and routes when no events found', async () => {
      //Arrange
      jest
        .spyOn(mockRouteHelperService, 'getStudentEventsForDate')
        .mockResolvedValue([]);

      //Act
      const result = await service.getRoutesForDate('user-1', 'uni-1', {
        date: '2026-09-16',
      });

      //Assert
      expect(result).toEqual({
        date: '2026-09-16',
        events: [],
        routes: [],
      });
    });

    it('should return one event context with no routes when only one event', async () => {
      //Arrange
      const event = createStudentEventRow();
      const context = createEventContext({ eventId: 'event-1' });
      jest
        .spyOn(mockRouteHelperService, 'getStudentEventsForDate')
        .mockResolvedValue([event]);
      jest
        .spyOn(mockRouteHelperService, 'toEventContext')
        .mockReturnValue(context);

      //Act
      const result = await service.getRoutesForDate('user-1', 'uni-1', {
        date: '2026-09-16',
      });

      //Assert
      expect(result.events).toEqual([context]);
      expect(result.routes).toEqual([]);
    });

    it('should build one transition per adjacent pair of events', async () => {
      //Arrange
      const e1 = createStudentEventRow({ eventId: 'event-1' });
      const e2 = createStudentEventRow({ eventId: 'event-2' });
      const c1 = createEventContext({ eventId: 'event-1' });
      const c2 = createEventContext({ eventId: 'event-2' });
      const transition = { originEvent: c1, destinationEvent: c2 } as any;

      jest
        .spyOn(mockRouteHelperService, 'getStudentEventsForDate')
        .mockResolvedValue([e1, e2]);
      jest
        .spyOn(mockRouteHelperService, 'toEventContext')
        .mockReturnValueOnce(c1)
        .mockReturnValueOnce(c2);
      jest
        .spyOn(mockRouteHelperService, 'compareEventContexts')
        .mockReturnValue(0);
      const buildSpy = jest
        .spyOn(service as any, 'buildTransition')
        .mockResolvedValue(transition);

      //Act
      const result = await service.getRoutesForDate('user-1', 'uni-1', {
        date: '2026-09-16',
      });

      //Assert
      expect(result.events).toEqual([c1, c2]);
      expect(result.routes).toEqual([transition]);
      expect(buildSpy).toHaveBeenCalledTimes(1);
    });
  }); //END_Test_getRoutesForDate

  describe('Test_getAlternativeRouteBetweenEvents', () => {
    const baseQuery = {
      originEventId: 'event-1',
      destinationEventId: 'event-2',
      date: '2026-09-16',
      routeIndex: 0,
    };

    it('should throw BadRequestException when origin equals destination', async () => {
      //Arrange
      const query = { ...baseQuery, destinationEventId: 'event-1' };

      //Act + Assert
      await expect(
        service.getAlternativeRouteBetweenEvents('user-1', 'uni-1', query),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when either event has no building', async () => {
      //Arrange
      jest
        .spyOn(service as any, 'getStudentEventForDate')
        .mockResolvedValue(createStudentEventRow());
      jest
        .spyOn(mockRouteHelperService, 'toEventContext')
        .mockReturnValueOnce(createEventContext({ buildingId: 'building-1' }))
        .mockReturnValueOnce(createEventContext({ buildingId: null }));

      //Act + Assert
      await expect(
        service.getAlternativeRouteBetweenEvents('user-1', 'uni-1', baseQuery),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when both events are in the same building', async () => {
      //Arrange
      jest
        .spyOn(service as any, 'getStudentEventForDate')
        .mockResolvedValue(createStudentEventRow());
      jest
        .spyOn(mockRouteHelperService, 'toEventContext')
        .mockReturnValue(createEventContext({ buildingId: 'building-1' }));

      //Act + Assert
      await expect(
        service.getAlternativeRouteBetweenEvents('user-1', 'uni-1', baseQuery),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return the alternative route with isRecommended true for index 0', async () => {
      //Arrange
      const originContext = createEventContext({ buildingId: 'building-1' });
      const destinationContext = createEventContext({
        buildingId: 'building-2',
      });
      const route = { pathCoordinates: [[28.2, -25.7]], distanceMetres: 250 };

      jest
        .spyOn(service as any, 'getStudentEventForDate')
        .mockResolvedValue(createStudentEventRow());
      jest
        .spyOn(mockRouteHelperService, 'toEventContext')
        .mockReturnValueOnce(originContext)
        .mockReturnValueOnce(destinationContext);
      jest
        .spyOn(mockRouteService, 'getRouteVariant')
        .mockResolvedValue(route as any);

      //Act
      const result = await service.getAlternativeRouteBetweenEvents(
        'user-1',
        'uni-1',
        baseQuery,
      );

      //Assert
      expect(result).toEqual({
        date: '2026-09-16',
        originEventId: 'event-1',
        destinationEventId: 'event-2',
        originBuildingId: 'building-1',
        destinationBuildingId: 'building-2',
        route: {
          routeIndex: 0,
          pathCoordinates: [[28.2, -25.7]],
          distanceMetres: 250,
          isRecommended: true,
        },
      });
    });

    it('should set isRecommended false for a non-zero route index', async () => {
      //Arrange
      const query = { ...baseQuery, routeIndex: 2 };
      const originContext = createEventContext({ buildingId: 'building-1' });
      const destinationContext = createEventContext({
        buildingId: 'building-2',
      });
      const route = { pathCoordinates: [], distanceMetres: 0 };

      jest
        .spyOn(service as any, 'getStudentEventForDate')
        .mockResolvedValue(createStudentEventRow());
      jest
        .spyOn(mockRouteHelperService, 'toEventContext')
        .mockReturnValueOnce(originContext)
        .mockReturnValueOnce(destinationContext);
      jest
        .spyOn(mockRouteService, 'getRouteVariant')
        .mockResolvedValue(route as any);

      //Act
      const result = await service.getAlternativeRouteBetweenEvents(
        'user-1',
        'uni-1',
        query,
      );

      //Assert
      expect(result.route.isRecommended).toBe(false);
    });
  }); //END_Test_getAlternativeRouteBetweenEvents

  //Helpers
  describe('Test_buildTransition', () => {
    it('should return a no-route placeholder when either event has no building', async () => {
      //Arrange
      const origin = createEventContext({ buildingId: 'building-1' });
      const destination = createEventContext({ buildingId: null });

      const requestOptions: BuildTransitionOptions = {
        uniId: 'uni-1',
        originEvent: origin,
        destinationEvent: destination,
        tx: mockDb,
      };

      //Act
      const result = await (service as any).buildTransition(requestOptions);

      //Assert
      expect(result).toEqual({
        originEvent: origin,
        destinationEvent: destination,
        sameBuilding: false,
        route: null,
        reason: 'One or both events have no building assigned',
      });
    });

    it('should return sameBuilding with null route when buildings match', async () => {
      //Arrange
      const origin = createEventContext({ buildingId: 'building-1' });
      const destination = createEventContext({ buildingId: 'building-1' });

      const requestOptions: BuildTransitionOptions = {
        uniId: 'uni-1',
        originEvent: origin,
        destinationEvent: destination,
        tx: mockDb,
      };

      //Act
      const result = await (service as any).buildTransition(requestOptions);

      //Assert
      expect(result).toEqual({
        originEvent: origin,
        destinationEvent: destination,
        sameBuilding: true,
        route: null,
      });
    });

    it('should fetch a route and return the transition when buildings differ', async () => {
      //Arrange
      const origin = createEventContext({ buildingId: 'building-1' });
      const destination = createEventContext({ buildingId: 'building-2' });
      const route = { pathCoordinates: [], distanceMetres: 0 };
      jest
        .spyOn(mockRouteService, 'getRecommendedRouteVariant')
        .mockResolvedValue(route as any);

      const requestOptions: BuildTransitionOptions = {
        uniId: 'uni-1',
        originEvent: origin,
        destinationEvent: destination,
        tx: mockDb,
      };

      const getRecommendedRouteVariantOptions: recommendedRouteVariantOptions =
        {
          originBuildingId: 'building-1',
          destinationBuildingId: 'building-2',
          startAtIndex: 0,
          tx: mockDb,
          uniId: 'uni-1',
        };

      //Act
      const result = await (service as any).buildTransition(requestOptions);

      //Assert
      expect(result).toEqual({
        originEvent: origin,
        destinationEvent: destination,
        sameBuilding: false,
        route,
      });
      expect(mockRouteService.getRecommendedRouteVariant).toHaveBeenCalledWith(
        getRecommendedRouteVariantOptions,
      );
    });
  }); //END_Test_buildTransition

  describe('Test_getStudentEventForDate', () => {
    it('should return the event when found', async () => {
      //Arrange
      const row = createStudentEventRow({ eventId: 'event-1' });
      mockDbResult(mockDb.select, [row]);
      jest
        .spyOn(mockRouteHelperService, 'selectFirstVenuePerEvent')
        .mockReturnValue([row]);

      //Act
      const result = await (service as any).getStudentEventForDate(
        'user-1',
        'uni-1',
        'event-1',
        '2026-09-16',
        mockDb,
      );

      //Assert
      expect(result).toBe(row);
    });

    it('should throw NotFoundException when no event is found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);
      jest
        .spyOn(mockRouteHelperService, 'selectFirstVenuePerEvent')
        .mockReturnValue([]);

      //Act + Assert
      await expect(
        (service as any).getStudentEventForDate(
          'user-1',
          'uni-1',
          'event-1',
          '2026-09-16',
          mockDb,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  }); //END_Test_getStudentEventForDate
}); //END_StudentRoutingService
