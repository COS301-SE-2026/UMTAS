import { Injectable } from '@nestjs/common';
import { BaseSeedService } from '../base.seed.service';

import { DatabaseService } from '../../database.service';
import { eq, inArray, and } from 'drizzle-orm';

//Tables
import { Course, University } from '../../../entities';
import { SeedPersistenceService } from '../seed-persistence.service';

@Injectable()
export class CourseSeedService extends BaseSeedService {
  constructor(private readonly persistence: SeedPersistenceService) {
    super();
  }

  async seed(tx: DatabaseService['db']): Promise<void> {
    //If course exists -> grouping should exist
    const courseNames = this.constants.CourseNames;
    const courseDegrees = this.constants.CourseDegrees;

    //Get UniversityOfPta
    const [uni] = await tx
      .select()
      .from(University)
      .where(eq(University.UniversityName, this.constants.UniversityNames[0]))
      .limit(1);

    const courses = courseNames.map((name, index) => ({
      UniversityID: uni.UniversityID,
      CourseName: name,
      Degree: courseDegrees[index],
    }));

    //Get already existing courses
    const existingCourses = await tx
      .select()
      .from(Course)
      .where(
        and(
          eq(Course.UniversityID, uni.UniversityID),
          inArray(Course.CourseName, courseNames),
          inArray(Course.Degree, courseDegrees),
        ),
      );

    //Get the missing courses from the existing CourseNames
    const existingCourseNames = new Set(
      existingCourses.map((course) => course.CourseName),
    );
    const missingCourses = courses.filter(
      (course) => !existingCourseNames.has(course.CourseName),
    );

    if (missingCourses.length > 0) {
      //First create groups for the courses
      const groups = await this.persistence.insertGroupings(
        tx,
        missingCourses.map(() => ({
          Hash: null,
        })),
      );

      //seed in missing courses
      const courses = await this.persistence.insertCourses(
        tx,
        missingCourses.map((course, index) => ({
          ...course,
          GroupID: groups[index].GroupID,
        })),
      );

      this.logResult('Courses', courses.length);
    } else {
      this.logResult('Courses');
    }
  } //END_seed
} //END_CourseSeedService
