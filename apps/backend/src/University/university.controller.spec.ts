import { UniversityController } from './university.controller';
import { UniversityService } from './university.service';

import { Test } from '@nestjs/testing';

//Constants
import { uniId } from '../Testing/constants.spec';

//Mock services
import { createMockUniversityService } from '../Testing/Mocks/services';

//Factories

import {
  CreateUniversityDto,
  UniversityListResponseDto,
} from './dto/university.dto';

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
  //GetAll
  describe('TEST_getAll', () => {
    it('should return all universities', async () => {
      const expectedResponse: UniversityListResponseDto = {
        universities: [
          {
            UniversityName: 'Test University 1',
            UniversityID: 'uuid-1',
          },
          {
            UniversityName: 'Test University 2',
            UniversityID: 'uuid-2',
          },
        ],
      };

      mockUniversityService.getAll!.mockResolvedValue(expectedResponse);

      const result = await controller.getAll({ user: { id: 'userId' } } as any);

      expect(mockUniversityService.getAll).toHaveBeenCalledWith('userId');
      expect(result).toEqual(expectedResponse);
    });
  }); // END_TEST_getAll

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
        userId: 'userId',
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
});
