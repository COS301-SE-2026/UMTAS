import { DatabaseService } from 'src/db/database.service';
import { CourseService } from './course.service';
import { UniversityService } from 'src/University/university.service';
import { GroupingService } from 'src/Grouping/grouping.service';
import { forwardRef, Inject, NotFoundException } from '@nestjs/common';
import {
  CourseFiltersV2,
  CourseListResponseDtoV2,
  CourseModuleStatsResponseDto,
  CourseSingleResponseDto,
} from './dto/course.dto';
import { AppDatabase } from 'src/auth/auth';
import { and, countDistinct, desc, eq, ilike, SQL } from 'drizzle-orm';
import {
  Course,
  Event,
  GroupModules,
  modules,
  UniversityEvent,
} from 'src/entities';
import { ModuleServiceV2 } from 'src/Module/moduleV2.service';

export class CourseServiceV2 extends CourseService {
  constructor(
    protected readonly dbService: DatabaseService,
    protected readonly uniService: UniversityService,
    @Inject(forwardRef(() => GroupingService))
    protected readonly groupingService: GroupingService,
    @Inject(forwardRef(() => ModuleServiceV2))
    protected readonly moduleService: ModuleServiceV2,
  ) {
    super(dbService, uniService, groupingService);
  }

  async getAllV2(
    userId: string,
    filters: CourseFiltersV2,
    tx?: AppDatabase,
  ): Promise<CourseListResponseDtoV2> {
    const db = tx ?? this.dbService.db;

    const conditions: SQL[] = [];

    if (filters.CourseName)
      conditions.push(ilike(Course.CourseName, `%${filters.CourseName}%`));
    if (filters.UniversityID)
      conditions.push(eq(Course.UniversityID, filters.UniversityID));
    if (filters.Degree)
      conditions.push(ilike(Course.Degree, `%${filters.Degree}%`));

    const whereClause =
      conditions.length !== 0 ? and(...conditions) : undefined;

    const courses = await db.select().from(Course).where(whereClause);

    //Attach modules to course
    const coursesWithModules = await Promise.all(
      courses.map(async (course) => ({
        ...course,
        Modules: (
          await this.moduleService.getAll(
            userId,
            { courseId: course.CourseID },
            db,
          )
        ).modules,
      })),
    );

    return {
      courses: coursesWithModules,
      message: `Returned ${coursesWithModules.length} Courses`,
      ...(filters.Stats && filters.Stats === true
        ? {
            count: coursesWithModules.length,
          }
        : {}),
    };
  }

  async getByIdV2(
    userId: string,
    courseId: string,
    tx?: AppDatabase,
  ): Promise<CourseSingleResponseDto> {
    const db = tx ?? this.dbService.db;

    const [course] = await db
      .select()
      .from(Course)
      .where(eq(Course.CourseID, courseId))
      .limit(1);

    if (!course)
      throw new NotFoundException(`No course found for CourseID: ${courseId}`);

    //Map modules to course
    const courseWithModules = {
      ...course,
      Modules: (
        await this.moduleService.getAll(userId, { courseId: course.CourseID })
      ).modules,
    };

    return courseWithModules;
  }

  async getByExternalID(
    externalId: string,
    uniId: string,
  ): Promise<CourseSingleResponseDto | null> {
    const [course] = await this.dbService.db
      .select()
      .from(Course)
      .where(
        and(eq(Course.UniversityID, uniId), eq(Course.ExternalID, externalId)),
      )
      .limit(1);

    return course ?? null;
  }

  async getStatistics(uniId: string): Promise<CourseModuleStatsResponseDto> {
    const db = this.dbService.db;

    //Verify uni exists
    await this.uniService.getById(uniId, db);

    //Get stats
    const statistics = await db
      .select({
        CourseID: Course.CourseID,
        CourseName: Course.CourseName,
        ModuleCount: countDistinct(modules.moduleID),
        EventCount: countDistinct(Event.eventID),
      })
      .from(Course)
      .leftJoin(GroupModules, eq(GroupModules.GroupID, Course.GroupID))
      .leftJoin(modules, eq(modules.moduleID, GroupModules.ModuleID))
      .leftJoin(UniversityEvent, eq(UniversityEvent.moduleID, modules.moduleID))
      .leftJoin(Event, eq(Event.eventID, UniversityEvent.eventID))
      .where(eq(Course.UniversityID, uniId))
      .groupBy(Course.CourseID, Course.CourseName)
      .orderBy(
        desc(countDistinct(modules.moduleID)),
        desc(countDistinct(Event.eventID)),
      );

    return { data: statistics };
  } //END_getStatistics
} //END_COurseServiceV2
