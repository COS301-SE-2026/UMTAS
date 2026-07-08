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
  });
});
