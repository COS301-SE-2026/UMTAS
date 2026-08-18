import { DatabaseService } from 'src/db/database.service';
import {
  ModuleFiltersDto,
  ModuleListResponseDto,
  ModuleSingleResponseDto,
} from './dto/module.dto';
import { ModuleService } from './module.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { and, eq, getTableColumns, ilike, SQL } from 'drizzle-orm';
import {
  Course,
  CourseModule,
  GroupModules,
  ModuleEnrollment,
  modules,
  ModuleStyling,
} from 'src/entities';
import { CourseService } from 'src/Course/course.service';
import { GroupingService } from 'src/Grouping/grouping.service';
import { EventService } from 'src/Events/event.service';

@Injectable()
export class ModuleServiceV2 extends ModuleService {
  constructor(
    protected readonly dbService: DatabaseService,
    protected readonly courseService: CourseService,
    protected readonly groupingService: GroupingService,
    @Inject(forwardRef(() => EventService))
    protected readonly eventService: EventService,
  ) {
    super(dbService, courseService, groupingService);
  }

  async getAll(
    userId: string,
    filters: ModuleFiltersDto,
    tx?: DatabaseService['db'],
  ): Promise<ModuleListResponseDto> {
    const db = tx ?? this.dbService.db;
    const uniId = filters.universityId?.trim();
    const courseId = filters.courseId?.trim();
    const groupId = filters.GroupID?.trim();
    const moduleCode = filters.moduleCode?.trim();
    const enroll = filters.userEnrollment;

    let foundModules: ModuleSingleResponseDto[] = [];

    const conditions: SQL[] = [];

    if (uniId) conditions.push(eq(Course.UniversityID, uniId));
    if (courseId) conditions.push(eq(CourseModule.CourseID, courseId));
    if (groupId) conditions.push(eq(Course.GroupID, groupId));
    if (moduleCode)
      conditions.push(ilike(modules.moduleCode, `%${moduleCode}%`));
    if (enroll) conditions.push(eq(ModuleEnrollment.UserID, userId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    foundModules = await db
      .select({
        ...getTableColumns(modules),
        styling: ModuleStyling.styling ?? null,
        CourseModuleInfo: getTableColumns(CourseModule),
      })
      .from(modules)
      .leftJoin(
        ModuleStyling,
        and(
          eq(ModuleStyling.ModuleID, modules.moduleID),
          eq(ModuleStyling.UserID, userId),
        ),
      )
      .leftJoin(GroupModules, eq(GroupModules.ModuleID, modules.moduleID))
      .leftJoin(
        CourseModule,
        eq(CourseModule.GroupModuleID, GroupModules.GroupModuleID),
      )
      .leftJoin(Course, eq(Course.CourseID, CourseModule.CourseID))
      .leftJoin(
        ModuleEnrollment,
        and(
          eq(ModuleEnrollment.ModuleID, modules.moduleID),
          eq(ModuleEnrollment.UserID, userId),
        ),
      )
      .where(whereClause)
      .orderBy(modules.moduleCode);

    //Filter for unique moduleIDs
    const uniqueModules = foundModules.filter(
      (module, index, self) =>
        index === self.findIndex((m) => m.moduleID === module.moduleID),
    );

    //Add events per module
    const modulesWithEvents = await Promise.all(
      uniqueModules.map(async (module) => ({
        ...module,
        events: (
          await this.eventService.getAllEvents(
            userId,
            {
              moduleId: module.moduleID,
            },
            tx,
          )
        ).events,
      })),
    ); //END_promise all

    return {
      modules: modulesWithEvents,
      message: `Returning: ${uniqueModules.length}-Modules. | With filters: ${JSON.stringify(filters)}`,
    };
  } //getAll
}
