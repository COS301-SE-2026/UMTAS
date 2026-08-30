import {
  buildingId,
  destinationBuildingId,
  uniId,
  userId,
} from 'src/Testing/constants';
import { RouteService } from './route.service';
import {
  createMockDatabase,
  mockDbResult,
  mockSequentialResults,
} from 'src/Testing/Mocks';
import { Test } from '@nestjs/testing';
import { DatabaseService } from 'src/db/database.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createRoute } from 'src/Testing/Factories/route.factory';
import { createBuilding } from 'src/Testing/Factories/building.factory';
import { SessionData } from 'src/auth/session.decorator';
import { ActiveRouteStatus } from './dto/route.dto';
import { createEvent } from 'src/Testing/Factories/event.factory';
import { EventSource } from 'src/Events/dto/event.types';

const mockSession = {
  user: { id: userId },
  uniId,
  session: {},
} as SessionData;

describe('RouteService', () => {
  let routeService: RouteService;
  const { mockDb, reset: resetDb } = createMockDatabase();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RouteService,
        { provide: DatabaseService, useValue: { db: mockDb } },
      ],
    }).compile();

    routeService = module.get(RouteService);
    process.env.ORS_API_KEY = 'test-key';
  });

  afterEach(() => {
    resetDb();
    jest.restoreAllMocks();
  });

  describe('Test_getOrCreateRoute', () => {
    it('should throw BadRequestException if origin === destination', async () => {
      await expect(
        routeService.getOrCreateRoute(mockSession, buildingId, buildingId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return a cached route without calling ORS', async () => {
      const route = createRoute({
        OriginBuildingID: buildingId,
        DestinationBuildingID: destinationBuildingId,
      });

      //tracks all calls for getOrCreate... hence a spy
      const jamesBond = jest.spyOn(global, 'fetch');
      mockDbResult(mockDb.select, [route]);
      const result = await routeService.getOrCreateRoute(
        mockSession,
        buildingId,
        destinationBuildingId,
      );

      expect(result.route).toMatchObject({
        routeId: route.RouteID,
        originBuildingId: buildingId,
        destinationBuildingId: destinationBuildingId,
      });
      expect(jamesBond).not.toHaveBeenCalled();
    });
  });

  it('should return reversed route when only the normal route is cached', async () => {
    const reverseRoute = createRoute({
      OriginBuildingID: destinationBuildingId,
      DestinationBuildingID: buildingId,
      PathCoordinates: [
        { lat: 6, lng: 7 },
        { lat: 7, lng: 8 },
      ],
    });

    mockSequentialResults(mockDb.select, [[], [reverseRoute]]);

    const result = await routeService.getOrCreateRoute(
      mockSession,
      buildingId,
      destinationBuildingId,
    );

    expect(result.route.originBuildingId).toBe(buildingId);
    expect(result.route.destinationBuildingId).toBe(destinationBuildingId);
    expect(result.route.pathCoordinates).toEqual([
      { lat: 7, lng: 8 },
      { lat: 6, lng: 7 },
    ]);
  });

  it('should throw NotFoundException if either building has no coords', async () => {
    const originBuilding = createBuilding({
      BuildingID: buildingId,
      Latitude: null,
    });
    const destinationBuilding = createBuilding({
      BuildingID: destinationBuildingId,
    });

    mockSequentialResults(mockDb.select, [
      [],
      [],
      [originBuilding],
      [destinationBuilding],
    ]);

    await expect(
      routeService.getOrCreateRoute(
        mockSession,
        buildingId,
        destinationBuildingId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw InternalServerErrorException if ORS does not respond ok', async () => {
    const originBuilding = createBuilding({
      BuildingID: buildingId,
    });
    const destinationBuilding = createBuilding({
      BuildingID: destinationBuildingId,
    });

    mockSequentialResults(mockDb.select, [
      [],
      [],
      [originBuilding],
      [destinationBuilding],
    ]);
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: false, statusText: 'Bad Gateway' } as Response);

    await expect(
      routeService.getOrCreateRoute(
        mockSession,
        buildingId,
        destinationBuildingId,
      ),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw NotFoundException if ORS returns no route feature', async () => {
    const originBuilding = createBuilding({
      BuildingID: buildingId,
    });
    const destinationBuilding = createBuilding({
      BuildingID: destinationBuildingId,
    });

    mockSequentialResults(mockDb.select, [
      [],
      [],
      [originBuilding],
      [destinationBuilding],
    ]);
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => Promise.resolve({ features: [] }),
    } as Response);

    await expect(
      routeService.getOrCreateRoute(
        mockSession,
        buildingId,
        destinationBuildingId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  describe('Test_getActiveRoute', () => {
    it('should return NONE if the student has no planned attended lectures on that day', async () => {
      mockDbResult(mockDb.select, []);

      const result = await routeService.getActiveRoute(
        mockSession,
        '2026-10-12',
        '10:12',
      );

      expect(result).toEqual({ status: ActiveRouteStatus.NONE });
    });

    it('should return AT_VENUE when an attended event falls between the start and end time', async () => {
      const event = createEvent(
        EventSource.UNIVERSITY,
        {},
        { startTime: '08:30', endTime: '09:20' },
      );

      mockSequentialResults(mockDb.select, [
        [
          {
            eventId: event.eventID,
            eventName: event.eventName,
            eventCriteria: event.eventCriteria,
          },
        ],
        [{ buildingId: buildingId }],
      ]);

      const result = await routeService.getActiveRoute(
        mockSession,
        '2026-10-12',
        '09:00',
      );

      expect(result.status).toBe(ActiveRouteStatus.AT_VENUE);
      expect(result.currentBuildingId).toBe(buildingId);
    });

    it('should skip an attended event if it has no venue', async () => {
      const event = createEvent(
        EventSource.UNIVERSITY,
        {},
        { startTime: '08:30', endTime: '09:20' },
      );

      mockSequentialResults(mockDb.select, [
        [
          {
            eventId: event.eventID,
            eventName: event.eventName,
            eventCriteria: event.eventCriteria,
          },
        ],
        [],
      ]);

      const result = await routeService.getActiveRoute(
        mockSession,
        '2026-10-12',
        '09:00',
      );

      expect(result).toEqual({ status: ActiveRouteStatus.NONE });
    });

    it('should return MOVING and call getOrCreateRoute between two events that are in different buildings', async () => {
      const eventLecture = createEvent(
        EventSource.UNIVERSITY,
        { eventName: 'COS332 L1' },
        { startTime: '08:30', endTime: '09:20' },
      );
      const eventPractical = createEvent(
        EventSource.UNIVERSITY,
        { eventName: 'COS332 P1' },
        { startTime: '09:30', endTime: '10:20' },
      );

      mockSequentialResults(mockDb.select, [
        [
          {
            eventId: eventLecture.eventID,
            eventName: eventLecture.eventName,
            eventCriteria: eventLecture.eventCriteria,
          },
          {
            eventId: eventPractical.eventID,
            eventName: eventPractical.eventName,
            eventCriteria: eventPractical.eventCriteria,
          },
        ],
        [{ buildingId: buildingId }],
        [{ buildingId: destinationBuildingId }],
      ]);

      const route = createRoute({
        OriginBuildingID: buildingId,
        DestinationBuildingID: destinationBuildingId,
      });
      jest.spyOn(routeService, 'getOrCreateRoute').mockResolvedValue({
        route: {
          routeId: route.RouteID,
          originBuildingId: buildingId,
          pathCoordinates: route.PathCoordinates,
          displayColour: route.DisplayColour,
          destinationBuildingId: destinationBuildingId,
          distanceMetres: route.DistanceMetres,
        },
      });

      const result = await routeService.getActiveRoute(
        mockSession,
        '2026-10-12',
        '09:25',
      );

      expect(result.status).toBe(ActiveRouteStatus.MOVING);
      expect(result.fromEventName).toBe('COS332 L1');
      expect(result.toEventName).toBe('COS332 P1');
      expect(routeService.getOrCreateRoute).toHaveBeenCalledWith(
        mockSession,
        buildingId,
        destinationBuildingId,
      );
    });

    it('should return AT_VENUE when the events share a venue', async () => {
      const eventLecture = createEvent(
        EventSource.UNIVERSITY,
        { eventName: 'COS332 L1' },
        { startTime: '08:30', endTime: '09:20' },
      );
      const eventPractical = createEvent(
        EventSource.UNIVERSITY,
        { eventName: 'COS332 P1' },
        { startTime: '09:30', endTime: '10:20' },
      );

      mockSequentialResults(mockDb.select, [
        [
          {
            eventId: eventLecture.eventID,
            eventName: eventLecture.eventName,
            eventCriteria: eventLecture.eventCriteria,
          },
          {
            eventId: eventPractical.eventID,
            eventName: eventPractical.eventName,
            eventCriteria: eventPractical.eventCriteria,
          },
        ],
        [{ buildingId: buildingId }],
        [{ buildingId: buildingId }],
      ]);

      const spyKids = jest.spyOn(routeService, 'getOrCreateRoute');

      const result = await routeService.getActiveRoute(
        mockSession,
        '2026-10-12',
        '09:25',
      );

      expect(result.status).toBe(ActiveRouteStatus.AT_VENUE);
      expect(result.currentBuildingId).toBe(buildingId);
      expect(spyKids).not.toHaveBeenCalled();
    });

    it('should return NONE if time is before first or after last attending event', async () => {
      const event = createEvent(
        EventSource.UNIVERSITY,
        {},
        { startTime: '08:30', endTime: '09:20' },
      );

      mockSequentialResults(mockDb.select, [
        [
          {
            eventId: event.eventID,
            eventName: event.eventName,
            eventCriteria: event.eventCriteria,
          },
        ],
        [{ buildingId: buildingId }],
      ]);

      const result = await routeService.getActiveRoute(
        mockSession,
        '2026-10-12',
        '23:23',
      );

      expect(result).toEqual({ status: ActiveRouteStatus.NONE });
    });
  });
});
