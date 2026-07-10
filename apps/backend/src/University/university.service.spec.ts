import { UniversityService } from './university.service';

import { Test } from '@nestjs/testing';

import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

//constants
import { userId, uniId } from '../Testing/constants.spec';

//mock services
import { createMockDatabase } from '../Testing/Mocks/database.mock';
// import {createMockUniversityService} from '../Testing/Mocks/services';
import { DatabaseService } from '../db/database.service';

//mock functions on db
import { mockDbResult, mockSequentialResults } from '../Testing/Mocks';

//factories
// import {createUniversity} from '../Testing/Factories';
// import { exists } from 'drizzle-orm/sql/expressions/conditions';
import {
  University,
  UniversityRole,
} from '../entities/Universities/University.schema';
import { ApplyForUniRoleDto, ApproveUsersRoleDto } from './dto/university.dto';

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
    it('should throw an error if the university does not exist', async () => {
      const dto = { UniversityName: 'Non-existent University' };

      mockDbResult(mockDb.update, []);

      await expect(service.update(uniId, dto)).rejects.toThrowError(
        new NotFoundException(`No University found for universityID: ${uniId}`),
      );

      expect(mockDb.update).not.toHaveBeenCalledWith();
    });
  });

  describe('Test_DeleteUniversity', () => {
    it('should throw an error if the university does not exist', async () => {
      const nonExistentUniId = 'non-existent-uni-id';

      mockDbResult(mockDb.delete, []);

      await expect(service.delete(nonExistentUniId)).rejects.toThrowError(
        new NotFoundException(
          `No University found for universityID: ${nonExistentUniId}`,
        ),
      );

      expect(mockDb.delete).not.toHaveBeenCalledWith();
    });
  });

  describe('Test_getUsersRole', () => {
    it('should return the user role for a given university', async () => {
      const mockrecord = { role: 'Admin', UniversityID: uniId, UserID: userId };
      mockDbResult(mockDb.select, [mockrecord]);

      const result = await service.getUsersRole(userId, uniId);

      expect(mockDb.select).toHaveBeenCalledWith();
      expect(result).toEqual({
        UniversityID: uniId,
        userId: userId,
        role: 'Admin',
      });
    });

    it('should throw BadRequestException if the user has no role for the given university', async () => {
      mockDbResult(mockDb.select, []);

      await expect(service.getUsersRole(userId, uniId)).rejects.toThrowError(
        new BadRequestException(
          `No role found for user[${userId}] for university[${uniId}]`,
        ),
      );
    });
  });

  describe('Test_applyforUniRole', () => {
    it('should return university details with new role if application is successful', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue({
        UniversityID: uniId,
        UniversityName: 'Test Uni',
        role: 'STUDENT',
      });
      const myRoleVariable = 'LECTURER';
      const dto: ApplyForUniRoleDto = {
        UniversityID: uniId,
        role: myRoleVariable,
      };

      mockDbResult(mockDb.select, [
        { UniversityID: uniId, UniversityName: 'Test Uni', role: 'STUDENT' },
      ]);

      mockDbResult(mockDb.update, [
        {
          UniversityID: uniId,
          role: 'LECTURER_PENDING',
        },
      ]);

      const result = await service.applyForUniRole(userId, dto);
      expect(mockDb.update).toHaveBeenCalled();
      expect(result.role).toEqual('LECTURER_PENDING');
    });
  });

  describe('Test_approveUserRole', () => {
    it('should approve user role and return updated role', async () => {
      const myRoleVariable =
        'LECTURER_PENDING' as ApproveUsersRoleDto['provdedRole'];
      const dto = {
        UniversityID: uniId,
        userId: userId,
        isApproved: false,
        role: myRoleVariable,
      };

      mockDbResult(mockDb.select, [
        {
          UniversityID: uniId,
          userId: userId,
          isApproved: false,
          role: myRoleVariable,
        },
      ]);

      mockDbResult(mockDb.update, [
        {
          UniversityID: uniId,
          userId: userId,
          isApproved: true,
          role: myRoleVariable,
        },
      ]);

      const result = await service.approveUserRole(dto);

      expect(mockDb.update).toHaveBeenCalled();
      expect(result.success).toEqual(true);
    });
  });

  describe('Test_getAllApplications', () => {
    it('should return all applications for a given university', async () => {
      const mockAuthResult = [
        {
          University: { UniversityID: uniId, UniversityName: 'Test Uni' },
          UniversityRole: {
            UserID: userId,
            UniversityID: uniId,
            role: 'UNIVERSITY_ADMIN' as const,
          },
        },
      ];

      const mockApplications = [
        {
          Name: 'Test User',
          UserID: userId,
          Email: 'user@example.com',
          UniversityID: uniId,
          role: 'UNIVERSITY_ADMIN_PENDING',
        },
      ];

      mockSequentialResults<any>(mockDb.select as jest.Mock, [
        mockAuthResult,
        mockApplications,
      ]);

      const result = await service.getAllApplications(userId, uniId, {
        pending: true,
      });

      expect(mockDb.select).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockApplications);
    });
  });
});
