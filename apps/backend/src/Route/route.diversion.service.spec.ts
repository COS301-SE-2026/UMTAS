import { uniId } from 'src/Testing/constants';
import { RouteService } from './route.service';
import { createMockDatabase, mockDbResult } from 'src/Testing/Mocks';
import { Test } from '@nestjs/testing';
import { DatabaseService } from 'src/db/database.service';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  createDiversionRequestDto,
  createDiversionRouteResponseDto,
  createRouteDiversion,
  createRouteDto,
} from 'src/Testing/Factories';
import { RouteDiversionService } from './route.diversion.service';
import { createMockRouteService } from 'src/Testing/Mocks/services';

describe('RouteDiversion', () => {
  let service: RouteDiversionService;
  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockRouteService, reset: resetRoute } = createMockRouteService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RouteDiversionService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: RouteService, useValue: mockRouteService },
      ],
    }).compile();

    service = module.get(RouteDiversionService);
  });

  afterEach(() => {
    resetDb();
    resetRoute();
    jest.restoreAllMocks();
  });

  //Tests

  describe('Test_divertRoute', () => {
    it('should validate and delegate to insertOrUpdateDiversionRoute', async () => {
      //Arrange
      const dto = createDiversionRequestDto();
      const routesObject = {
        fromRoute: createRouteDto(),
        toRoute: createRouteDto(),
        diversion: 0.5,
      };
      const response = createDiversionRouteResponseDto();
      const validateSpy = jest
        .spyOn(service as any, 'validateDiversionRequestDto')
        .mockResolvedValue(routesObject);
      const insertSpy = jest
        .spyOn(service as any, 'insertOrUpdateDiversionRoute')
        .mockResolvedValue(response);

      mockDbResult(mockDb.select, []);

      //Act
      const result = await service.divertRoute(uniId, dto);

      //Assert
      expect(result).toBe(response);
      expect(validateSpy).toHaveBeenCalledWith(uniId, dto, mockDb);
      expect(insertSpy).toHaveBeenCalledWith(routesObject, mockDb);
    });
  }); //END_Test_divertRoute

  //Helpers
  describe('Test_validateDiversionRequestDto', () => {
    it('should resolve toRoute by id when toRoute provided', async () => {
      const fromRoute = createRouteDto({ routeId: 'from-1' });
      const toRoute = createRouteDto({ routeId: 'to-1' });
      jest
        .spyOn(mockRouteService, 'getById')
        .mockResolvedValueOnce({ route: fromRoute })
        .mockResolvedValueOnce({ route: toRoute });
      const variantSpy = jest.spyOn(mockRouteService, 'getRouteVariant');

      const result = await (service as any).validateDiversionRequestDto(
        uniId,
        createDiversionRequestDto({
          fromRoute: 'from-1',
          toRoute: 'to-1',
          diversion: 0.5,
        }),
        mockDb,
      );

      expect(result).toEqual({ fromRoute, toRoute, diversion: 0.5 });
      expect(variantSpy).not.toHaveBeenCalled();
    });

    it('should resolve toRoute by variant when toRouteIndex provided', async () => {
      const fromRoute = createRouteDto({ routeId: 'from-1' });
      const toRoute = createRouteDto({ routeId: 'variant-1' });
      jest
        .spyOn(mockRouteService, 'getById')
        .mockResolvedValueOnce({ route: fromRoute });
      jest
        .spyOn(mockRouteService, 'getRouteVariant')
        .mockResolvedValue(toRoute);

      const result = await (service as any).validateDiversionRequestDto(
        uniId,
        createDiversionRequestDto({
          fromRoute: 'from-1',
          toRouteIndex: 1,
          diversion: 0.5,
        }),
        mockDb,
      );

      expect(result.toRoute).toEqual(toRoute);
    });

    it('should throw BadRequestException when neither toRoute nor toRouteIndex provided', async () => {
      jest
        .spyOn(mockRouteService, 'getById')
        .mockResolvedValueOnce({ route: createRouteDto() });

      await expect(
        (service as any).validateDiversionRequestDto(
          uniId,
          createDiversionRequestDto({ fromRoute: 'from-1' }),
          mockDb,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate BadRequestException from validateDiversion', async () => {
      jest
        .spyOn(mockRouteService, 'getById')
        .mockResolvedValue({ route: createRouteDto() });

      await expect(
        (service as any).validateDiversionRequestDto(
          uniId,
          createDiversionRequestDto({
            fromRoute: 'from-1',
            toRoute: 'to-1',
            diversion: 1.5,
          }),
          mockDb,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  }); //END_Test_validateDiversionRequestDto

  describe('Test_validateDiversion', () => {
    it('should throw BadRequestException when diversion is out of range', () => {
      expect(() => (service as any).validateDiversion(-0.1)).toThrow(
        BadRequestException,
      );
      expect(() => (service as any).validateDiversion(1.1)).toThrow(
        BadRequestException,
      );
    });

    it('should not throw for valid diversion', () => {
      expect(() => (service as any).validateDiversion(0.5)).not.toThrow();
    });
  }); //END_Test_validateDiversion

  describe('Test_insertOrUpdateDiversionRoute', () => {
    const input = {
      fromRoute: createRouteDto({ routeId: 'from-1' }),
      toRoute: createRouteDto({ routeId: 'to-1' }),
      diversion: 0.5,
    };

    it('should create a diversion when none exists', async () => {
      mockDbResult(mockDb.select, []);
      const createSpy = jest
        .spyOn(service as any, 'createDiversion')
        .mockResolvedValue(createRouteDiversion());
      const updateSpy = jest.spyOn(service as any, 'updateDiversion');

      await (service as any).insertOrUpdateDiversionRoute(input, mockDb);

      expect(createSpy).toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should update the diversion when it differs', async () => {
      mockDbResult(mockDb.select, [createRouteDiversion({ Diversion: 0.2 })]);
      const createSpy = jest.spyOn(service as any, 'createDiversion');
      const updateSpy = jest
        .spyOn(service as any, 'updateDiversion')
        .mockResolvedValue(createRouteDiversion());

      await (service as any).insertOrUpdateDiversionRoute(input, mockDb);

      expect(updateSpy).toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should skip both when existing diversion matches', async () => {
      mockDbResult(mockDb.select, [createRouteDiversion({ Diversion: 0.5 })]);
      const createSpy = jest.spyOn(service as any, 'createDiversion');
      const updateSpy = jest.spyOn(service as any, 'updateDiversion');

      const result = await (service as any).insertOrUpdateDiversionRoute(
        input,
        mockDb,
      );

      expect(createSpy).not.toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
      expect(result.diversion).toBe(0.5);
    });
  }); //END_Test_insertOrUpdateDiversionRoute

  describe('Test_createDiversion', () => {
    it('should throw InternalServerErrorException when insert returns no row', async () => {
      mockDbResult(mockDb.insert, []);

      await expect(
        (service as any).createDiversion('from-1', 'to-1', 0.5, mockDb),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should return the inserted diversion', async () => {
      const diversion = createRouteDiversion();
      mockDbResult(mockDb.insert, [diversion]);

      const result = await (service as any).createDiversion(
        'from-1',
        'to-1',
        0.5,
        mockDb,
      );

      expect(result).toEqual(diversion);
    });
  }); //END_Test_createDiversion

  describe('Test_updateDiversion', () => {
    it('should throw InternalServerErrorException when update returns no row', async () => {
      mockDbResult(mockDb.update, []);

      await expect(
        (service as any).updateDiversion('from-1', 'to-1', 0.7, mockDb),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should return the updated diversion', async () => {
      const diversion = createRouteDiversion({ Diversion: 0.7 });
      mockDbResult(mockDb.update, [diversion]);

      const result = await (service as any).updateDiversion(
        'from-1',
        'to-1',
        0.7,
        mockDb,
      );

      expect(result).toEqual(diversion);
    });
  }); //END_Test_updateDiversion
}); //END_RouteService
