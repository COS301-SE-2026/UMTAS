import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DatabaseService } from 'src/db/database.service';
import { Course, GroupModules, modules } from 'src/entities';

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
