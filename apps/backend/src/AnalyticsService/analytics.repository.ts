import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DatabaseService } from 'src/db/database.service';
import { Course, University } from 'src/entities';

interface CoursesPerUniversityResult {
  UniversityID: string;
  UniversityName: string;
  CourseCount: number;
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
} //END_coursesPerUniversity
