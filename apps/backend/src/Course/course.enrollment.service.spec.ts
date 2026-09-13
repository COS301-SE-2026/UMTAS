import { Test } from '@nestjs/testing';

//Constants
import { userId } from '../Testing/constants';

//Actual Services
import { CourseEnrollmentService } from './course.enrollment.service';
import { CourseServiceV2 } from './courseV2.service';
import { DatabaseService } from '../db/database.service';

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

  //beforeEach

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CourseEnrollmentService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: CourseServiceV2, useValue: mockCourseServiceV2 },
      ],
    }).compile();

    service = module.get(CourseEnrollmentService);
  });

  //After each
  afterEach(() => {
    resetDb();
    resetCourse();
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
        select: [[]], //not already enrolled
        insert: [[enrollment]], //insert returns new row
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

    //Happy - should unenroll the student and their module enrollments
    it('should unenroll the student and delete their module enrollments', async () => {
      //Arrange
      mockCourseServiceV2.getById?.mockResolvedValue(baseCourse);

      mockTransaction(mockDb, {
        select: [[{ UserID: userId }]], //already enrolled
        delete: [
          [{ UserID: userId, CourseID: baseCourse.CourseID }], //deleted enrollment
          [{ ModuleID: 'mod-1' }, { ModuleID: 'mod-2' }], //deleted modules
        ], //delete returns nothing
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
      expect(result.message).toContain(
        'Successfully unenrolled student from course and [2] modules',
      );
      expect(mockDb.delete).toHaveBeenCalledTimes(2);
    });
  }); //END_Test_unenrollStudentFromCourse
}); //END_CourseEnrollmentService
