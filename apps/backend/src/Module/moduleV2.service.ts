import { AppDatabase, DatabaseService } from 'src/db/database.service';
import {
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
    try {
      if (!tx) {
        return this.dbService.db.transaction(async (t: AppDatabase) => {
          return this.create(userId, dto, t);
        }); //END_transaction
      } //END_transaction precencer check

      //Get + Validate GroupId with CourseID and ModulegroupingID
      const groupId = await this.getGroupId(
        tx,
        dto.CourseID,
        dto.ModuleGroupingID,
      );

      //Validate dto
      const validatedDto: CreateModuleDto =
        await this.validateCreateModuleDto(dto);

      const code = validatedDto.moduleCode;
      const name = validatedDto.moduleName;
      const description = validatedDto.moduleDescription;
      const ExternalID = validatedDto.ExternalID;
      const validated = validatedDto.validated;

      //Check for duplicate moduleCode in ModuleGrouping
      const existing = await this.existingModuleCodeForModuleGroupingV2(
        userId,
        code,
        groupId,
        tx,
      );

      if (existing) return existing; //Return Early if already exists

      //Create new module
      const [newModule] = await tx
        .insert(modules)
        .values({
          moduleCode: code,
          moduleName: name,
          moduleDescription: description,
          validated,
          ExternalID,
        })
        .returning();

      if (!newModule) {
        this.OOPSIE.fatal(
          `Failed to create module for CreateModuleDto[${JSON.stringify(validatedDto)}]`,
        );
        throw new InternalServerErrorException('Module failed to be created');
      }

      //Start constructing response
      const response: ModuleSingleResponseDto = {
        ...newModule,
      };

      //Group module to its group
      const moduleGroup = await this.groupingService.populateGroup(
        groupId,
        [newModule.moduleID],
        tx,
      );

      response.ModuleGroupingID = moduleGroup.GroupID;

      //Course Module metadata logic - only when courseId specified
      const courseId = dto.CourseID;

      if (courseId && dto.CourseModuleInfo) {
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

        if (!groupModule) {
          this.OOPSIE.error(
            `No GroupModules entry for your module[${JSON.stringify(response)}]`,
          );
          throw new InternalServerErrorException(
            `Couldn't find group module entry in join table :(`,
          );
        }

        //Default fields
        const core = validatedDto.CourseModuleInfo?.Core ?? false;
        const semOfStudy =
          validatedDto.CourseModuleInfo?.SemesterOfStudy ?? 'yearly';
        const yearOfStudy = validatedDto.CourseModuleInfo?.YearOfStudy ?? 1;

        //Add metadata to groupModule entity
        const [courseModuleInfo] = await tx
          .insert(CourseModule)
          .values({
            CourseID: courseId,
            GroupModuleID: groupModule.GroupModuleID,
            Core: core,
            SemesterOfStudy: semOfStudy,
            YearOfStudy: yearOfStudy,
          })
          .returning();

        if (!courseModuleInfo) {
          this.OOPSIE.fatal(
            `Failed to add CourseModule metadata for groupModule entry[${groupModule.GroupModuleID}]`,
          );
          throw new InternalServerErrorException(
            `Failed to add CourseModule metadata for groupModule entry[${groupModule.GroupModuleID}]`,
          );
        }

        response.CourseModuleInfo = courseModuleInfo;
      } //END_COurseModule metadata logic

      //Styling
      if (dto.styling) {
        const styling = await this.setStyling(
          newModule.moduleID,
          userId,
          dto.styling.colour,
          tx,
        );

        response.styling = styling.styling;
      } //END_Styling

      return response;
    } catch (error) {
      this.OOPSIE.warn(`create: Something went wrong - [${error}]`);
      throw new InternalServerErrorException(
        `CreateModule - V2: Something went wrong`,
      );
    }
  }

  //getAllV2, overwrite

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

  //🎅's little helpers
  protected async getGroupId(
    tx: AppDatabase,
    courseId?: string,
    groupId?: string,
  ): Promise<string> {
    if (courseId) {
      //Validate courseId
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

      return groupId;
    }

    //Check if Group provided else just create a group
    if (groupId) {
      //Validate groupId - will throw
      await this.groupingService.getById(groupId, tx);

      return groupId;
    } else {
      const moduleGrouping = await this.groupingService.createModuleGrouping(
        {},
        tx,
      );

      groupId = moduleGrouping.GroupID;

      return groupId;
    } //END_if-else
  }

  protected async validateCreateModuleDto(
    dto: CreateModuleDto,
  ): Promise<CreateModuleDto> {
    const v: CreateModuleDto = {
      //moduleCode
      moduleCode:
        dto.moduleCode.trim().length !== 0
          ? dto.moduleCode.trim().toUpperCase()
          : 'MODULECODE',

      //ModuleName
      moduleName:
        dto.moduleName.trim().length !== 0
          ? dto.moduleName.trim()
          : 'Module Name',

      //ModuleDescription
      moduleDescription:
        dto.moduleDescription && dto.moduleDescription.trim().length !== 0
          ? dto.moduleDescription.trim()
          : 'Module Description',

      //Styling
      styling: dto.styling ?? { colour: '#ffffff' },

      //Validated
      validated: dto.validated ?? true,

      //ExternalID
      ExternalID: dto.ExternalID,
    };

    return v;
  }

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
}
