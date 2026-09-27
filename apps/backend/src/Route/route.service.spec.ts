import {
  buildingId,
  destinationBuildingId,
  routeId,
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
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  createRoute,
  createRouteDto,
} from 'src/Testing/Factories/route.factory';
import { ActiveRouteStatus } from './dto/route.dto';
import { createMockOrsService } from 'src/Testing/Mocks/services/ors.mock';
import { OrsService } from './ors.service';

describe('RouteService', () => {
  let service: RouteService;
  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockOrsService, reset: resetOrs } = createMockOrsService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RouteService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: OrsService, useValue: mockOrsService },
      ],
    }).compile();

    service = module.get(RouteService);
    process.env.ORS_API_KEY = 'test-key';
  });

  afterEach(() => {
    resetDb();
    resetOrs();
    jest.restoreAllMocks();
  });

  //Tests
  describe('Test_getById', () => {
    it('should throw NotFoundException when route not found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(service.getById(routeId)).rejects.toThrow(NotFoundException);
    });

    it('should return RouteSingleResponseDto for route found', async () => {
      //Arrange
      const route = createRoute();
      mockDbResult(mockDb.select, [route]);
      const routeDto = createRouteDto({
        routeId: route.RouteID,
        originBuildingId: route.OriginBuildingID,
        destinationBuildingId: route.DestinationBuildingID,
        routeIndex: route.RouteIndex,
        pathCoordinates: route.PathCoordinates,
        distanceMetres: route.DistanceMetres,
        displayColour: route.DisplayColour,
      });
      const expected = {
        route: routeDto,
      };

      //Act
      const result = await service.getById(route.RouteID);

      //Assert
      expect(result).toMatchObject(expected);
    });
  });

  describe('Test_getRouteVariant', () => {
    const origin = buildingId;
    const destination = destinationBuildingId;

    it('should throw BadRequestException when routeIndex is invalid', async () => {
      //Act + Assert
      await expect(
        service.getRouteVariant(uniId, origin, destination, -1),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getRouteVariant(uniId, origin, destination, 1.5),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when origin equals destination', async () => {
      //Act + Assert
      await expect(
        service.getRouteVariant(uniId, origin, origin, 0),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return the cached route when it exists', async () => {
      //Arrange
      const cached = createRoute();
      mockSequentialResults(mockDb.select, [[cached]]);

      //Act
      const result = await service.getRouteVariant(
        uniId,
        origin,
        destination,
        0,
      );

      //Assert
      expect(result.routeId).toBe(cached.RouteID);
    });

    it('should return the reversed route when only the reverse exists', async () => {
      //Arrange
      const reverse = createRoute({
        OriginBuildingID: destination,
        DestinationBuildingID: origin,
        PathCoordinates: [
          { lat: -25.7, lng: 28.2 },
          { lat: -25.8, lng: 28.3 },
        ],
      });
      mockSequentialResults(mockDb.select, [[], [reverse]]);

      //Act
      const result = await service.getRouteVariant(
        uniId,
        origin,
        destination,
        0,
      );

      //Assert
      expect(result.originBuildingId).toBe(origin);
      expect(result.destinationBuildingId).toBe(destination);
      expect(result.pathCoordinates).toEqual([
        { lat: -25.8, lng: 28.3 },
        { lat: -25.7, lng: 28.2 },
      ]);
    });

    it('should delegate to getOrCreateRoute when routeIndex is 0 and no cache exists', async () => {
      //Arrange
      mockSequentialResults(mockDb.select, [[], []]);
      const route = createRoute();
      const spy = jest
        .spyOn(service, 'getOrCreateRoute')
        .mockResolvedValue({ route: service['routeDtoAdapter'](route) });

      //Act
      const result = await service.getRouteVariant(
        uniId,
        origin,
        destination,
        0,
      );

      //Assert
      expect(spy).toHaveBeenCalledWith(uniId, origin, destination, mockDb);
      expect(result.routeId).toBe(route.RouteID);
    });

    it('should fetch ORS variants, persist them, and return the requested route', async () => {
      //Arrange
      const requested = createRoute({ RouteIndex: 1 });
      mockSequentialResults(mockDb.select, [
        [], // cached
        [], // reverse
        [requested], // requested route after persist
      ]);
      jest.spyOn(service as any, 'getBuildingsForRoute').mockResolvedValue({
        origin: { Latitude: -25.7, Longitude: 28.2 },
        destination: { Latitude: -25.8, Longitude: 28.3 },
      });
      mockOrsService.getWalkingRouteVariants?.mockResolvedValue([
        { routeIndex: 0, routeCoordinates: [], distanceMetres: 100 },
        { routeIndex: 1, routeCoordinates: [], distanceMetres: 120 },
      ]);
      jest.spyOn(service as any, 'persistRouteVariants').mockResolvedValue([]);

      //Act
      const result = await service.getRouteVariant(
        uniId,
        origin,
        destination,
        1,
      );

      //Assert
      expect(mockOrsService.getWalkingRouteVariants).toHaveBeenCalled();
      expect(result.routeIndex).toBe(1);
    });

    it('should throw NotFoundException when the requested variant is not available after persist', async () => {
      //Arrange
      mockSequentialResults(mockDb.select, [
        [],
        [],
        [], // requested route not found
      ]);
      jest.spyOn(service as any, 'getBuildingsForRoute').mockResolvedValue({
        origin: { Latitude: -25.7, Longitude: 28.2 },
        destination: { Latitude: -25.8, Longitude: 28.3 },
      });
      mockOrsService.getWalkingRouteVariants?.mockResolvedValue([]);
      jest.spyOn(service as any, 'persistRouteVariants').mockResolvedValue([]);

      //Act + Assert
      await expect(
        service.getRouteVariant(uniId, origin, destination, 2),
      ).rejects.toThrow(NotFoundException);
    });
  }); //END_Test_getRouteVariant

  describe('Test_getVariantOrNull', () => {
    const uniId = 'uni-1';
    const origin = 'building-1';
    const destination = 'building-2';
    const routeIndex = 0;

    it('should return null when getRouteVariant throws NotFoundException', async () => {
      //Arrange
      jest
        .spyOn(service, 'getRouteVariant')
        .mockRejectedValue(new NotFoundException());

      //Act
      const result = await service.getVariantOrNull(
        uniId,
        origin,
        destination,
        routeIndex,
        mockDb,
      );

      //Assert
      expect(result).toBeNull();
    });

    it('should return the route when getRouteVariant succeeds', async () => {
      //Arrange
      const route = createRouteDto();
      const spy = jest
        .spyOn(service, 'getRouteVariant')
        .mockResolvedValue(route);

      //Act
      const result = await service.getVariantOrNull(
        uniId,
        origin,
        destination,
        routeIndex,
        mockDb,
      );

      //Assert
      expect(result).toBe(route);
      expect(spy).toHaveBeenCalledWith(
        uniId,
        origin,
        destination,
        routeIndex,
        mockDb,
      );
    });
  }); //END_Test_getVariantOrNull

  describe('Test_getOrCreateRoute', () => {
    const origin = buildingId;
    const destination = destinationBuildingId;

    it('should throw BadRequestException when origin equals destination', async () => {
      //Act + Assert
      await expect(
        service.getOrCreateRoute(uniId, origin, origin),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return the direct route when it exists', async () => {
      //Arrange
      const direct = createRoute();
      mockSequentialResults(mockDb.select, [[direct]]);

      //Act
      const result = await service.getOrCreateRoute(uniId, origin, destination);

      //Assert
      expect(result.route.routeId).toBe(direct.RouteID);
      expect(mockDb.select).toHaveBeenCalledTimes(1);
    });

    it('should return the reversed route when only the reverse exists', async () => {
      //Arrange
      const reverse = createRoute({
        OriginBuildingID: destination,
        DestinationBuildingID: origin,
        PathCoordinates: [
          { lat: -25.7, lng: 28.2 },
          { lat: -25.8, lng: 28.3 },
        ],
      });
      mockSequentialResults(mockDb.select, [
        [], // direct lookup — none
        [reverse], // reverse lookup — found
      ]);

      //Act
      const result = await service.getOrCreateRoute(uniId, origin, destination);

      //Assert
      expect(result.route.originBuildingId).toBe(origin);
      expect(result.route.destinationBuildingId).toBe(destination);
      expect(result.route.pathCoordinates).toEqual([
        { lat: -25.8, lng: 28.3 },
        { lat: -25.7, lng: 28.2 },
      ]);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when buildings are missing or unpinned', async () => {
      //Arrange
      mockSequentialResults(mockDb.select, [
        [], // direct
        [], // reverse
        [{ buildingId: origin, latitude: null, longitude: null }], // origin unpinned
      ]);

      //Act + Assert
      await expect(
        service.getOrCreateRoute(uniId, origin, destination),
      ).rejects.toThrow(NotFoundException);
      expect(mockOrsService.getWalkingRoute).not.toHaveBeenCalled();
    });

    it('should call ORS and insert a new route when none exists', async () => {
      //Arrange
      const newRoute = createRoute();
      mockSequentialResults(mockDb.select, [
        [], // direct
        [], // reverse
        [
          { buildingId: origin, latitude: -25.7, longitude: 28.2 },
          { buildingId: destination, latitude: -25.8, longitude: 28.3 },
        ],
      ]);
      mockOrsService.getWalkingRoute?.mockResolvedValue({
        routeCoordinates: [{ lat: -25.7, lng: 28.2 }],
        distanceMetres: 120,
      });
      mockDbResult(mockDb.insert, [newRoute]);

      //Act
      const result = await service.getOrCreateRoute(uniId, origin, destination);

      //Assert
      expect(mockOrsService.getWalkingRoute).toHaveBeenCalledWith(
        { lat: -25.7, lng: 28.2 },
        { lat: -25.8, lng: 28.3 },
      );
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
      expect(result.route.routeId).toBe(newRoute.RouteID);
    });

    it('should throw NotFoundException when insert returns no row', async () => {
      //Arrange
      mockSequentialResults(mockDb.select, [
        [],
        [],
        [
          { buildingId: origin, latitude: -25.7, longitude: 28.2 },
          { buildingId: destination, latitude: -25.8, longitude: 28.3 },
        ],
      ]);
      mockOrsService.getWalkingRoute?.mockResolvedValue({
        routeCoordinates: [],
        distanceMetres: 0,
      });
      mockDbResult(mockDb.insert, []);

      //Act + Assert
      await expect(
        service.getOrCreateRoute(uniId, origin, destination),
      ).rejects.toThrow(NotFoundException);
    });
  }); //END_Test_getOrCreateRoute

  describe('Test_getActiveRoute', () => {
    const date = '2026-09-16';
    const time = '09:00';

    it('should return MOVING status when between two events', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        {
          eventId: 'event-1',
          eventName: 'Lecture A',
          eventCriteria: { startTime: '08:00', endTime: '08:50' },
        },
        {
          eventId: 'event-2',
          eventName: 'Lecture B',
          eventCriteria: { startTime: '09:30', endTime: '10:20' },
        },
      ]);
      jest
        .spyOn(service as any, 'getMatchingBuildingId')
        .mockResolvedValueOnce(buildingId)
        .mockResolvedValueOnce(destinationBuildingId);
      const route = createRoute();
      jest
        .spyOn(service, 'getOrCreateRoute')
        .mockResolvedValue({ route } as any);

      //Act
      const result = await service.getActiveRoute(userId, uniId, date, time);

      //Assert
      expect(result).toEqual({
        status: ActiveRouteStatus.MOVING,
        route,
        fromEventName: 'Lecture A',
        toEventName: 'Lecture B',
      });
    });

    it('should return AT_VENUE when both events are in the same building', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        {
          eventId: 'event-1',
          eventName: 'Lecture A',
          eventCriteria: { startTime: '08:00', endTime: '08:50' },
        },
        {
          eventId: 'event-2',
          eventName: 'Lecture B',
          eventCriteria: { startTime: '09:30', endTime: '10:20' },
        },
      ]);
      jest
        .spyOn(service as any, 'getMatchingBuildingId')
        .mockResolvedValue(buildingId);

      //Act
      const result = await service.getActiveRoute(userId, uniId, date, time);

      //Assert
      expect(result).toEqual({
        status: ActiveRouteStatus.AT_VENUE,
        currentBuildingId: buildingId,
      });
    });

    it('should return NONE when either event has no building', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        {
          eventId: 'event-1',
          eventName: 'Lecture A',
          eventCriteria: { startTime: '08:00', endTime: '08:50' },
        },
        {
          eventId: 'event-2',
          eventName: 'Lecture B',
          eventCriteria: { startTime: '09:30', endTime: '10:20' },
        },
      ]);
      jest
        .spyOn(service as any, 'getMatchingBuildingId')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(destinationBuildingId);

      //Act
      const result = await service.getActiveRoute(userId, uniId, date, time);

      //Assert
      expect(result).toEqual({ status: ActiveRouteStatus.NONE });
    });

    it('should return AT_VENUE when inside a single event', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        {
          eventId: 'event-1',
          eventName: 'Lecture A',
          eventCriteria: { startTime: '08:00', endTime: '10:00' },
        },
      ]);
      jest
        .spyOn(service as any, 'getMatchingBuildingId')
        .mockResolvedValue(buildingId);

      //Act
      const result = await service.getActiveRoute(userId, uniId, date, time);

      //Assert
      expect(result).toEqual({
        status: ActiveRouteStatus.AT_VENUE,
        currentBuildingId: buildingId,
        fromEventName: 'Lecture A',
      });
    });

    it('should return NONE when inside an event that has no building', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        {
          eventId: 'event-1',
          eventName: 'Lecture A',
          eventCriteria: { startTime: '08:00', endTime: '10:00' },
        },
      ]);
      jest
        .spyOn(service as any, 'getMatchingBuildingId')
        .mockResolvedValue(null);

      //Act
      const result = await service.getActiveRoute(userId, uniId, date, time);

      //Assert
      expect(result).toEqual({ status: ActiveRouteStatus.NONE });
    });

    it('should return NONE when no event matches the time', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        {
          eventId: 'event-1',
          eventName: 'Lecture A',
          eventCriteria: { startTime: '08:00', endTime: '08:50' },
        },
      ]);

      //Act
      const result = await service.getActiveRoute(userId, uniId, date, '12:00');

      //Assert
      expect(result).toEqual({ status: ActiveRouteStatus.NONE });
    });
  }); //END_Test_getActiveRoute

  describe('Test_getRecommendedRouteVariant', () => {
    const options = {
      uniId,
      originBuildingId: 'building-1',
      destinationBuildingId: 'building-2',
      startAtIndex: undefined as number | undefined,
      tx: mockDb,
    };

    it('should return the start route when no diversion target exists', async () => {
      //Arrange
      const startRoute = createRouteDto({ routeId: 'start-route' });
      const getVariantSpy = jest
        .spyOn(service, 'getRouteVariant')
        .mockResolvedValue(startRoute);
      jest.spyOn(service as any, 'getDiversionTarget').mockResolvedValue(null);

      //Act
      const result = await service.getRecommendedRouteVariant(options);

      //Assert
      expect(result).toBe(startRoute);
      expect(getVariantSpy).toHaveBeenCalledWith(
        uniId,
        'building-1',
        'building-2',
        0,
        mockDb,
      );
    });

    it('should recurse into the diverted route until the base case', async () => {
      //Arrange
      const startRoute = createRouteDto({
        routeId: 'start-route',
        routeIndex: 0,
      });
      const divertedRoute = createRouteDto({
        routeId: 'diverted-route',
        routeIndex: 1,
      });
      const finalRoute = createRouteDto({
        routeId: 'final-route',
        routeIndex: 2,
      });

      jest
        .spyOn(service, 'getRouteVariant')
        .mockResolvedValueOnce(startRoute)
        .mockResolvedValueOnce(finalRoute);
      jest
        .spyOn(service as any, 'getDiversionTarget')
        .mockResolvedValueOnce('diverted-route')
        .mockResolvedValueOnce(null);
      jest
        .spyOn(service, 'getById')
        .mockResolvedValueOnce({ route: divertedRoute });

      //Act
      const result = await service.getRecommendedRouteVariant({
        ...options,
        startAtIndex: 5,
      });

      //Assert
      expect(result).toBe(finalRoute);
      expect(service.getRouteVariant).toHaveBeenNthCalledWith(
        2,
        uniId,
        'building-1',
        'building-2',
        divertedRoute.routeIndex,
        mockDb,
      );
    });
  }); //END_Test_getRecommendedRouteVariant

  //Helpers
  describe('Test_routeDtoAdapter', () => {
    it('should map a route row to a route DTO', () => {
      //Arrange
      const row = createRoute();

      //Act
      const result = (service as any).routeDtoAdapter(row);

      //Assert
      expect(result).toEqual({
        routeId: row.RouteID,
        originBuildingId: row.OriginBuildingID,
        destinationBuildingId: row.DestinationBuildingID,
        routeIndex: row.RouteIndex,
        pathCoordinates: row.PathCoordinates,
        distanceMetres: row.DistanceMetres,
        displayColour: row.DisplayColour,
      });
    });
  }); //END_Test_routeDtoAdapter

  describe('Test_getMatchingBuildingId', () => {
    it('should return null when no venue is found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await (service as any).getMatchingBuildingId('event-1');

      //Assert
      expect(result).toBeNull();
    });

    it('should return the building ID when a venue is found', async () => {
      //Arrange
      mockDbResult(mockDb.select, [{ buildingId: buildingId }]);

      //Act
      const result = await (service as any).getMatchingBuildingId('event-1');

      //Assert
      expect(result).toBe(buildingId);
    });
  }); //END_Test_getMatchingBuildingId

  describe('Test_getBuildingsForRoute', () => {
    it('should throw NotFoundException when origin is missing', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        { buildingId: destinationBuildingId, latitude: -25.7, longitude: 28.2 },
      ]);

      //Act + Assert
      await expect(
        (service as any).getBuildingsForRoute(
          uniId,
          buildingId,
          destinationBuildingId,
          mockDb,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when origin has no pinned coordinates', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        { buildingId, latitude: null, longitude: null },
        { buildingId: destinationBuildingId, latitude: -25.7, longitude: 28.2 },
      ]);

      //Act + Assert
      await expect(
        (service as any).getBuildingsForRoute(
          uniId,
          buildingId,
          destinationBuildingId,
          mockDb,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when destination is missing', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        { buildingId, latitude: -25.7, longitude: 28.2 },
      ]);

      //Act + Assert
      await expect(
        (service as any).getBuildingsForRoute(
          uniId,
          buildingId,
          destinationBuildingId,
          mockDb,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return coordinates for both buildings', async () => {
      //Arrange
      mockDbResult(mockDb.select, [
        { buildingId, latitude: -25.7545, longitude: 28.2314 },
        {
          buildingId: destinationBuildingId,
          latitude: -25.755,
          longitude: 28.232,
        },
      ]);

      //Act
      const result = await (service as any).getBuildingsForRoute(
        uniId,
        buildingId,
        destinationBuildingId,
        mockDb,
      );

      //Assert
      expect(result).toEqual({
        origin: { Latitude: -25.7545, Longitude: 28.2314 },
        destination: { Latitude: -25.755, Longitude: 28.232 },
      });
    });
  }); //END_Test_getBuildingsForRoute

  describe('Test_persistRouteVariants', () => {
    it('should return empty array when no routes provided', async () => {
      //Act
      const result = await (service as any).persistRouteVariants(
        uniId,
        buildingId,
        destinationBuildingId,
        [],
        mockDb,
      );

      //Assert
      expect(result).toEqual([]);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should insert routes and return the persisted rows', async () => {
      //Arrange
      const route = createRoute();
      mockDbResult(mockDb.insert, [route]);

      //Act
      const result = await (service as any).persistRouteVariants(
        uniId,
        buildingId,
        destinationBuildingId,
        [
          {
            routeIndex: 0,
            routeCoordinates: route.PathCoordinates,
            distanceMetres: route.DistanceMetres,
          },
        ],
        mockDb,
      );

      //Assert
      expect(result).toEqual([route]);
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });
  }); //END_Test_persistRouteVariants

  describe('Test_getDiversionTarget', () => {
    it('should return null when no diversion exists', async () => {
      //Arrange
      mockSequentialResults(mockDb.select, [
        [],
        [{ toRouteId: 'route-2', diversion: 0 }],
      ]);

      //Act
      const result1 = await (service as any).getDiversionTarget(
        'route-1',
        mockDb,
      );
      const result2 = await (service as any).getDiversionTarget(
        'route-1',
        mockDb,
      );

      //Assert
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should return the target route when shouldDivert is true', async () => {
      //Arrange
      mockDbResult(mockDb.select, [{ toRouteId: 'route-2', diversion: 0.5 }]);
      jest.spyOn(service as any, 'shouldDivert').mockReturnValue(true);

      //Act
      const result = await (service as any).getDiversionTarget(
        'route-1',
        mockDb,
      );

      //Assert
      expect(result).toBe('route-2');
    });

    it('should return null when shouldDivert is false', async () => {
      //Arrange
      mockDbResult(mockDb.select, [{ toRouteId: 'route-2', diversion: 0.5 }]);
      jest.spyOn(service as any, 'shouldDivert').mockReturnValue(false);

      //Act
      const result = await (service as any).getDiversionTarget(
        'route-1',
        mockDb,
      );

      //Assert
      expect(result).toBeNull();
    });
  }); //END_Test_getDiversionTarget

  describe('Test_shouldDivert', () => {
    it('should return true when probability is 1 or greater', () => {
      //Act + Assert
      expect((service as any).shouldDivert(1)).toBe(true);
      expect((service as any).shouldDivert(1.5)).toBe(true);
    });

    it('should compare Math.random against the probability', () => {
      //Arrange
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.4);

      //Act + Assert
      expect((service as any).shouldDivert(0.5)).toBe(true); // 0.4 < 0.5
      expect((service as any).shouldDivert(0.3)).toBe(false); // 0.4 >= 0.3

      //Assert
      randomSpy.mockRestore();
    });
  }); //END_Test_shouldDivert
}); //END_RouteService
