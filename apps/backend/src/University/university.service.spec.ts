import { UniversityService } from './university.service';

import { Test } from '@nestjs/testing';

import { ConflictException, NotFoundException } from '@nestjs/common';

//constants
import { userId, uniId } from '../Testing/constants.spec';

//mock services
import { createMockDatabase } from '../Testing/Mocks/database.mock';
// import {createMockUniversityService} from '../Testing/Mocks/services';
import { DatabaseService } from '../db/database.service';

//mock functions on db
import { mockDbResult } from '../Testing/Mocks';

//factories
// import {createUniversity} from '../Testing/Factories';
// import { exists } from 'drizzle-orm/sql/expressions/conditions';
import {
  University,
  UniversityRole,
} from '../entities/Universities/University.schema';

describe('UniversityService', () => {
  let service: UniversityService;

  //define mock services
  const { mockDb, reset: resetDb } = createMockDatabase();
  //   const {mockUniversityService, reset: resetUni} = createMockUniversityService();

  //before
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UniversityService,
        { provide: DatabaseService, useValue: { db: mockDb } },
      ],
    }).compile();

    service = module.get(UniversityService);
  }); //END_BeforeEach

  //afterEach
  afterEach(() => {
    resetDb();
    // resetUni();
  }); //END_afterEach

  //TESTS

  describe('Test_createUniversity', () => {
    const dto = { UniversityName: ' Test Uni   ' };
    const trimName = dto.UniversityName.trim();
    const mockUniResponse = { UniversityID: uniId, UniversityName: trimName };

    it('if duplicate name,should throw exception', async () => {
      jest
        .spyOn(service, 'checkDuplicateUniversityName')
        .mockResolvedValue(true);
      await expect(service.create(dto)).rejects.toThrowError(
        new ConflictException(
          `University [${dto.UniversityName.trim()}] already exists`,
        ),
      );

      expect(service.checkDuplicateUniversityName).toHaveBeenCalledWith(
        trimName,
      );

      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('create + return new university if unique', async () => {
      jest
        .spyOn(service, 'checkDuplicateUniversityName')
        .mockResolvedValue(false);
      mockDbResult(mockDb.insert, [mockUniResponse]);

      const result = await service.create(dto);

      expect(service.checkDuplicateUniversityName).toHaveBeenCalledWith(
        trimName,
      );
      expect(mockDb.insert).toHaveBeenCalledWith(University);
      expect(result).toEqual(mockUniResponse);
    });
  }); //END_Test_createUniversity

  describe('Test_getAllUniversities', () => {
    const mockUniList = {
      universities: [
        { UniversityID: uniId, UniversityName: 'Test Uni 1', role: 'Admin' },
        { UniversityID: uniId, UniversityName: 'Test Uni 2', role: null },
      ],
    };

    it('should return all universities with user roles', async () => {
      mockDbResult(mockDb.select, mockUniList.universities);

      const result = await service.getAll(userId);

      expect(mockDb.select).toHaveBeenCalledWith({
        UniversityID: University.UniversityID,
        UniversityName: University.UniversityName,
        role: UniversityRole.role,
      });
      expect(result).toEqual(mockUniList);
    });
    it('should throw NotFoundException if no universities found', async () => {
      mockDbResult(mockDb.select, []);

      await expect(service.getAll(userId)).rejects.toThrow(
        new NotFoundException('No universities found'),
      );

      expect(mockDb.select).toHaveBeenCalledWith({
        UniversityID: University.UniversityID,
        UniversityName: University.UniversityName,
        role: UniversityRole.role,
      });
    });
  });

  describe('Test_UpdateUniversity', () => {
    // it('should update university name and return updated university', async () => {
    //   const dto = { UniversityName: 'Updated University Name' };
    //   const updatedUni = { UniversityID: uniId, UniversityName: dto.UniversityName };

    //   mockDbResult(mockDb.update, [updatedUni]);

    //   const result = await service.update(uniId, dto);

    //   expect(mockDb.update).toHaveBeenCalledWith(University);
    //   expect(result).toEqual(updatedUni);
    // });

    it('should throw an error if the university does not exist', async () => {
      const dto = { UniversityName: 'Non-existent University' };

      mockDbResult(mockDb.update, []);

      await expect(service.update(uniId, dto)).rejects.toThrowError(
        new NotFoundException(`No University found for universityID: ${uniId}`),
      );

      expect(mockDb.update).not.toHaveBeenCalledWith();
    });
  });
});
