import { AppDatabase } from 'src/auth/auth';
import { CourseServiceV2 } from './courseV2.service';
import { DatabaseService } from 'src/db/database.service';
import { CourseEnrollment, ModuleEnrollment } from 'src/entities';
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

@Injectable()
export class CourseEnrollmentService {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly courseService: CourseServiceV2,
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
    await this.courseService.getById(courseId);

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
      //get enrollment date
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
      //get enrollment date
      response.message = `Student[${userId}] not enrolled in course[${courseId}]`;

      return response;
    } //END_alreadyEnrolled

    //unenroll student from course
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
      //Failed to unenroll
      this.OOPSIE.fatal(
        `Failed to unenroll student[${userId}] from course[${courseId}]`,
      );
      throw new InternalServerErrorException(
        `Failed to unenroll student from course`,
      );
    }

    //Might change !!!!
    //If user unenrolls from course -> unenroll from relevant modules
    const modulesUnenrolledFrom = await tx
      .delete(ModuleEnrollment)
      .where(eq(ModuleEnrollment.UserID, userId))
      .returning();

    response.message = `Successfully unenrolled student from course and [${modulesUnenrolledFrom.length}] modules`;

    return response;
  } //END_unenrollStudentFromCourse
} //END_CourseEnrollmentService
