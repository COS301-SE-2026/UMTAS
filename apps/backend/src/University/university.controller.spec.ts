import { UniversityController } from './university.controller';
import { UniversityService } from './university.service';

import { Test } from '@nestjs/testing';

//Constants
import { uniId } from '../Testing/constants.spec';

//Mock services
import { createMockUniversityService } from '../Testing/Mocks/services';

//Factories

import { CreateUniversityDto } from './dto/university.dto';

//DTo's
import { UniversitySingleResponseDto } from './dto/university.dto';

describe('UniversityController', () => {
  let controller: UniversityController;

  //mock services
  const { mockUniversityService, reset: resetUni } =
    createMockUniversityService();

  // const mockSession = createMockSession(userId, 'student');
  //before
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UniversityController],
      providers: [
        { provide: UniversityService, useValue: mockUniversityService },
      ],
    }).compile();

    controller = module.get<UniversityController>(UniversityController);
  }); //END_BeforeEach

  //after
  afterEach(() => {
    resetUni();
    jest.clearAllMocks();
  }); //END_afterEach

  //TESTS

  describe('TEST_create', () => {
    it('should create a university', async () => {
      const createDto: CreateUniversityDto = {
        UniversityName: 'Test University',
      };
      const expectedResponse: UniversitySingleResponseDto = {
        UniversityName: createDto.UniversityName,
        UniversityID: uniId,
      };

      mockUniversityService.create!.mockResolvedValue(expectedResponse);

      const result = await controller.create(createDto);
      expect(result).toEqual(expectedResponse);
      expect(mockUniversityService.create).toHaveBeenCalledWith(createDto);
    });
  });

  //getbyId
  describe('TEST_getById', () => {
    it('should return a university by ID', async () => {
      const universityId = 'uuid-1';
      const expectedResponse: UniversitySingleResponseDto = {
        UniversityName: 'Test University',
        UniversityID: universityId,
      };

      mockUniversityService.getById!.mockResolvedValue(expectedResponse);

      const result = await controller.getById(
        { user: { id: 'userId' } } as any,
        universityId,
      );

      expect(mockUniversityService.getById).toHaveBeenCalledWith(universityId);
      expect(result).toEqual(expectedResponse);
    });
  }); // END_TEST_getById

  //getUsersRoleByUni
  describe('TEST_getUsersRoleByUni', () => {
    it('should return a user role by university ID', async () => {
      const UniversityID = 'uuid-1';
      const expectedResponse = {
        UniversityID: 'uuid-1',
        UserID: 'userId',
        role: 'STUDENT',
      } as const;

      mockUniversityService.getUsersRole!.mockResolvedValue(expectedResponse);

      const result = await controller.getUsersRoleByUni(
        { user: { id: 'userId' } } as any,
        UniversityID,
      );

      expect(mockUniversityService.getUsersRole).toHaveBeenCalledWith(
        'userId',
        UniversityID,
      );
      expect(result).toEqual(expectedResponse);
    });
  }); // END_TEST_getUsersRoleByUni

  //update
  describe('TEST_update', () => {
    it('should update a university', async () => {
      const universityId = 'uuid-1';
      const updateDto = { UniversityName: 'Updated University' };
      const expectedResponse: UniversitySingleResponseDto = {
        UniversityName: updateDto.UniversityName,
        UniversityID: universityId,
      };

      mockUniversityService.update!.mockResolvedValue(expectedResponse);

      const result = await controller.update(universityId, updateDto);

      expect(mockUniversityService.update).toHaveBeenCalledWith(
        universityId,
        updateDto,
      );
      expect(result).toEqual(expectedResponse);
    });
  }); // END_TEST_update

  //delete
  describe('TEST_delete', () => {
    it('should delete a university', async () => {
      const universityId = 'uuid-1';
      const expectedResponse = {
        UniversityName: 'Test University',
        success: true,
      } as const;

      mockUniversityService.delete!.mockResolvedValue(expectedResponse);

      const result = await controller.delete(universityId);

      expect(mockUniversityService.delete).toHaveBeenCalledWith(universityId);
      expect(result).toEqual(expectedResponse);
    });
  }); // END_TEST_delete

  //applyForRole
  describe('TEST_applyForRole', () => {
    it('should apply for a role at a university', async () => {
      const applyDto = {
        UniversityID: 'uuid-1',
        role: 'STUDENT',
      } as const;
      const expectedResponse: UniversitySingleResponseDto = {
        UniversityName: 'Test University',
        UniversityID: applyDto.UniversityID,
      };

      mockUniversityService.applyForUniRole!.mockResolvedValue(
        expectedResponse,
      );

      const result = await controller.applyForRole(
        { user: { id: 'userId' } } as any,
        applyDto,
      );

      expect(mockUniversityService.applyForUniRole).toHaveBeenCalledWith(
        'userId',
        applyDto,
      );
      expect(result).toEqual(expectedResponse);
    });
  }); // END_TEST_applyForRole

  //approveUserRole
  describe('TEST_approveUserRole', () => {
    it('should approve a user role at a university', async () => {
      const approveDto = {
        UniversityID: 'uuid-1',
        userId: 'userId',
        isApproved: true,
      } as const;
      const expectedResponse = {
        userId: approveDto.userId,
        success: true,
      } as const;

      mockUniversityService.approveUserRole!.mockResolvedValue(
        expectedResponse,
      );

      const result = await controller.approveUserRole(approveDto);

      expect(mockUniversityService.approveUserRole).toHaveBeenCalledWith(
        approveDto,
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});
