import { Test } from '@nestjs/testing';

//Constants
import { courseId, groupId } from '../Testing/constants.spec';

//Actual Services
import { CourseService } from './course.service';
import { DatabaseService } from '../db/database.service';
import { UniversityService } from '../University/university.service';
import { GroupingService } from '../Grouping/grouping.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import {
  createCourse,
  createCourseDto,
  createGroup,
  createUniversity,
} from '../Testing/Factories/';

//Mock Services
import {
  createMockUniversityService,
  createMockGroupingService,
} from '../Testing/Mocks/services';

//Errors thrown
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

//DTO's
import { CourseFilters } from './dto/course.dto';

describe('CourseService', () => {
  let service: CourseService;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockUniversityService, reset: resetUni } =
    createMockUniversityService();
  const { mockGroupingService, reset: resetGrouping } =
    createMockGroupingService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CourseService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: UniversityService, useValue: mockUniversityService },
        { provide: GroupingService, useValue: mockGroupingService },
      ],
    }).compile();

    service = module.get(CourseService);
  });

  afterEach(() => {
    resetDb();
    resetUni();
    resetGrouping();
  });

  //TESTS
  describe('Test_Create', () => {
    //UnHappy - university doesn't exist
    it('should throw if university doesnt exist', async () => {
      //Arrange
      const dto = createCourseDto();
      mockUniversityService.getById?.mockRejectedValue(new NotFoundException());

      mockTransaction(mockDb, {});

      //Act+Assert
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(mockUniversityService.getById).toHaveBeenCalled();
    });

    //UnHappy - failed to create new course
    it('should throw if it failed to create new course', async () => {
      //Arrange
      const dto = createCourseDto();
      const uni = createUniversity();
      mockUniversityService.getById?.mockResolvedValue(uni);

      mockTransaction(mockDb, {
        select: [[]], //duplicateCourseNamePerUniversity
        insert: [[]],
      });

      //Act + Assert
      await expect(service.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockUniversityService.getById).toHaveBeenCalled();
    });

    //Happy - create course without group
    it('should create a course without a group', async () => {
      //Arrange
      const dto = createCourseDto();
      const uni = createUniversity();
      mockUniversityService.getById?.mockResolvedValue(uni);

      const newCourse = createCourse(dto);
      mockTransaction(mockDb, {
        select: [[]], //duplicateCourseNamePerUniversity
        insert: [[newCourse]],
      });

      //Act
      const result = await service.create(dto);

      //Assert
      expect(result).toMatchObject(newCourse);
      expect(mockUniversityService.getById).toHaveBeenCalled();
    });

    //Happy - create course with group
    it('should create new course with a group', async () => {
      //Arrange
      const dto = createCourseDto({ GroupID: groupId });
      const uni = createUniversity();
      mockUniversityService.getById?.mockResolvedValue(uni);

      const group = createGroup({ GroupID: groupId });
      mockGroupingService.getById?.mockResolvedValue(group);

      const newCourse = createCourse(dto);
      mockTransaction(mockDb, {
        select: [[]], //duplicateCourseNamePerUniversity
        insert: [[newCourse]],
      });

      //Act
      const result = await service.create(dto);

      //Assert
      expect(result).toMatchObject(newCourse);
      expect(mockUniversityService.getById).toHaveBeenCalled();
      expect(mockGroupingService.getById).toHaveBeenCalled();
    });

    //Happy - already exists a course like that -> return early
    it('should return course if already exists', async () => {
      //Arrange
      const dto = createCourseDto();
      const uni = createUniversity();
      mockUniversityService.getById?.mockResolvedValue(uni);

      const course = createCourse(dto);
      mockTransaction(mockDb, {
        select: [[course]], //duplicateCourseNamePerUniversity
      });

      //Act
      const result = await service.create(dto);

      //Assert
      expect(result).toMatchObject(course);
      expect(mockUniversityService.getById).toHaveBeenCalled();
    });
  }); //END_Test_Create

  describe('Test_GetAll', () => {
    //UnHappy - return empty array of courses
    it('should return empty array of courses if none found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await service.getAll({});

      //Assert
      expect(result).toMatchObject({ courses: [] });
    });

    //Happy - return array of courses
    it('should return array of courses', async () => {
      //Arrange
      const courses = [createCourse(), createCourse()];
      mockDbResult(mockDb.select, courses);

      const filters: CourseFilters = {
        CourseName: 'someName',
        UniversityID: 'someID',
        Degree: 'someDegree',
      };

      //Act
      const result = await service.getAll(filters);

      //Assert
      expect(result).toMatchObject({ courses: courses });
    });
  }); //END_Test_GetAll

  describe('Test_GetById', () => {
    //UnHappy - throw if course doesnt exist
    it('should throw if the course does not exist', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(service.getById(courseId)).rejects.toThrow(
        NotFoundException,
      );
    });

    //Happy - return the course by id
    it('should return the course by id', async () => {
      //Arrange
      const course = createCourse();
      mockDbResult(mockDb.select, [course]);

      //Act
      const result = await service.getById(course.CourseID);

      //Assert
      expect(result).toMatchObject(course);
    });
  }); //END_Test_GetById
}); //END_CourseService
