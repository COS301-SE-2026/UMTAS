import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DatabaseService } from 'src/db/database.service';
import { Course, GroupModules, modules, University } from 'src/entities';

//Courses per University
interface CoursesPerUniversityResult {
  UniversityID: string;
  UniversityName: string;
  CourseCount: number;
}

//Modules per Course
interface ModulesPerCourseResult {
  CourseID: string;
  CourseName: string;
  ModuleCount: number;
}

@Injectable()
export class AnalyticsRepository {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(private readonly dbService: DatabaseService) {}

  //Courses per University
  async getCoursesPerUniversity(
    uniId: string,
  ): Promise<CoursesPerUniversityResult> {
    const db = this.dbService.db;

    //Fetch the university
    const [uni] = await db
      .select()
      .from(University)
      .where(eq(University.UniversityID, uniId))
      .limit(1);

    if (!uni) {
      this.OOPSIE.warn(`University[${uniId}] not found`);
      throw new NotFoundException(`University not found`);
    }

    //Fetch the course counts for that university
    const [result] = await db
      .select({ count: count() })
      .from(Course)
      .where(eq(Course.UniversityID, uniId));

    return {
      UniversityID: uniId,
      UniversityName: uni.UniversityName,
      CourseCount: Number(result?.count) || 0,
    };
  } //END_getCoursesPerUniversity

  async getModulesPerCourse(courseId: string): Promise<ModulesPerCourseResult> {
    const db = this.dbService.db;

    //Fetch Course
    const [course] = await db
      .select()
      .from(Course)
      .where(eq(Course.CourseID, courseId))
      .limit(1);

    if (!course) {
      this.OOPSIE.warn(`Course[${courseId}] not found`);
      throw new NotFoundException(`Course not found`);
    }

    //Fetch module count for course
    const [result] = await db
      .select({ count: count() })
      .from(modules)
      .leftJoin(GroupModules, eq(GroupModules.ModuleID, modules.moduleID))
      .leftJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
      .where(eq(Course.CourseID, courseId));

    return {
      CourseID: course.CourseID,
      CourseName: course.CourseName,
      ModuleCount: Number(result?.count) || 0,
    };
  } //END_getModulesPerCourse
} //END_coursesPerUniversity
