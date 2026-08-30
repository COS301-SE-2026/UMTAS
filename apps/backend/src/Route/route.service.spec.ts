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
import { beforeEach } from 'node:test';
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
    const savedRoute = createRoute({
      OriginBuildingID: buildingId,
      DestinationBuildingID: destinationBuildingId,
    });

    mockSequentialResults(mockDb.select, [
      [],
      [],
      [originBuilding],
      [destinationBuilding],
    ]);
    mockDbResult(mockDb.insert, [savedRoute]);

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: {
              coordinates: [
                [28.2314, -25.7545],
                [28.232, -25.755],
              ],
            },
            properties: { summary: { distance: 420.4, duration: 310.9 } },
          },
        ],
      }),
    } as Response);

    const result = await routeService.getOrCreateRoute(
      mockSession,
      buildingId,
      destinationBuildingId,
    );

    expect(result.route.routeId).toBe(savedRoute.RouteID);
    expect(mockDb.insert).toHaveBeenCalled();
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
      json: async () => ({ features: [] }),
    } as Response);

    await expect(
      routeService.getOrCreateRoute(
        mockSession,
        buildingId,
        destinationBuildingId,
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
