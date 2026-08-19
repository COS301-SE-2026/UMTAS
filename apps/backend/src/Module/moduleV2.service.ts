import { AppDatabase, DatabaseService } from 'src/db/database.service';
import {
  CourseModuleDto,
  CreateModuleDto,
  EnrollToModuleDto,
  EnrolResponseDto,
  ModuleFiltersDto,
  ModuleListResponseDto,
  ModuleSingleResponseDto,
} from './dto/module.dto';
import { ModuleService } from './module.service';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, getTableColumns, ilike, SQL } from 'drizzle-orm';
import {
  Course,
  CourseModule,
  GroupModules,
  ModuleEnrollment,
  ModuleGrouping,
  modules,
  ModuleStyling,
} from 'src/entities';
import { CourseService } from 'src/Course/course.service';
import { GroupingService } from 'src/Grouping/grouping.service';
import { EventService } from 'src/Events/event.service';

@Injectable()
export class ModuleServiceV2 extends ModuleService {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(
    protected readonly dbService: DatabaseService,
    protected readonly courseService: CourseService,
    protected readonly groupingService: GroupingService,
    @Inject(forwardRef(() => EventService))
    protected readonly eventService: EventService,
  ) {
    super(dbService, courseService, groupingService);
  }

  //Create
  async create(
    userId: string,
    dto: CreateModuleDto,
    tx?: AppDatabase,
  ): Promise<ModuleSingleResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.create(userId, dto, t);
      }); //END_transaction
    } //END_transaction precencer check

    const code = dto.moduleCode?.trim().toUpperCase();
    const name = dto.moduleName?.trim();
    const description = dto.moduleDescription?.trim();
    const courseId = dto.CourseID;
    let groupId = dto.ModuleGroupingID;

    //if courseId provided and doesn't exist -> throw fit
    if (courseId) {
      //get course
      const course = await this.courseService.getById(courseId, tx);

      //If group defined for course -> continue | else -> create group for course
      if (!course.GroupID) {
        const newGroup = await this.groupingService.createModuleGrouping(
          {
            CourseID: courseId,
          },
          tx,
        );
        groupId = newGroup.GroupID;
      } else groupId = course.GroupID;
    } //END_courseId

    if (groupId) {
      //check that module Grouping groupId is valid
      // console.log('This should be null ', groupId);
      await this.groupingService.getById(groupId, tx);

      //Check for duplicate moduleCode in ModuleGrouping
      const existing = await this.existingModuleCodeForModuleGroupingV2(
        userId,
        code,
        groupId,
        tx,
      );

      if (existing) return existing;
    } else {
      //If still no groupId
      //-> this means no groupId or courseId provided
      //-> Create new group for module
      const moduleGrouping = await this.groupingService.createModuleGrouping(
        {},
        tx,
      );

      groupId = moduleGrouping.GroupID;
    } //END_if-else

    //Create new module
    const [newModule] = await tx
      .insert(modules)
      .values({
        moduleCode: code,
        moduleName: name,
        moduleDescription: description,
        ...(dto.validated === undefined ? {} : { validated: dto.validated }),
      })
      .returning();

    if (!newModule)
      throw new InternalServerErrorException('Module failed to be created');

    //Group module to its group
    const moduleGroup = await this.groupingService.populateGroup(
      groupId,
      [newModule.moduleID],
      tx,
    );

    //Course Module metadata logic - only when courseId specified
    let courseModuleInfo: CourseModuleDto | null = null;
    if (dto.CourseID && dto.CourseModuleInfo) {
      //Check that necessary fields present -> else default
      const core = dto.CourseModuleInfo.Core;
      const semesterOfStudy =
        dto.CourseModuleInfo.SemesterOfStudy ?? 'No semester specified';
      const yearOfStudy = dto.CourseModuleInfo.YearOfStudy ?? 0;

      //Fetch GroupModule entry for module to add metadata to
      const [groupModule] = await tx
        .select()
        .from(GroupModules)
        .where(
          and(
            eq(GroupModules.GroupID, moduleGroup.GroupID),
            eq(GroupModules.ModuleID, newModule.moduleID),
          ),
        )
        .limit(1);

      if (!groupModule)
        throw new InternalServerErrorException(
          `Couldn't find group module entry in join table :(`,
        );

      //Add metadata to groupModule entity
      [courseModuleInfo] = await tx
        .insert(CourseModule)
        .values({
          CourseID: dto.CourseID,
          GroupModuleID: groupModule.GroupModuleID,
          Core: core,
          SemesterOfStudy: semesterOfStudy,
          YearOfStudy: yearOfStudy,
        })
        .returning();

      if (!courseModuleInfo)
        throw new InternalServerErrorException(
          `Failed to add CourseModule metadata for groupModule entry[${groupModule.GroupModuleID}]`,
        );
    } //END_COurseModule metadata logic

    //Styling
    if (dto.styling) {
      const styling = await this.setStyling(
        newModule.moduleID,
        userId,
        dto.styling.colour,
        tx,
      );

      return {
        ...newModule,
        styling: styling.styling,
        CourseModuleInfo: courseModuleInfo,
      };
    }

    return {
      ...newModule,
      CourseModuleInfo: courseModuleInfo,
    };
  }

  //getAllV2, overwrite
  protected async existingModuleCodeForModuleGroupingV2(
    userId: string,
    moduleCode: string,
    groupId: string,
    tx: DatabaseService['db'],
  ): Promise<ModuleSingleResponseDto | null> {
    const [existingModule] = await tx
      .select({
        moduleId: modules.moduleID,
      })
      .from(modules)
      .innerJoin(GroupModules, eq(GroupModules.ModuleID, modules.moduleID))
      .innerJoin(
        ModuleGrouping,
        eq(ModuleGrouping.GroupID, GroupModules.GroupID),
      )
      .where(
        and(
          eq(modules.moduleCode, moduleCode),
          eq(ModuleGrouping.GroupID, groupId),
        ),
      )
      .limit(1);

    if (existingModule === undefined) return null;

    //If module exists with moduleCode for moduleGrouping, return true else false
    return this.getById(userId, existingModule.moduleId);
  }

  async getAll(
    userId: string,
    filters: ModuleFiltersDto,
    tx?: AppDatabase,
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
    if (groupId) conditions.push(eq(GroupModules.GroupID, groupId));
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
        Events: (
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

  /**Get a module
   * @summary Will not attach styling/Events if userId not provided
   * @param options - moduleId! | userId? | tx?
   * @returns Module with Styling, Events and CourseModuleInformation
   *
   * @throws NotFoundException - Module not found for id provided
   */
  async getByIdV2(options: {
    moduleId: string;
    userId?: string;
    tx?: AppDatabase;
  }): Promise<ModuleSingleResponseDto> {
    const { userId, moduleId, tx } = options;

    const db = tx ?? this.dbService.db;

    if (moduleId.trim().length === 0)
      throw new BadRequestException(`Invalid moduleId`);

    const query = db
      .select({
        ...getTableColumns(modules),
        ...(userId ? { styling: ModuleStyling.styling } : {}),
        CourseModuleInfo: getTableColumns(CourseModule),
      })
      .from(modules)
      .innerJoin(GroupModules, eq(GroupModules.ModuleID, modules.moduleID))
      .leftJoin(
        CourseModule,
        eq(CourseModule.GroupModuleID, GroupModules.GroupModuleID),
      )
      .where(eq(modules.moduleID, moduleId))
      .limit(1);

    if (userId) {
      query.leftJoin(
        ModuleStyling,
        and(
          eq(ModuleStyling.UserID, userId),
          eq(ModuleStyling.ModuleID, modules.moduleID),
        ),
      );
    }

    const [module] = await query;

    if (!module) {
      this.OOPSIE.warn(`Module not found for [${moduleId}]`);
      throw new NotFoundException(`Module not found for [${moduleId}]`);
    }

    //Enrich with events - if userId provided
    if (userId) {
      const moduleWithEvents: ModuleSingleResponseDto = {
        ...module,
        Events: (
          await this.eventService.getAllEvents(userId, {
            moduleId: module.moduleID,
          })
        ).events,
      };

      return moduleWithEvents;
    }

    return module;
  }

  //EnrollToModule
  async enrollToModuleV2(
    userId: string,
    moduleId: string,
    dto: EnrollToModuleDto,
    tx?: DatabaseService['db'],
  ): Promise<EnrolResponseDto> {
    async function unenroll(userId: string, moduleId: string, tx: AppDatabase) {
      await tx
        .delete(ModuleEnrollment)
        .where(
          and(
            eq(ModuleEnrollment.UserID, userId),
            eq(ModuleEnrollment.ModuleID, moduleId),
          ),
        );
    }

    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.enrollToModuleV2(userId, moduleId, dto, t);
      }); //END_transaction
    } //END_transaction precencer check

    const enroll = dto.enroll;

    //Check if module exists
    await this.getByIdV2({ moduleId, tx });

    //Check if user already enrolled to module
    const [enrollmentStatus] = await tx
      .select()
      .from(ModuleEnrollment)
      .where(
        and(
          eq(ModuleEnrollment.UserID, userId),
          eq(ModuleEnrollment.ModuleID, moduleId),
        ),
      )
      .limit(1);

    //If already enrolled
    if (enrollmentStatus) {
      if (enroll) {
        //Defined and true
        return {
          moduleID: moduleId,
          UserID: userId,
          message: `User[${userId}] already enrolled in module[${moduleId}]`,
        };
      }

      unenroll(userId, moduleId, tx);
      //return successfull Unenrollment
      return {
        moduleID: moduleId,
        UserID: userId,
        message: `Successfully Unenrolled student[${userId}] from module[${moduleId}]`,
      };
    }

    if (enroll === undefined || enroll) {
      //Undefined and true
      //Enroll student to module
      const [newlyEnrolled] = await tx
        .insert(ModuleEnrollment)
        .values({
          UserID: userId,
          ModuleID: moduleId,
        })
        .returning();

      //Check if enrollment failed
      if (!newlyEnrolled)
        throw new InternalServerErrorException(
          `Failed to enroll student[${userId}] into module[${moduleId}]`,
        );

      //return successfull enrollment
      return {
        moduleID: moduleId,
        UserID: userId,
        message: `Successfully enrolled student[${userId}] into module[${moduleId}]`,
      };
    }

    //Return already unenrolled
    return {
      moduleID: moduleId,
      UserID: userId,
      message: `Student[${userId}] already unenrolled from module[${moduleId}]`,
    };
  } //END_enrollToModule
}
