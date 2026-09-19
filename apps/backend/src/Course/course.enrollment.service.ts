import { AppDatabase } from 'src/auth/auth';
import { CourseServiceV2 } from './courseV2.service';
import { DatabaseService } from 'src/db/database.service';
import { CourseEnrollment } from 'src/entities';
import { and, eq } from 'drizzle-orm';
import {
  EnrollStudentToCourseResponseDto,
  UnenrollStudentFromCourseResponseDto,
} from './dto/course.enrollment.dto';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GroupingService } from 'src/Grouping/grouping.service';

@Injectable()
export class CourseEnrollmentService {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly courseService: CourseServiceV2,
    private readonly groupingService: GroupingService,
  ) {}

  async enrollStudentToCourse(options: {
    userID: string;
    courseID: string;
    tx?: AppDatabase;
  }): Promise<EnrollStudentToCourseResponseDto> {
    const tx = options.tx;

    if (!tx) {
      return await this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.enrollStudentToCourse({ ...options, tx: t });
      });
    } //END_tx precence check

    const userId = options.userID;
    const courseId = options.courseID;

    //Check that course exists - throws 404 if not exists
    const course = await this.courseService.getById(courseId);

    //Construct response
    const response: EnrollStudentToCourseResponseDto = {
      UserID: userId,
      CourseID: courseId,
      EnrolledAt: new Date(),
    };

    //Check if student already enrolled
    const [alreadyEnrolled] = await tx
      .select()
      .from(CourseEnrollment)
      .where(
        and(
          eq(CourseEnrollment.CourseID, courseId),
          eq(CourseEnrollment.UserID, userId),
        ),
      )
      .limit(1);

    //If already enrolled -> return early
    if (alreadyEnrolled) {
      response.EnrolledAt = alreadyEnrolled.enrolledAt;

      return response;
    } //END_alreadyEnrolled

    //Enroll student
    const [studentEnrolled] = await tx
      .insert(CourseEnrollment)
      .values({
        UserID: userId,
        CourseID: courseId,
        enrolledAt: new Date(),
      })
      .returning();

    //Insert failed
    if (!studentEnrolled) {
      this.OOPSIE.fatal(
        `Failed to create enrollment for student [${userId}] for course[${courseId}]`,
      );

      throw new InternalServerErrorException(
        `Failed to enroll student to course`,
      );
    }

    //Get all modules the student is currently enrolled in
    const studentModules = await tx
      .select({
        ModuleID: ModuleEnrollment.ModuleID,
      })
      .from(ModuleEnrollment)
      .where(eq(ModuleEnrollment.UserID, userId));

    const moduleIds = [
      ...new Set(studentModules.map((module) => module.ModuleID)),
    ];

    //Populate the course's ModuleGrouping with the student's modules
    if (moduleIds.length > 0) {
      if (course.GroupID) {
        await this.groupingService.populateGroup(course.GroupID, moduleIds, tx);
      } else {
        await this.groupingService.createModuleGrouping(
          {
            CourseID: courseId,
            modules: moduleIds,
          },
          tx,
        );
      }
    }

    return {
      ...response,
      EnrolledAt: studentEnrolled.enrolledAt,
    };
  } //END_enrollStudentToCourse

  async unenrollStudentFromCourse(options: {
    userID: string;
    courseID: string;
    tx?: AppDatabase;
  }): Promise<UnenrollStudentFromCourseResponseDto> {
    const tx = options.tx;

    if (!tx) {
      return await this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.unenrollStudentFromCourse({ ...options, tx: t });
      });
    } //END_tx precence check

    const userId = options.userID;
    const courseId = options.courseID;

    //Check that course exists - throw 404
    await this.courseService.getById(courseId);

    //Construct response
    const response: UnenrollStudentFromCourseResponseDto = {
      UserID: userId,
      CourseID: courseId,
    };

    //Check if student already enrolled
    const [alreadyEnrolled] = await tx
      .select()
      .from(CourseEnrollment)
      .where(
        and(
          eq(CourseEnrollment.CourseID, courseId),
          eq(CourseEnrollment.UserID, userId),
        ),
      )
      .limit(1);

    //If not enrolled -> return early
    if (!alreadyEnrolled) {
      response.message = `Student[${userId}] not enrolled in course[${courseId}]`;

      return response;
    } //END_alreadyEnrolled

    //Unenroll student from course
    const [deletedRecord] = await tx
      .delete(CourseEnrollment)
      .where(
        and(
          eq(CourseEnrollment.CourseID, courseId),
          eq(CourseEnrollment.UserID, userId),
        ),
      )
      .returning();

    if (!deletedRecord) {
      this.OOPSIE.fatal(
        `Failed to unenroll student[${userId}] from course[${courseId}]`,
      );

      throw new InternalServerErrorException(
        `Failed to unenroll student from course`,
      );
    }

    //Do not modify the course's ModuleGrouping when a student unenrolls.
    //The modules remain associated with the course and can be managed
    //by a university administrator.

    response.message = `Successfully unenrolled student from course`;

    return response;
  } //END_unenrollStudentFromCourse
} //END_CourseEnrollmentService
