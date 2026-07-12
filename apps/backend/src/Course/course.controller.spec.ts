import { CourseController } from './course.controller';
import { CourseService } from './course.service';

import { Test } from '@nestjs/testing';

//constants

//mock services
import { createMockCourseService } from '../Testing/Mocks/services';

//Factories
// import { createMockSession, createModule } from '../Testing/Factories';

//DTo's
import {
  //  CourseDto,CourseFilters,
  CourseSingleResponseDto,
  // DeleteCourseResponseDto,CourseListResponseDto,UpdateCourseDto,
  CreateCourseDto,
} from './dto/course.dto';

describe('CourseController', () => {
  let controller: CourseController;
  // let service: CourseService;

  //mock services
  const { mockCourseService, reset: resetCourse } = createMockCourseService();

  //const mockSession = createMockSession('someUserId', 'uni_admin');

  //Before
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CourseController],
      providers: [{ provide: CourseService, useValue: mockCourseService }],
    }).compile();

    controller = module.get<CourseController>(CourseController);
    // service = module.get<CourseService>(CourseService);
  }); //END_BeforeEach

  //after
  afterEach(() => {
    resetCourse();
    jest.clearAllMocks();
  }); //END_afterEach

  //TESTS

  describe('TEST_create', () => {
    it('should create course', async () => {
      const createDto: CreateCourseDto = {
        UniversityID: 'someUniversityId',
        GroupID: 'someGroupId',
        CourseName: 'Computer Science',
        Degree: 'Bachelor of Science',
      };

      const expectedResponse: CourseSingleResponseDto = {
        UniversityID: 'someUniversityId',
        GroupID: 'someGroupId',
        CourseID: 'someCourseId',
        CourseName: 'Computer Science',
        Degree: 'Bachelor of Science',
      };

      mockCourseService.create?.mockResolvedValue(expectedResponse);

      const result = await controller.create(createDto);

      expect(result).toEqual(expectedResponse);
      expect(mockCourseService.create).toHaveBeenCalledWith(createDto);
    });
  });
});
