import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { RouteStopService } from './route.stop.service';
import { DatabaseService } from 'src/db/database.service';
import { RouteHelperService } from './route.helper.service';
import { RouteService } from './route.service';

import { createMockDatabase, mockTransaction } from 'src/Testing/Mocks';
import {
  createMockRouteHelperService,
  createMockRouteService,
} from 'src/Testing/Mocks/services';
import { uniId } from 'src/Testing/constants';
import {
  createEventContext,
  createRouteDto,
  createStopRouteQueryDto,
  createStudentEventRow,
} from 'src/Testing/Factories';

describe('RouteStopService', () => {
  let service: RouteStopService;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockRouteHelperService, reset: resetRouteHelper } =
    createMockRouteHelperService();
  const { mockRouteService, reset: resetRouteService } =
    createMockRouteService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RouteStopService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: RouteHelperService, useValue: mockRouteHelperService },
        { provide: RouteService, useValue: mockRouteService },
      ],
    }).compile();

    service = module.get(RouteStopService);
  });

  afterEach(() => {
    resetDb();
    resetRouteHelper();
    resetRouteService();
    jest.restoreAllMocks();
  });

  // Tests
  describe('Test_getRouteViaBuilding', () => {
    const userId = 'user-1';

    it('should throw NotFoundException when no events exist for the date', async () => {
      //Arrange
      const query = createStopRouteQueryDto();
      jest
        .spyOn(mockRouteHelperService, 'getStudentEventsForDate')
        .mockResolvedValue([]);
      mockTransaction(mockDb, {});

      //Act + Assert
      await expect(
        service.getRouteViaBuilding(userId, uniId, query),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return a TO_STOP leg when only previous event exists', async () => {
      //Arrange
      const query = createStopRouteQueryDto({
        time: '08:30',
        buildingId: 'stop-building',
      });
      const previous = createEventContext({
        buildingId: 'building-1',
        startTime: '08:00',
        endTime: '09:00',
      });
      const event = createStudentEventRow();
      const route = createRouteDto();

      jest
        .spyOn(mockRouteHelperService, 'getStudentEventsForDate')
        .mockResolvedValue([event]);
      jest
        .spyOn(mockRouteHelperService, 'toEventContext')
        .mockReturnValue(previous);
      jest
        .spyOn(mockRouteHelperService, 'compareEventContexts')
        .mockReturnValue(0);
      jest.spyOn(service as any, 'selectStopWindow').mockReturnValue({
        previousEvent: previous,
        nextEvent: null,
        description: 'test',
      });
      jest
        .spyOn(service as any, 'getRouteBetweenBuildings')
        .mockResolvedValue(route);
      mockTransaction(mockDb, {});

      //Act
      const result = await service.getRouteViaBuilding(userId, uniId, query);

      //Assert
      expect(result.legs).toHaveLength(1);
      expect(result.legs[0]).toEqual({
        direction: 'TO_STOP',
        originEvent: previous,
        destinationEvent: null,
        route,
      });
    });

    it('should return a FROM_STOP leg when only next event exists', async () => {
      //Arrange
      const query = createStopRouteQueryDto({
        time: '08:30',
        buildingId: 'stop-building',
      });
      const next = createEventContext({
        buildingId: 'building-2',
        startTime: '09:30',
        endTime: '10:30',
      });
      const event = createStudentEventRow();
      const route = createRouteDto();

      jest
        .spyOn(mockRouteHelperService, 'getStudentEventsForDate')
        .mockResolvedValue([event]);
      jest
        .spyOn(mockRouteHelperService, 'toEventContext')
        .mockReturnValue(next);
      jest
        .spyOn(mockRouteHelperService, 'compareEventContexts')
        .mockReturnValue(0);
      jest.spyOn(service as any, 'selectStopWindow').mockReturnValue({
        previousEvent: null,
        nextEvent: next,
        description: 'test',
      });
      jest
        .spyOn(service as any, 'getRouteBetweenBuildings')
        .mockResolvedValue(route);
      mockTransaction(mockDb, {});

      //Act
      const result = await service.getRouteViaBuilding(userId, uniId, query);

      //Assert
      expect(result.legs).toHaveLength(1);
      expect(result.legs[0]).toEqual({
        direction: 'FROM_STOP',
        originEvent: null,
        destinationEvent: next,
        route,
      });
    });

    it('should return both legs when window has previous and next events', async () => {
      //Arrange
      const query = createStopRouteQueryDto({
        time: '08:30',
        buildingId: 'stop-building',
      });
      const previous = createEventContext({ buildingId: 'building-1' });
      const next = createEventContext({ buildingId: 'building-2' });
      const event = createStudentEventRow();
      const route = createRouteDto();

      jest
        .spyOn(mockRouteHelperService, 'getStudentEventsForDate')
        .mockResolvedValue([event]);
      jest
        .spyOn(mockRouteHelperService, 'toEventContext')
        .mockReturnValue(previous);
      jest
        .spyOn(mockRouteHelperService, 'compareEventContexts')
        .mockReturnValue(0);
      jest.spyOn(service as any, 'selectStopWindow').mockReturnValue({
        previousEvent: previous,
        nextEvent: next,
        description: 'test',
      });
      jest
        .spyOn(service as any, 'getRouteBetweenBuildings')
        .mockResolvedValue(route);
      mockTransaction(mockDb, {});

      //Act
      const result = await service.getRouteViaBuilding(userId, uniId, query);

      //Assert
      expect(result.legs).toHaveLength(2);
      expect(result.legs[0].direction).toBe('TO_STOP');
      expect(result.legs[1].direction).toBe('FROM_STOP');
    });

    it('should throw NotFoundException when neither leg can be built', async () => {
      //Arrange
      const query = createStopRouteQueryDto();
      const event = createStudentEventRow();

      jest
        .spyOn(mockRouteHelperService, 'getStudentEventsForDate')
        .mockResolvedValue([event]);
      jest
        .spyOn(mockRouteHelperService, 'toEventContext')
        .mockReturnValue(createEventContext());
      jest
        .spyOn(mockRouteHelperService, 'compareEventContexts')
        .mockReturnValue(0);
      jest.spyOn(service as any, 'selectStopWindow').mockReturnValue({
        previousEvent: null,
        nextEvent: null,
        description: 'test',
      });
      mockTransaction(mockDb, {});

      //Act + Assert
      await expect(
        service.getRouteViaBuilding(userId, uniId, query),
      ).rejects.toThrow(NotFoundException);
    });
  }); //END_Test_getRouteViaBuilding

  //Helpers
  describe('Test_selectStopWindow', () => {
    it('should delegate to selectWindowAtTime when time provided', () => {
      //Arrange
      const events = [createEventContext()];
      const spy = jest
        .spyOn(service as any, 'selectWindowAtTime')
        .mockReturnValue({
          previousEvent: null,
          nextEvent: null,
          description: '',
        });

      //Act
      (service as any).selectStopWindow(events, '08:30');

      //Assert
      expect(spy).toHaveBeenCalledWith(events, '08:30');
    });

    it('should delegate to selectLargestGapWindow when time absent', () => {
      //Arrange
      const events = [createEventContext()];
      const spy = jest
        .spyOn(service as any, 'selectLargestGapWindow')
        .mockReturnValue({
          previousEvent: null,
          nextEvent: null,
          description: '',
        });

      //Act
      (service as any).selectStopWindow(events);

      //Assert
      expect(spy).toHaveBeenCalledWith(events);
    });
  }); //END_Test_selectStopWindow

  describe('Test_selectWindowAtTime', () => {
    it('should return the current event as previous with next when time is inside an event', () => {
      //Arrange
      const current = createEventContext({
        eventId: 'event-1',
        startTime: '08:00',
        endTime: '09:00',
      });
      const next = createEventContext({
        eventId: 'event-2',
        startTime: '10:00',
        endTime: '11:00',
      });

      //Act
      const result = (service as any).selectWindowAtTime(
        [current, next],
        '08:30',
      );

      //Assert
      expect(result).toEqual({
        previousEvent: current,
        nextEvent: next,
        description: '09:00-10:00',
      });
    });

    it('should return only the current event when it is the last one', () => {
      //Arrange
      const current = createEventContext({
        startTime: '08:00',
        endTime: '09:00',
      });

      //Act
      const result = (service as any).selectWindowAtTime([current], '08:30');

      //Assert
      expect(result).toEqual({
        previousEvent: current,
        nextEvent: null,
        description: 'after-09:00',
      });
    });

    it('should return before-first window when time precedes all events', () => {
      //Arrange
      const first = createEventContext({
        startTime: '09:00',
        endTime: '10:00',
      });
      const second = createEventContext({
        startTime: '11:00',
        endTime: '12:00',
      });

      //Act
      const result = (service as any).selectWindowAtTime(
        [first, second],
        '08:00',
      );

      //Assert
      expect(result).toEqual({
        previousEvent: null,
        nextEvent: first,
        description: 'before-09:00',
      });
    });

    it('should return after-last window when time follows all events', () => {
      //Arrange
      const first = createEventContext({
        startTime: '09:00',
        endTime: '10:00',
      });
      const last = createEventContext({ startTime: '11:00', endTime: '12:00' });

      //Act
      const result = (service as any).selectWindowAtTime(
        [first, last],
        '13:00',
      );

      //Assert
      expect(result).toEqual({
        previousEvent: last,
        nextEvent: null,
        description: 'after-12:00',
      });
    });

    it('should return the pair around a gap when time falls between two events', () => {
      //Arrange
      const first = createEventContext({
        startTime: '09:00',
        endTime: '10:00',
      });
      const second = createEventContext({
        startTime: '12:00',
        endTime: '13:00',
      });

      //Act
      const result = (service as any).selectWindowAtTime(
        [first, second],
        '11:00',
      );

      //Assert
      expect(result).toEqual({
        previousEvent: first,
        nextEvent: second,
        description: '10:00-12:00',
      });
    });
  }); //END_Test_selectWindowAtTime

  describe('Test_selectLargestGapWindow', () => {
    it('should return after-window when only one event exists', () => {
      //Arrange
      const only = createEventContext({ startTime: '08:00', endTime: '09:00' });

      //Act
      const result = (service as any).selectLargestGapWindow([only]);

      //Assert
      expect(result).toEqual({
        previousEvent: only,
        nextEvent: null,
        description: 'after-09:00',
      });
    });

    it('should pick the pair with the largest gap', () => {
      //Arrange
      const a = createEventContext({ startTime: '08:00', endTime: '09:00' });
      const b = createEventContext({ startTime: '09:30', endTime: '10:30' });
      const c = createEventContext({ startTime: '14:00', endTime: '15:00' });

      //Act
      const result = (service as any).selectLargestGapWindow([a, b, c]);

      //Assert
      expect(result).toEqual({
        previousEvent: b,
        nextEvent: c,
        description: '10:30-14:00',
      });
    });
  }); //END_Test_selectLargestGapWindow

  describe('Test_getRouteBetweenBuildings', () => {
    it('should return null when either building ID is missing', async () => {
      //Act
      const result = await (service as any).getRouteBetweenBuildings(
        uniId,
        null,
        'building-2',
        mockDb,
      );

      //Assert
      expect(result).toBeNull();
      expect(
        mockRouteService.getRecommendedRouteVariant,
      ).not.toHaveBeenCalled();
    });

    it('should return null when origin equals destination', async () => {
      //Act
      const result = await (service as any).getRouteBetweenBuildings(
        uniId,
        'building-1',
        'building-1',
        mockDb,
      );

      //Assert
      expect(result).toBeNull();
      expect(
        mockRouteService.getRecommendedRouteVariant,
      ).not.toHaveBeenCalled();
    });

    it('should delegate to routeService when buildings are valid and different', async () => {
      //Arrange
      const route = createRouteDto();
      jest
        .spyOn(mockRouteService, 'getRecommendedRouteVariant')
        .mockResolvedValue(route);

      //Act
      const result = await (service as any).getRouteBetweenBuildings(
        uniId,
        'building-1',
        'building-2',
        mockDb,
      );

      //Assert
      expect(result).toBe(route);
      expect(mockRouteService.getRecommendedRouteVariant).toHaveBeenCalledWith({
        uniId,
        originBuildingId: 'building-1',
        destinationBuildingId: 'building-2',
        startAtIndex: 0,
        tx: mockDb,
      });
    });
  }); //END_Test_getRouteBetweenBuildings
}); //END_RouteStopService
