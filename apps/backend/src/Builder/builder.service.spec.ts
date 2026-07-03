import { BuilderService } from './builder.service';

import { Test } from '@nestjs/testing';

//Constants
import { userId, moduleId, uniId, courseId } from '../Testing/constants.spec';

//Mock services
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  createMockUniversityService,
  createMockCourseService,
  createMockModuleService,
} from '../Testing/Mocks/services';
import { DatabaseService } from '../db/database.service';
import { UniversityService } from '../University/university.service';
import { CourseService } from '../Course/course.service';
import { ModuleService } from '../Module/module.service';

//Mock functions on db
import { mockDbResult, mockSequentialResults } from '../Testing/Mocks';

//Factories
import { createModule } from '../Testing/Factories';

describe('BuilderService', () => {
  let service: BuilderService;

  //Define mock services
  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockUniversityService, reset: resetUni } =
    createMockUniversityService();
  const { mockCourseService, reset: resetCourse } = createMockCourseService();
  const { mockModuleService, reset: resetModules } = createMockModuleService();

  //Before
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BuilderService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: UniversityService, useValue: mockUniversityService },
        { provide: CourseService, useValue: mockCourseService },
        { provide: ModuleService, useValue: mockModuleService },
      ],
    }).compile();

    service = module.get(BuilderService);
  }); //END_BeforeEach

  //AfterEach
  afterEach(() => {
    resetDb();
    resetUni();
    resetCourse();
    resetModules();
  }); //END_afterEach

  //TESTS
  describe('Test_Create', () => {
    it('should create userOwned: university | course | module', async () => {
      //ARRANGE
      //doUserUniCheck
      mockDbResult(mockDb.select, []);
      //createUserUni
      mockUniversityService.getByName!.mockResolvedValue(null);
      mockUniversityService.create!.mockResolvedValue({
        UniversityID: uniId,
        UniversityName: 'somename',
      });
      mockSequentialResults(mockDb.insert, [
        [
          {
            //unirole
            UserID: userId,
            UniversityID: uniId,
            role: 'STUDENT_OWNED',
          },
        ],
        [
          {
            //moduleenrollment
            UserID: userId,
            ModuleID: moduleId,
          },
        ],
      ]);
      //END_createUserUni
      mockCourseService.getAll!.mockResolvedValue({ courses: [] });
      //createUserCourse
      mockCourseService.create!.mockResolvedValue({
        CourseID: courseId,
        CourseName: 'somecoursename',
        UniversityID: uniId,
      });
      //END_createUserCourse
      //END_doUserUniCheck

      const moduleDto = createModule({
        moduleID: moduleId,
      });

      mockModuleService.create!.mockResolvedValue(moduleDto);

      //Assert
      const result = await service.createModule(userId, moduleDto);

      //Assert
      expect(mockUniversityService.getByName).toHaveBeenCalledWith(
        `user_${userId.slice(0, 25)}`,
      );
      expect(mockCourseService.getAll).toHaveBeenCalledWith({
        UniversityID: uniId,
      });
      expect(mockModuleService.create).toHaveBeenCalledWith(userId, {
        moduleCode: moduleDto.moduleCode,
        moduleName: moduleDto.moduleName,
        moduleDescription: moduleDto.moduleDescription,
        CourseID: courseId,
        styling: undefined,
      });
      expect(result).toMatchObject(moduleDto);
    });
  });
}); //END_BuilderService
