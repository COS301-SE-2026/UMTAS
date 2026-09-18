import { Test } from '@nestjs/testing';

//Constants
import { userId } from '../Testing/constants';

//Actual Services
import { CourseEnrollmentService } from './course.enrollment.service';
import { CourseServiceV2 } from './courseV2.service';
import { DatabaseService } from '../db/database.service';
import { GroupingService } from '../Grouping/grouping.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { mockTransaction } from '../Testing/Mocks/database.helpers';
import { createCourse } from '../Testing/Factories';

//Mock Services
import { createMockCourseServiceV2 } from '../Testing/Mocks/services';

//Errors thrown
import { InternalServerErrorException } from '@nestjs/common';

//DTO's

describe('CourseEnrollmentService', () => {
  let service: CourseEnrollmentService;

  const { mockDb, reset: resetDb } = createMockDatabase();

  const { mockCourseServiceV2, reset: resetCourse } =
    createMockCourseServiceV2();

  const mockGroupingService = {
    populateGroup: jest.fn(),
    createModuleGrouping: jest.fn(),
  };

  //beforeEach
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CourseEnrollmentService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: CourseServiceV2, useValue: mockCourseServiceV2 },
        { provide: GroupingService, useValue: mockGroupingService },
      ],
    }).compile();

    service = module.get(CourseEnrollmentService);
  });

  //After each
  afterEach(() => {
    resetDb();
    resetCourse();
    jest.clearAllMocks();
  });

  const baseCourse = createCourse();

  //Tests
  describe('Test_enrollStudentToCourse', () => {
    //UnHappy - should throw if the insert fails
    it('should throw InternalServerError if enrollment insert fails', async () => {
      //Arrange
      mockCourseServiceV2.getById?.mockResolvedValue(baseCourse);

      mockTransaction(mockDb, {
        select: [[]], //not already enrolled
        insert: [[]], //insert returns nothing
      });

      //Act + Assert
      await expect(
        service.enrollStudentToCourse({
          userID: userId,
          courseID: baseCourse.CourseID,
        }),
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockGroupingService.populateGroup).not.toHaveBeenCalled();

      expect(mockGroupingService.createModuleGrouping).not.toHaveBeenCalled();
    });

    //Happy - should enroll a new student
    it('should enroll a student who is not yet enrolled', async () => {
      //Arrange
      const enrollment = {
        UserID: userId,
        CourseID: baseCourse.CourseID,
        enrolledAt: new Date(),
      };

      mockCourseServiceV2.getById?.mockResolvedValue(baseCourse);

      mockTransaction(mockDb, {
        select: [
          [], //not already enrolled
          [], //student has no module enrollments
        ],
        insert: [[enrollment]],
      });

      //Act
      const result = await service.enrollStudentToCourse({
        userID: userId,
        courseID: baseCourse.CourseID,
      });

      //Assert
      expect(result).toMatchObject({
        UserID: userId,
        CourseID: baseCourse.CourseID,
      });

      expect(mockDb.insert).toHaveBeenCalledTimes(1);

      expect(mockGroupingService.populateGroup).not.toHaveBeenCalled();

      expect(mockGroupingService.createModuleGrouping).not.toHaveBeenCalled();
    });

    //Happy - should return early if already enrolled
    it('should return existing enrollment if student is already enrolled', async () => {
      //Arrange
      const enrolledAt = new Date('2026-01-01');

      mockCourseServiceV2.getById?.mockResolvedValue(baseCourse);

      mockTransaction(mockDb, {
        select: [[{ enrolledAt }]], //already enrolled
      });

      //Act
      const result = await service.enrollStudentToCourse({
        userID: userId,
        courseID: baseCourse.CourseID,
      });

      //Assert
      expect(result).toMatchObject({
        UserID: userId,
        CourseID: baseCourse.CourseID,
        EnrolledAt: enrolledAt,
      });

      expect(mockDb.insert).not.toHaveBeenCalled();

      expect(mockGroupingService.populateGroup).not.toHaveBeenCalled();

      expect(mockGroupingService.createModuleGrouping).not.toHaveBeenCalled();
    });

    //Happy - should populate existing course grouping with student's modules
    it('should add student modules to the existing course grouping', async () => {
      //Arrange
      const groupId = '00000000-0000-4000-8000-000000000001';

      const courseWithGroup = {
        ...baseCourse,
        GroupID: groupId,
      };

      const enrollment = {
        UserID: userId,
        CourseID: courseWithGroup.CourseID,
        enrolledAt: new Date(),
      };

      const studentModules = [
        {
          ModuleID: '10000000-0000-4000-8000-000000000001',
        },
        {
          ModuleID: '20000000-0000-4000-8000-000000000002',
        },
      ];

      mockCourseServiceV2.getById?.mockResolvedValue(courseWithGroup);

      mockGroupingService.populateGroup.mockResolvedValue({
        GroupID: groupId,
        Hash: 'hash',
        modules: studentModules.map((module) => module.ModuleID),
      });

      mockTransaction(mockDb, {
        select: [
          [], //not already enrolled
          studentModules, //student module enrollments
        ],
        insert: [[enrollment]],
      });

      //Act
      const result = await service.enrollStudentToCourse({
        userID: userId,
        courseID: courseWithGroup.CourseID,
      });

      //Assert
      expect(result).toMatchObject({
        UserID: userId,
        CourseID: courseWithGroup.CourseID,
      });

      expect(mockGroupingService.populateGroup).toHaveBeenCalledTimes(1);

      expect(mockGroupingService.populateGroup).toHaveBeenCalledWith(
        groupId,
        [
          '10000000-0000-4000-8000-000000000001',
          '20000000-0000-4000-8000-000000000002',
        ],
        undefined,
      );

      expect(mockGroupingService.createModuleGrouping).not.toHaveBeenCalled();
    });

    //Happy - should create grouping if course has no group
    it('should create a module grouping if the course does not have one', async () => {
      //Arrange
      const courseWithoutGroup = {
        ...baseCourse,
        GroupID: null,
      };

      const enrollment = {
        UserID: userId,
        CourseID: courseWithoutGroup.CourseID,
        enrolledAt: new Date(),
      };

      const studentModules = [
        {
          ModuleID: '10000000-0000-4000-8000-000000000001',
        },
        {
          ModuleID: '20000000-0000-4000-8000-000000000002',
        },
      ];

      mockCourseServiceV2.getById?.mockResolvedValue(courseWithoutGroup);

      mockGroupingService.createModuleGrouping.mockResolvedValue({
        GroupID: '00000000-0000-4000-8000-000000000003',
        Hash: 'hash',
        modules: studentModules.map((module) => module.ModuleID),
      });

      mockTransaction(mockDb, {
        select: [
          [], //not already enrolled
          studentModules, //student module enrollments
        ],
        insert: [[enrollment]],
      });

      //Act
      const result = await service.enrollStudentToCourse({
        userID: userId,
        courseID: courseWithoutGroup.CourseID,
      });

      //Assert
      expect(result).toMatchObject({
        UserID: userId,
        CourseID: courseWithoutGroup.CourseID,
      });

      expect(mockGroupingService.createModuleGrouping).toHaveBeenCalledTimes(1);

      expect(mockGroupingService.createModuleGrouping).toHaveBeenCalledWith(
        {
          CourseID: courseWithoutGroup.CourseID,
          modules: [
            '10000000-0000-4000-8000-000000000001',
            '20000000-0000-4000-8000-000000000002',
          ],
        },
        undefined,
      );

      expect(mockGroupingService.populateGroup).not.toHaveBeenCalled();
    });

    //Happy - should not duplicate module IDs
    it('should remove duplicate module IDs before populating the course grouping', async () => {
      //Arrange
      const groupId = '00000000-0000-4000-8000-000000000001';
      const moduleId = '10000000-0000-4000-8000-000000000001';

      const courseWithGroup = {
        ...baseCourse,
        GroupID: groupId,
      };

      const enrollment = {
        UserID: userId,
        CourseID: courseWithGroup.CourseID,
        enrolledAt: new Date(),
      };

      mockCourseServiceV2.getById?.mockResolvedValue(courseWithGroup);

      mockTransaction(mockDb, {
        select: [
          [], //not already enrolled
          [{ ModuleID: moduleId }, { ModuleID: moduleId }], //duplicate module enrollments
        ],
        insert: [[enrollment]],
      });

      //Act
      await service.enrollStudentToCourse({
        userID: userId,
        courseID: courseWithGroup.CourseID,
      });

      //Assert
      expect(mockGroupingService.populateGroup).toHaveBeenCalledWith(
        groupId,
        [moduleId],
        undefined,
      );
    });
  }); //END_Test_enrollStudentToCourse

  describe('Test_unenrollStudentFromCourse', () => {
    //UnHappy - should throw if the delete of the enrollment fails
    it('should throw InternalServerError if unenroll delete fails', async () => {
      //Arrange
      mockCourseServiceV2.getById?.mockResolvedValue(baseCourse);

      mockTransaction(mockDb, {
        select: [[{ UserID: userId }]], //already enrolled
        delete: [[]], //delete returns nothing
      });

      //Act + Assert
      await expect(
        service.unenrollStudentFromCourse({
          userID: userId,
          courseID: baseCourse.CourseID,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    //Happy - should return early if the student is not enrolled
    it('should return early if the student is not enrolled', async () => {
      //Arrange
      mockCourseServiceV2.getById?.mockResolvedValue(baseCourse);

      mockTransaction(mockDb, {
        select: [[]], //not already enrolled
      });

      //Act
      const result = await service.unenrollStudentFromCourse({
        userID: userId,
        courseID: baseCourse.CourseID,
      });

      //Assert
      expect(result.message).toContain('not enrolled');

      expect(mockDb.delete).not.toHaveBeenCalled();
    });

    //Happy - should unenroll student but leave modules and grouping unchanged
    it('should unenroll the student without modifying module enrollments or course grouping', async () => {
      //Arrange
      mockCourseServiceV2.getById?.mockResolvedValue(baseCourse);

      mockTransaction(mockDb, {
        select: [[{ UserID: userId }]], //already enrolled
        delete: [
          [
            {
              UserID: userId,
              CourseID: baseCourse.CourseID,
            },
          ],
        ],
      });

      //Act
      const result = await service.unenrollStudentFromCourse({
        userID: userId,
        courseID: baseCourse.CourseID,
      });

      //Assert
      expect(result).toMatchObject({
        UserID: userId,
        CourseID: baseCourse.CourseID,
      });

      expect(result.message).toBe(
        'Successfully unenrolled student from course',
      );

      expect(mockDb.delete).toHaveBeenCalledTimes(1);

      expect(mockGroupingService.populateGroup).not.toHaveBeenCalled();

      expect(mockGroupingService.createModuleGrouping).not.toHaveBeenCalled();
    });
  }); //END_Test_unenrollStudentFromCourse
}); //END_CourseEnrollmentService
