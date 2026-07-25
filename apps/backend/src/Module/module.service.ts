import {
  NotFoundException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { eq, ne, and, SQL, getTableColumns, ilike, inArray } from 'drizzle-orm';

import { modules, ModuleStyling } from '../entities/Modules/index';
import {
  CreateModuleDto,
  DeleteModuleResponseDto,
  ModuleListResponseDto,
  ModuleSingleResponseDto,
  UpdateModuleDto,
  ModuleFiltersDto,
  ModuleStylingResponseDto,
  ModuleStylingBodyDto,
  EnrolResponseDto,
  AddModulesToCourseDto,
  AddModulesToCourseResponseDto,
  CourseModuleDto,
} from './dto/module.dto';

//ENtities
import {
  Course,
  CourseModule,
  GroupModules,
  ModuleEnrollment,
  ModuleGrouping,
  University,
  UniversityRole,
} from '../entities/index';

//Services
import { AppDatabase, DatabaseService } from '../db/database.service';
import { CourseService } from '../Course/course.service';
import { GroupingService } from '../Grouping/grouping.service';
import { GroupingSingleResponse } from 'src/Grouping/dto/grouping.dto';

//Module service
//If its user owned modules -> MUST BE HANDLED THROUGH BUILDER SERVICE
@Injectable()
export class ModuleService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly courseService: CourseService,
    private readonly groupingService: GroupingService,
  ) {}

  // Create module
  //If no moduleGroupingId provided -> create new module grouping for module
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
      if (await this.existingModuleCodeForModuleGrouping(code, groupId, tx))
        throw new ConflictException(
          `Module code [${code}] already exists for ModuleGrouping[${groupId}]`,
        );
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

    //if grouping failed -- removed this check, should be handled by grouping service
    // if (!moduleGroup)
    //   throw new InternalServerErrorException(
    //     `Failed to group module[${newModule.moduleID}] to group [${groupId}]`,
    //   );

    // console.log(`CreateModule: dto.styling: ${JSON.stringify(dto.styling)}`);

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
  } //create

  //return all modules
  //courseId -> Return all modules for course
  //universityId -> Return all modules for university
  //else -> return all modules user is enrolled in
  async getAll(
    userId: string,
    filters: ModuleFiltersDto,
    tx?: DatabaseService['db'],
  ): Promise<ModuleListResponseDto> {
    const db = tx ?? this.dbService.db;

    //define empty conditions array to be added to based of filters
    const conditions: SQL[] = [];

    //filters
    if (filters.universityId)
      conditions.push(eq(Course.UniversityID, filters.universityId));
    if (filters.courseId)
      conditions.push(eq(Course.CourseID, filters.courseId));
    if (filters.GroupID)
      conditions.push(eq(GroupModules.GroupID, filters.GroupID));
    if (filters.moduleCode)
      conditions.push(ilike(modules.moduleCode, `%${filters.moduleCode}%`));
    if (filters.userEnrollment)
      conditions.push(eq(ModuleEnrollment.UserID, userId));

    //Build actual query joining Modules -> ModuleEnrollment + CourseModule + Course and then add in dynamic where conditions
    const foundModules = await db
      .selectDistinctOn([modules.moduleID], {
        ...getTableColumns(modules),
        ModuleGroupingID: GroupModules.GroupID,
        CourseID: Course.CourseID,
        styling: ModuleStyling.styling,
        CourseModuleInfo: getTableColumns(CourseModule),
      })
      .from(modules)
      .leftJoin(
        ModuleStyling,
        and(
          eq(ModuleStyling.UserID, userId),
          eq(ModuleStyling.ModuleID, modules.moduleID),
        ),
      )
      .innerJoin(GroupModules, eq(GroupModules.ModuleID, modules.moduleID))
      .leftJoin(
        CourseModule,
        eq(CourseModule.GroupModuleID, GroupModules.GroupModuleID),
      )
      .leftJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
      .leftJoin(
        ModuleEnrollment,
        eq(ModuleEnrollment.ModuleID, modules.moduleID),
      )
      .where(and(...conditions));

    return { modules: foundModules };
  } //getAll

  async getById(
    userId: string,
    moduleId: string,
    tx?: DatabaseService['db'],
  ): Promise<ModuleSingleResponseDto> {
    const db = tx ?? this.dbService.db;

    const [module] = await db
      .select({
        ...getTableColumns(modules),
        styling: ModuleStyling.styling,
        CourseModuleInfo: getTableColumns(CourseModule),
      })
      .from(modules)
      .innerJoin(GroupModules, eq(GroupModules.ModuleID, modules.moduleID))
      .leftJoin(
        CourseModule,
        eq(CourseModule.GroupModuleID, GroupModules.GroupModuleID),
      )
      .leftJoin(
        ModuleStyling,
        and(
          eq(ModuleStyling.UserID, userId),
          eq(ModuleStyling.ModuleID, modules.moduleID),
        ),
      )
      .where(eq(modules.moduleID, moduleId))
      .limit(1);

    if (!module)
      throw new NotFoundException(`Module not found for [${moduleId}]`);

    return module;
  } //getById

  //Update module -> grouping/course logic not here anymore
  async update(
    userId: string,
    moduleId: string,
    dto: UpdateModuleDto,
    tx?: DatabaseService['db'],
  ): Promise<ModuleSingleResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.update(userId, moduleId, dto, t);
      }); //END_transaction
    } //END_transaction precencer check

    //check that module exists
    const oldModule = await this.getById(userId, moduleId, tx);

    //Define update fields
    const updateFields: Partial<typeof modules.$inferInsert> = {};
    if (
      dto.moduleCode &&
      dto.moduleCode.trim().toUpperCase() !== oldModule.moduleCode
    )
      updateFields.moduleCode = dto.moduleCode.trim().toUpperCase();
    if (dto.moduleName && dto.moduleName.trim() !== oldModule.moduleName)
      updateFields.moduleName = dto.moduleName.trim();
    if (
      dto.moduleDescription &&
      dto.moduleDescription.trim() !== oldModule.moduleDescription
    )
      updateFields.moduleDescription = dto.moduleDescription.trim();
    if (dto.validated !== undefined && dto.validated !== oldModule.validated)
      updateFields.validated = dto.validated;

    //Handle courseModule update -> requires courseId
    let courseModuleInfo: CourseModuleDto | null = null;
    if (dto.CourseID) {
      courseModuleInfo = await this.courseModuleUpdate(dto.CourseID, dto, tx);
    }

    let newModule = oldModule;
    //If no updateFields - return module early
    if (
      Object.keys(updateFields).length === 0 &&
      !dto.styling &&
      courseModuleInfo === null
    )
      return oldModule;
    else if (Object.keys(updateFields).length > 0) {
      //update module
      const [nuweModule] = await tx
        .update(modules)
        .set(updateFields)
        .where(eq(modules.moduleID, moduleId))
        .returning();

      if (!nuweModule)
        throw new InternalServerErrorException('Module failed to update');

      newModule = nuweModule;
    }

    // Styling update - any user can update styling as it doesn't influence module
    let newStyling: { colour: string } | null = null;
    if (dto.styling) {
      newStyling = (
        await this.setStyling(moduleId, userId, dto.styling.colour, tx)
      ).styling;

      newStyling = { colour: dto.styling.colour };
    } else {
      //Keep original styling - is this really necessary?

      newStyling = oldModule.styling || null;
    }

    return {
      ...newModule,
      styling: newStyling,
      CourseModuleInfo: courseModuleInfo,
    };
  } //update

  async deleteById(
    moduleId: string,
    tx?: DatabaseService['db'],
  ): Promise<DeleteModuleResponseDto> {
    const db = tx ?? this.dbService.db;

    //delete actual module
    const [module] = await db
      .delete(modules)
      .where(eq(modules.moduleID, moduleId))
      .returning();

    return {
      moduleCode: module?.moduleCode,
      success: !!module,
    };
  } //delete

  //SUbscribe user to module -> moduleEnrollment
  async enrollToModule(
    userId: string,
    moduleId: string,
    tx?: DatabaseService['db'],
  ): Promise<EnrolResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.enrollToModule(userId, moduleId, t);
      }); //END_transaction
    } //END_transaction precencer check

    //Check if module exists
    await this.getById(userId, moduleId, tx);

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

    //If user already enrolled, Unenroll them

    if (enrollmentStatus) {
      /*
      await tx
        .delete(ModuleEnrollment)
        .where(
          and(
            eq(ModuleEnrollment.UserID, userId),
            eq(ModuleEnrollment.ModuleID, moduleId),
          ),
        );
        */
      return {
        moduleID: moduleId,
        UserID: userId,
        message: `Unenrolled User[${userId}] from module[${moduleId}]`,
      };
    } //Unenroll

    //Enroll student to module
    const newlyEnrolled = await tx
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
  } //END_enrollToModule

  //Add array of modules to course through grouping service
  async addModulesToCourse(
    courseId: string,
    dto: AddModulesToCourseDto,
    tx?: DatabaseService['db'],
  ): Promise<AddModulesToCourseResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.addModulesToCourse(courseId, dto, t);
      }); //END_transaction
    } //END_transaction precencer check

    //Check that course exists
    const course = await this.courseService.getById(courseId, tx);

    //Check that each module exists
    const existingModules = await tx
      .select()
      .from(modules)
      .where(inArray(modules.moduleID, dto.modules));

    //If existing modules dont match size of specified modules -> throw fit
    if (existingModules.length !== dto.modules.length) {
      const existingIDs = new Set(
        existingModules.map((module) => module.moduleID),
      );
      const missingIDs = dto.modules.filter(
        (module) => !existingIDs.has(module),
      );

      throw new BadRequestException(
        `Modules provided do not exist: [${JSON.stringify(missingIDs)}]`,
      );
    } //missing modules response

    //Check if course already owns a group
    let group: GroupingSingleResponse;
    if (!course.GroupID) {
      //Create group for course with modules
      group = await this.groupingService.createModuleGrouping(
        {
          CourseID: course.CourseID,
          modules: dto.modules,
        },
        tx,
      );
    } else {
      //Check if other courses are making use of same group, event if only one
      const partnerCourses = await tx
        .select()
        .from(Course)
        .where(
          and(
            ne(Course.CourseID, course.CourseID),
            eq(Course.GroupID, course.GroupID),
          ),
        );

      //If Partner course exists -> Create new group as copy and add modules to new group
      if (partnerCourses.length > 0) {
        // console.log(`Partner courses identified. Amount: ${partnerCourses.length}`);
        //Get current groups modules
        const oldGroup = await this.groupingService.getById(course.GroupID, tx);

        const mergedModules: string[] = [
          ...(oldGroup.modules ?? []),
          ...dto.modules,
        ];

        // console.log(`MergedModules: ${JSON.stringify(mergedModules)}`);

        //Create new group with copy of modules + new modules
        group = await this.groupingService.createModuleGrouping(
          {
            CourseID: course.CourseID,
            modules: mergedModules,
          },
          tx,
        );
      } else {
        //no other course will be influenced, just update modules in group
        //Populate group for course
        group = await this.groupingService.populateGroup(
          course.GroupID,
          dto.modules,
          tx,
        );
      } //END_partnerCourse Check
    } //END_group exists for course check

    if (!group)
      throw new InternalServerErrorException(
        `Failed to populate course's group with modules`,
      );

    return {
      CourseID: courseId,
      modules: dto.modules,
    };
  } //END_addModulesToCourse

  //🎅's Little Helpers

  //Check if a module already exists for the ModuleGrouping
  //True for duplicate | false otherwise
  private async existingModuleCodeForModuleGrouping(
    moduleCode: string,
    groupId: string,
    tx: DatabaseService['db'],
  ): Promise<boolean> {
    const [existingModule] = await tx
      .select({ moduleCode: modules.moduleCode })
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

    //If module exists with moduleCode for moduleGrouping, return true else false
    return !!existingModule;
  } //END_existingModuleForCourse

  //Set module styling
  async setStyling(
    moduleId: string,
    userId: string,
    styling: string,
    tx?: DatabaseService['db'],
  ): Promise<typeof ModuleStyling.$inferSelect> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.setStyling(moduleId, userId, styling, t);
      }); //END_transaction
    } //END_transaction precencer check
    const styleJson = { colour: styling };

    //Check if styling already exists for module+user
    let [modStyle] = await tx
      .select()
      .from(ModuleStyling)
      .where(
        and(
          eq(ModuleStyling.ModuleID, moduleId),
          eq(ModuleStyling.UserID, userId),
        ),
      )
      .limit(1);

    if (!modStyle) {
      //Create style entry
      [modStyle] = await tx
        .insert(ModuleStyling)
        .values({
          ModuleID: moduleId,
          UserID: userId,
          styling: styleJson,
        })
        .returning();
    } else {
      //Update styling
      [modStyle] = await tx
        .update(ModuleStyling)
        .set({
          styling: styleJson,
        })
        .where(
          and(
            eq(ModuleStyling.ModuleID, moduleId),
            eq(ModuleStyling.UserID, userId),
          ),
        )
        .returning();
    }

    if (!modStyle)
      throw new InternalServerErrorException(`Module styling ceased to exist`);

    return modStyle;
  } //END_setStyling

  //Get module styling
  async getStyling(
    moduleId: string,
    userId: string,
    tx?: DatabaseService['db'],
  ) {
    const db = tx ?? this.dbService.db;

    const [styling] = await db
      .select()
      .from(ModuleStyling)
      .where(
        and(
          eq(ModuleStyling.ModuleID, moduleId),
          eq(ModuleStyling.UserID, userId),
        ),
      )
      .limit(1);

    return styling;
  } //END_getStyling

  //For external use ===========
  //Get University that owns module
  async getUniForModule(moduleId: string, tx?: DatabaseService['db']) {
    const db = tx ?? this.dbService.db;

    const [uni] = await db
      .select({
        UniversityID: University.UniversityID,
      })
      .from(University)
      .innerJoin(Course, eq(Course.UniversityID, University.UniversityID))
      .innerJoin(GroupModules, eq(GroupModules.GroupID, Course.GroupID))
      .where(eq(GroupModules.ModuleID, moduleId))
      .limit(1);

    return uni;
  } //END_getUniForModule

  async moduleOwnershipCheck(
    userId: string,
    moduleId: string,
    tx: DatabaseService['db'],
  ): Promise<boolean> {
    //Returns true if module is owned by user, false otherwise
    //IF STUDENT_OWNED, and module belongs to course that belongs to university of STUDENT_OWNED UniversityRole entity, then student owns module
    const [module] = await tx
      .select({
        moduleId: modules.moduleID,
      })
      .from(modules)
      .innerJoin(GroupModules, eq(GroupModules.ModuleID, modules.moduleID))
      .innerJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
      .innerJoin(University, eq(University.UniversityID, Course.UniversityID))
      .innerJoin(
        UniversityRole,
        eq(UniversityRole.UniversityID, University.UniversityID),
      )
      .where(
        and(
          eq(modules.moduleID, moduleId),
          eq(UniversityRole.UserID, userId),
          eq(UniversityRole.role, 'STUDENT_OWNED'),
        ),
      )
      .limit(1);

    return !!module;
  }

  async updateStylingService(
    userID: string,
    moduleID: string,
    dto: ModuleStylingBodyDto,
    tx?: DatabaseService['db'],
  ): Promise<ModuleStylingResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.updateStylingService(userID, moduleID, dto, t);
      }); //END_transaction
    } //END_transaction precencer check

    const module = await this.getById(userID, moduleID, tx);

    const updatedStyling = await this.setStyling(
      moduleID,
      userID,
      dto.styling.colour,
      tx,
    );
    console.log(updatedStyling);
    if (updatedStyling) {
      return {
        message: `Successfully updated the module ${module.moduleCode} updated to ${updatedStyling.styling.colour}`,
      };
    } else {
      throw new InternalServerErrorException(
        `Module styling not updated for ${module.moduleCode}`,
      );
    }
  }

  async courseModuleUpdate(
    courseId: string,
    dto: UpdateModuleDto,
    tx?: DatabaseService['db'],
  ): Promise<CourseModuleDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.courseModuleUpdate(courseId, dto, t);
      }); //END_transaction
    } //END_transaction precencer check

    //Get group module entry that courseMOdule refers to through COurseID
    const [groupModule] = await tx
      .select({
        GroupModuleID: GroupModules.GroupModuleID,
      })
      .from(GroupModules)
      .innerJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
      .where(eq(Course.CourseID, courseId))
      .limit(1);

    //Get old courseModuleInfo
    const [oldCourseModule] = await tx
      .select()
      .from(CourseModule)
      .where(eq(CourseModule.GroupModuleID, groupModule.GroupModuleID))
      .limit(1);

    //Get updateFields for courseMOdule data
    const courseUpdateFields: Partial<typeof CourseModule.$inferInsert> = {};
    if (dto.Core && dto.Core !== oldCourseModule.Core)
      courseUpdateFields.Core = dto.Core;
    if (
      dto.SemesterOfStudy &&
      dto.SemesterOfStudy !== oldCourseModule.SemesterOfStudy
    )
      courseUpdateFields.SemesterOfStudy = dto.SemesterOfStudy;
    if (dto.YearOfStudy && dto.YearOfStudy !== oldCourseModule.YearOfStudy)
      courseUpdateFields.YearOfStudy = dto.YearOfStudy;

    //Check if update field present
    let returnCourseModule = oldCourseModule;
    if (Object.keys(courseUpdateFields).length > 0) {
      //Update courseMOdule metadata appropriatly
      [returnCourseModule] = await tx
        .update(CourseModule)
        .set(courseUpdateFields)
        .where(eq(CourseModule.GroupModuleID, groupModule.GroupModuleID))
        .returning();
    }

    return returnCourseModule;
  } //END_courseModuleUpdate
} //ModuleService
