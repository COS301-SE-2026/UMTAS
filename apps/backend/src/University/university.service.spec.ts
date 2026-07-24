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
import { mockDbResult, mockTransaction } from '../Testing/Mocks';

//factories
// import {createUniversity} from '../Testing/Factories';
// import { exists } from 'drizzle-orm/sql/expressions/conditions';
import { University } from '../entities/Universities/University.schema';
import { ApplyForUniRoleDto, ApproveUsersRoleDto } from './dto/university.dto';

describe('UniversityService', () => {
  let service: UniversityService;

  //define mock services
  const { mockDb, reset: resetDb } = createMockDatabase();
  //   const {mockUniversityService, reset: resetUni} = createMockUniversityService();

  const dto = { UniversityName: ' Test Uni   ' };
  const trimName = dto.UniversityName.trim();
  const mockUniResponse = { UniversityID: uniId, UniversityName: trimName };

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
    it('if duplicate name,should throw exception', async () => {
      mockTransaction(mockDb, {
        select: [[{ UniversityName: trimName }]], // Duplicate found
      });

      //Act + Assert
      await expect(service.create(dto)).rejects.toThrow(
        new ConflictException(`University [${trimName}] already exists`),
      );
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('create + return new university if unique', async () => {
      //Arrange
      const spioen = jest.spyOn(service, 'checkDuplicateUniversityName');

      mockTransaction(mockDb, {
        select: [[]], //checkDupUniName
        insert: [[mockUniResponse]],
      });

      const result = await service.create(dto);

      expect(spioen).toHaveBeenCalledWith(trimName, mockDb);
      expect(mockDb.insert).toHaveBeenCalledWith(University);
      expect(result).toEqual(mockUniResponse);
    });
  }); //END_Test_createUniversity

  describe('Test_getById_University', () => {
    it('should throw NotFound if university does not exist', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(service.getById(uniId)).rejects.toThrow(NotFoundException);
      expect(mockDb.select).toHaveBeenCalledTimes(1);
    });

    it('should return the university found by select query', async () => {
      //Arrange
      mockDbResult(mockDb.select, [mockUniResponse]);

      //Act
      const result = await service.getById(uniId);

      //Assert
      expect(mockDb.select).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject(mockUniResponse);
    });
  }); //END_Test_getById

  describe('Test_UpdateUniversity', () => {
    it('should throw an error if University name is undefined', async () => {
      //Arrange
      jest.spyOn(service, 'getById').mockResolvedValue({
        UniversityID: '1',
        UniversityName: 'Old Name',
      });

      const dto = { UniversityName: undefined };

      //Act + arrange
      await expect(service.update('1', dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the university does not exist', async () => {
      //Arrange
      const dto = { UniversityName: 'Non-existent University' };
      const spioen = jest.spyOn(service, 'getById');

      mockTransaction(mockDb, {
        select: [[]], //tx.update
      });

      //Act + Assert
      await expect(service.update(uniId, dto)).rejects.toThrowError(
        NotFoundException,
      );
      expect(mockDb.update).not.toHaveBeenCalledWith();
      expect(spioen).toHaveBeenCalledWith(uniId, mockDb);
    });

    it('should successfully update the university name if it exists', async () => {
      //Arrange
      jest.spyOn(service, 'getById').mockResolvedValue({
        UniversityID: uniId,
        UniversityName: 'ou naam',
      });
      jest
        .spyOn(service, 'checkDuplicateUniversityName')
        .mockResolvedValue(false);
      const newUni = { UniversityID: uniId, UniversityName: 'nuwe naam' };

      mockTransaction(mockDb, {
        update: [[newUni]],
      });

      //Act
      const result = await service.update(uniId, {
        UniversityName: 'nuwe naam',
      });

      //Assert
      expect(result).toMatchObject(newUni);
      expect(service.getById).toHaveBeenCalledTimes(1);
      expect(service.checkDuplicateUniversityName).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the new university name already exists', async () => {
      //Arrange
      jest.spyOn(service, 'getById').mockResolvedValue({
        UniversityID: uniId,
        UniversityName: 'ou naam',
      });
      jest
        .spyOn(service, 'checkDuplicateUniversityName')
        .mockResolvedValue(true);

      //Act + Assert
      await expect(
        service.update(uniId, { UniversityName: 'nuwe naam' }),
      ).rejects.toThrow(ConflictException);
      expect(service.getById).toHaveBeenCalledTimes(1);
      expect(service.checkDuplicateUniversityName).toHaveBeenCalledTimes(1);
    });
  }); //END_Test_updateUniversity

  describe('Test_DeleteUniversity', () => {
    it('should throw an error if the university does not exist', async () => {
      //Arrange
      const spioen = jest.spyOn(service, 'getById');
      mockTransaction(mockDb, {
        select: [[]],
      });

      //Act + Assert
      await expect(service.delete(uniId)).rejects.toThrow(NotFoundException);
      expect(spioen).toHaveBeenCalledTimes(1);
      expect(mockDb.delete).not.toHaveBeenCalled();
    });

    it('should successfully delete the university if it exists', async () => {
      //Arrange
      const spioen = jest.spyOn(service, 'getById');
      const uniToDelete = {
        UniversityID: uniId,
        UniversityName: 'Deleted University',
      };
      const mockDeletedUni = {
        UniversityName: uniToDelete.UniversityName,
        success: true,
      };
      mockTransaction(mockDb, {
        select: [[uniToDelete]], //getById
        delete: [[uniToDelete]],
      });

      //Act
      const result = await service.delete(uniId);

      //Assert
      expect(result).toMatchObject(mockDeletedUni);
      expect(spioen).toHaveBeenCalledTimes(1);
      expect(mockDb.delete).toHaveBeenCalledWith(University);
    });
  }); //END_Test_DeleteUniversity

  describe('Test_getUsersRole', () => {
    it('should throw NotFoundException if no role was found for user at university', async () => {
      //Arrange
      mockTransaction(mockDb, {
        select: [[]],
      });

      //Act + Arrange
      await expect(service.getUsersRole(userId, uniId)).rejects.toThrowError(
        NotFoundException,
      );
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return the user role for a given university', async () => {
      //Arrange
      const mockrecord = { role: 'Admin', UniversityID: uniId, UserID: userId };
      mockTransaction(mockDb, {
        select: [[mockrecord]],
      });

      //Act
      const result = await service.getUsersRole(userId, uniId);

      //Assert
      expect(mockDb.select).toHaveBeenCalledWith();
      expect(result).toMatchObject(mockrecord);
    });
  }); //END_Test_getUsersRole

  describe('Test_applyforUniRole', () => {
    it('should throw notFoundException if university does not exist', async () => {
      //Arrange
      const spioen = jest.spyOn(service, 'getById');
      const dto: ApplyForUniRoleDto = {
        UniversityID: uniId,
        role: 'LECTURER',
      };

      mockTransaction(mockDb, {
        select: [[]], //getById
      });

      //Act + Assert
      await expect(service.applyForUniRole(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(spioen).toHaveBeenCalled();
    });

    it('should return early if user already has that role (UNI_ADMIN)', async () => {
      //Arrange
      const spioen = jest.spyOn(service, 'getById');
      const myRoleVariable = 'UNIVERSITY_ADMIN';
      const dto: ApplyForUniRoleDto = {
        UniversityID: uniId,
        role: myRoleVariable,
      };
      const expectedResponse = {
        UniversityID: uniId,
        role: myRoleVariable,
      };

      mockTransaction(mockDb, {
        select: [
          [mockUniResponse], //getById
          [
            {
              ...expectedResponse,
              UserID: userId,
            },
          ], //select(UniversityRole) - previouse role was there
        ],
      });

      //Act
      const result = await service.applyForUniRole(userId, dto);

      //Assert
      expect(spioen).toHaveBeenCalled();
      expect(mockDb.select).toHaveBeenCalledTimes(2);
      expect(mockDb.insert).not.toHaveBeenCalled();
      expect(mockDb.update).not.toHaveBeenCalled();
      expect(result).toMatchObject(expectedResponse);
    });

    it('should return univeristy and role after creating new role for user at university', async () => {
      //Arrange
      const spioen = jest.spyOn(service, 'getById');
      // jest.spyOn(service, 'getById').mockResolvedValue({
      //   UniversityID: uniId,
      //   UniversityName: 'Test Uni',
      //   role: 'STUDENT',
      // });
      const myRoleVariable = 'LECTURER';
      const dto: ApplyForUniRoleDto = {
        UniversityID: uniId,
        role: myRoleVariable,
      };
      const expectedResponse = {
        UniversityID: uniId,
        role: 'LECTURER_PENDING',
      };

      mockTransaction(mockDb, {
        select: [
          [mockUniResponse], //getById
          [], //select(UniversityRole) - no previouse role at that uni
        ],
        insert: [[{ ...expectedResponse, UserID: userId }]],
      });

      //Act
      const result = await service.applyForUniRole(userId, dto);

      //Assert
      expect(spioen).toHaveBeenCalled();
      expect(mockDb.select).toHaveBeenCalledTimes(2);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toMatchObject(expectedResponse);
    });

    it('should udpate old role (STUDENT)', async () => {
      //Arrange
      const spioen = jest.spyOn(service, 'getById');
      const myRoleVariable = 'STUDENT';
      const dto: ApplyForUniRoleDto = {
        UniversityID: uniId,
        role: myRoleVariable,
      };
      const expectedResponse = {
        UniversityID: uniId,
        role: 'STUDENT',
      };

      mockTransaction(mockDb, {
        select: [
          [mockUniResponse], //getById
          [{ UniversityID: uniId, UserID: userId, role: 'LECTURER_PENDING' }], //select(UniversityRole) - no previouse role at that uni
        ],
        update: [[{ ...expectedResponse, UserID: userId }]],
      });

      //Act
      const result = await service.applyForUniRole(userId, dto);

      //Assert
      expect(spioen).toHaveBeenCalled();
      expect(mockDb.select).toHaveBeenCalledTimes(2);
      expect(mockDb.update).toHaveBeenCalled();
      expect(result).toMatchObject(expectedResponse);
    });
  }); //END_Test_applyforUniRole

  describe('Test_approveUserRole', () => {
    it('should throw notFoundException if no record exists for the user at the uni', async () => {
      //Arrange
      // const spioen = jest.spyOn(service, 'getUsersRole');
      mockTransaction(mockDb, {
        select: [[]], //getUsersRole
      });
      const dto = {
        UniversityID: uniId,
        userId: userId,
        isApproved: false,
        role: 'STUDENT',
      };

      //Act + Assert
      await expect(service.approveUserRole(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should approve user role and return updated role when no role specified', async () => {
      //Arrange
      const myRoleVariable =
        'LECTURER_PENDING' as ApproveUsersRoleDto['provdedRole'];
      const dto = {
        UniversityID: uniId,
        userId: userId,
        isApproved: true,
      };
      const expectedResponse = {
        UniversityID: uniId,
        UserID: userId,
        role: 'LECTURER',
      };

      mockTransaction(mockDb, {
        select: [
          [{ UniversityID: uniId, UserID: userId, role: myRoleVariable }],
        ],
        update: [[expectedResponse]],
      });

      //Act
      const result = await service.approveUserRole(dto);

      //Assert
      expect(result).toMatchObject({ userId, success: true });
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  // describe('Test_getAllApplications', () => {
  //   it('should return all applications for a given university', async () => {
  //     const mockAuthResult = [
  //       {
  //         University: { UniversityID: uniId, UniversityName: 'Test Uni' },
  //         UniversityRole: {
  //           UserID: userId,
  //           UniversityID: uniId,
  //           role: 'UNIVERSITY_ADMIN' as const,
  //         },
  //       },
  //     ];

  //     const mockApplications = [
  //       {
  //         Name: 'Test User',
  //         UserID: userId,
  //         Email: 'user@example.com',
  //         UniversityID: uniId,
  //         role: 'UNIVERSITY_ADMIN_PENDING',
  //       },
  //     ];

  //     mockTransaction(mockDb, {
  //       select: [
  //         [mockAuthResult],//role
  //          [mockApplications]//applications
  //         ]
  //     });

  //     const result = await service.getAllApplications(userId, uniId, {
  //       pending: true,
  //     });

  //     expect(mockDb.select).toHaveBeenCalledTimes(2);
  //     expect(result).toEqual(mockApplications);
  //   });
  // });

  // describe('Test_getByName', () => {
  //   it('should return university details if found by name', async () => {
  //     const uniName = 'Test University';
  //     const mockUni = {
  //       UniversityID: uniId,
  //       UniversityName: uniName,
  //     };

  //     mockDbResult(mockDb.select, [mockUni]);

  //     const result = await service.getByName(uniName);

  //     expect(mockDb.select).toHaveBeenCalled();
  //     expect(result).toEqual(mockUni);
  //   });
  // });
});
