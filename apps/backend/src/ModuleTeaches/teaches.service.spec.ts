import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';

import { TeachesService } from './teaches.service';
import { DatabaseService } from '../db/database.service';
import { ModuleServiceV2 } from 'src/Module/moduleV2.service';

import {
  createMockDatabase,
  mockDbResult,
  mockTransaction,
} from 'src/Testing/Mocks';
import { createMockModuleServiceV2 } from 'src/Testing/Mocks/services';
import { uniId } from 'src/Testing/constants';
import {
  createCreateTeachesDto,
  createModuleTeaches,
  createModuleSingleResponseDto,
} from 'src/Testing/Factories';

describe('TeachesService', () => {
  let service: TeachesService;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockModuleServiceV2, reset: resetModuleService } =
    createMockModuleServiceV2();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TeachesService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: ModuleServiceV2, useValue: mockModuleServiceV2 },
      ],
    }).compile();

    service = module.get(TeachesService);
  });

  afterEach(() => {
    resetDb();
    resetModuleService();
    jest.restoreAllMocks();
  });

  // ── Exposed methods ───────────────────────────────────────────
  describe('Test_assignLecturer', () => {
    const actorUserId = 'actor-1';
    const dto = createCreateTeachesDto();

    it('should throw InternalServerErrorException when insert returns no row', async () => {
      //Arrange
      const module = createModuleSingleResponseDto();
      jest.spyOn(mockModuleServiceV2, 'getByIdV2').mockResolvedValue(module);
      jest
        .spyOn(service as any, 'getExistingTeachesRelation')
        .mockResolvedValue(null);
      mockTransaction(mockDb, { insert: [[]] });

      //Act + Assert
      await expect(
        service.assignLecturer(actorUserId, uniId, dto),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should return the existing relation with module when one exists', async () => {
      //Arrange
      const module = createModuleSingleResponseDto();
      const existing = createModuleTeaches();
      jest.spyOn(mockModuleServiceV2, 'getByIdV2').mockResolvedValue(module);
      jest
        .spyOn(service as any, 'getExistingTeachesRelation')
        .mockResolvedValue(existing);
      mockTransaction(mockDb, {});

      //Act
      const result = await service.assignLecturer(actorUserId, uniId, dto);

      //Assert
      expect(result).toEqual({ ...existing, module });
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should insert a new relation and return it with module when none exists', async () => {
      //Arrange
      const module = createModuleSingleResponseDto();
      const assignment = createModuleTeaches();
      jest.spyOn(mockModuleServiceV2, 'getByIdV2').mockResolvedValue(module);
      jest
        .spyOn(service as any, 'getExistingTeachesRelation')
        .mockResolvedValue(null);
      mockTransaction(mockDb, { insert: [[assignment]] });

      //Act
      const result = await service.assignLecturer(actorUserId, uniId, dto);

      //Assert
      expect(result).toEqual({ ...assignment, module });
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });
  }); //END_Test_assignLecturer

  // ── Helpers ───────────────────────────────────────────────────
  describe('Test_getExistingTeachesRelation', () => {
    it('should return null when no relation exists', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await (service as any).getExistingTeachesRelation(
        'module-1',
        'user-1',
        mockDb,
      );

      //Assert
      expect(result).toBeNull();
    });

    it('should return the existing relation', async () => {
      //Arrange
      const relation = createModuleTeaches();
      mockDbResult(mockDb.select, [relation]);

      //Act
      const result = await (service as any).getExistingTeachesRelation(
        'module-1',
        'user-1',
        mockDb,
      );

      //Assert
      expect(result).toEqual(relation);
    });
  }); //END_Test_getExistingTeachesRelation
}); //END_TeachesService
