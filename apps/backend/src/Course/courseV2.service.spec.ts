import { Test } from '@nestjs/testing';

//Constants
import { courseId, userId } from '../Testing/constants';

//Actual Services
import { CourseServiceV2 } from './courseV2.service';
import { DatabaseService } from '../db/database.service';
import { UniversityService } from '../University/university.service';
import { GroupingService } from '../Grouping/grouping.service';
import { ModuleServiceV2 } from '../Module/moduleV2.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { mockDbResult } from '../Testing/Mocks/database.helpers';
import { createCourse, createModule } from '../Testing/Factories';

//Mock Services
import {
  createMockUniversityService,
  createMockGroupingService,
  createMockModuleServiceV2,
} from '../Testing/Mocks/services';

//Errors thrown
import { NotFoundException } from '@nestjs/common';

//DTO's
import { CourseFiltersV2 } from './dto/course.dto';

describe('CourseServiceV2', () => {
  let service: CourseServiceV2;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockUniversityService, reset: resetUni } =
    createMockUniversityService();
  const { mockGroupingService, reset: resetGrouping } =
    createMockGroupingService();
  const { mockModuleServiceV2, reset: resetModule } =
    createMockModuleServiceV2();

  //beforeEach

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CourseServiceV2,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: UniversityService, useValue: mockUniversityService },
        { provide: GroupingService, useValue: mockGroupingService },
        { provide: ModuleServiceV2, useValue: mockModuleServiceV2 },
      ],
    }).compile();

    service = module.get(CourseServiceV2);
  });

  //After each
  afterEach(() => {
    resetDb();
    resetUni();
    resetGrouping();
    resetModule();
  });

  //Tests

  describe('Test_GetAllV2', () => {
    //UnHappy - Return empty arr of courses
    it('should return empty array of courses if none found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await service.getAllV2(userId, {});

      //Assert
      expect(result).toMatchObject({
        courses: [],
        message: 'Returned 0 Courses',
      });
    });

    //Happy - return array of courses with empty modules
    it('should return array of courses with empty modules', async () => {
      //Arrange
      const courses = [createCourse(), createCourse()];
      mockDbResult(mockDb.select, courses);

      mockModuleServiceV2.getAll?.mockResolvedValue({
        modules: [],
        message: 'No modules',
      });

      const filters: CourseFiltersV2 = {
        CourseName: 'someName',
        UniversityID: 'someID',
        Degree: 'someDegree',
        Stats: true,
      };

      //Act
      const result = await service.getAllV2(userId, filters);

      //Assert
      expect(result.courses).toHaveLength(2);
      expect(result.courses[0].Modules).toHaveLength(0);
      expect(result.count).toBe(2);
      expect(mockModuleServiceV2.getAll).toHaveBeenCalledTimes(2);
    });

    it('should return courses with modules attached', async () => {
      //Arrange
      const course = createCourse();
      const module1 = createModule();
      const module2 = createModule();

      mockDbResult(mockDb.select, [course]);

      mockModuleServiceV2.getAll?.mockResolvedValue({
        modules: [module1, module2],
        message: 'Modules returned',
      });

      //Act
      const result = await service.getAllV2(userId, {});

      //Assert
      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].Modules).toHaveLength(2);
      expect(result.courses[0].Modules?.[0]).toMatchObject(module1);
      expect(result.courses[0].Modules?.[1]).toMatchObject(module2);
    });

    it('should handle filters correctly', async () => {
      //Arrange
      const course = createCourse();
      mockDbResult(mockDb.select, [course]);

      mockModuleServiceV2.getAll?.mockResolvedValue({
        modules: [],
        message: 'No modules',
      });

      const filters: CourseFiltersV2 = {
        CourseName: 'Computer Science',
        UniversityID: 'uni-123',
        Degree: 'BSc',
      };

      //Act
      await service.getAllV2(userId, filters);

      //Assert
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should not include count when Stats is false', async () => {
      //Arrange
      const course = createCourse();
      mockDbResult(mockDb.select, [course]);

      mockModuleServiceV2.getAll?.mockResolvedValue({
        modules: [],
        message: 'No modules',
      });

      //Act
      const result = await service.getAllV2(userId, { Stats: false });

      //Assert
      expect(result).not.toHaveProperty('count');
    });

    it('should include count when Stats is true', async () => {
      //Arrange
      const courses = [createCourse(), createCourse()];
      mockDbResult(mockDb.select, courses);

      mockModuleServiceV2.getAll?.mockResolvedValue({
        modules: [],
        message: 'No modules',
      });

      //Act
      const result = await service.getAllV2(userId, { Stats: true });

      //Assert
      expect(result).toHaveProperty('count');
      expect(result.count).toBe(2);
    });
  }); //END_Test_GetAllV2

  describe('Test_GetByIdV2', () => {
    it('should throw if the course does not exist', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(service.getByIdV2(userId, courseId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the course with modules by id', async () => {
      //Arrange
      const course = createCourse();
      const module1 = createModule();
      const module2 = createModule();

      mockDbResult(mockDb.select, [course]);

      mockModuleServiceV2.getAll?.mockResolvedValue({
        modules: [module1, module2],
        message: 'Modules returned',
      });

      //Act
      const result = await service.getByIdV2(userId, course.CourseID);

      //Assert
      expect(result).toMatchObject(course);
      expect(result.Modules).toHaveLength(2);
      expect(result.Modules?.[0]).toMatchObject(module1);
      expect(result.Modules?.[1]).toMatchObject(module2);
      expect(mockModuleServiceV2.getAll).toHaveBeenCalled();
    });

    it('should return course with empty modules array when none exist', async () => {
      //Arrange
      const course = createCourse();

      mockDbResult(mockDb.select, [course]);

      mockModuleServiceV2.getAll?.mockResolvedValue({
        modules: [],
        message: 'No modules',
      });

      //Act
      const result = await service.getByIdV2(userId, course.CourseID);

      //Assert
      expect(result).toMatchObject(course);
      expect(result.Modules).toHaveLength(0);
    });
  }); //END_GetByIdV2

  describe('Test_GetByExternalID', () => {
    it('should return null if course does not exist', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await service.getByExternalID('ext-123', 'uni-123');

      //Assert
      expect(result).toBeNull();
    });

    it('should return course if found by external id', async () => {
      //Arrange
      const course = createCourse({ ExternalID: 'ext-123' });

      mockDbResult(mockDb.select, [course]);

      //Act
      const result = await service.getByExternalID(
        'ext-123',
        course.UniversityID,
      );

      //Assert
      expect(result).toMatchObject(course);
    });

    it('should return null when university id does not match', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await service.getByExternalID('ext-123', 'wrong-uni-id');

      //Assert
      expect(result).toBeNull();
    });
  }); //END_Test_GetByExternalID
}); //END_CourseServiceV2
