import {
  NotFoundException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq, and, SQL, getTableColumns, ilike } from 'drizzle-orm';

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
} from './dto/module.dto';

//ENtities
import {
  Course,
  GroupModules,
  ModuleEnrollment,
  ModuleGrouping,
  University,
  UniversityRole,
} from '../entities/index';

//Services
import { DatabaseService } from '../db/database.service';
import { CourseService } from '../Course/course.service';
import { GroupingService } from '../Grouping/grouping.service';

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
  ): Promise<ModuleSingleResponseDto> {
    const code = dto.moduleCode?.trim().toUpperCase();
    const name = dto.moduleName?.trim();
    const description = dto.moduleDescription?.trim();
    const courseId = dto.CourseID;
    let groupId = dto.ModuleGroupingID;

    //if courseId provided and doesn't exist -> throw fit
    if (courseId) {
      //get course
      const course = await this.courseService.getById(courseId);

      //If group defined for course -> continue | else -> create group for course
      if (!course.GroupID) {
        const newGroup = await this.groupingService.createModuleGrouping({
          CourseID: courseId,
        });
        groupId = newGroup.GroupID;
      } else groupId = course.GroupID;
    } //END_courseId

    if (groupId) {
      //check that module Grouping groupId is valid
      console.log('This should be null ', groupId);
      await this.groupingService.getById(groupId);

      //Check for duplicate moduleCode in ModuleGrouping
      if (await this.existingModuleCodeForModuleGrouping(code, groupId))
        throw new ConflictException(
          `Module code [${code}] already exists for ModuleGrouping[${groupId}]`,
        );
    } else {
      //If still no groupId
      //-> this means no groupId or courseId provided
      //-> Create new group for module
      const moduleGrouping = await this.groupingService.createModuleGrouping(
        {},
      );

      groupId = moduleGrouping.GroupID;
    } //END_if-else

    //Create new module
    const [newModule] = await this.dbService.db
      .insert(modules)
      .values({
        moduleCode: code,
        moduleName: name,
        moduleDescription: description,
      })
      .returning();

    if (!newModule)
      throw new InternalServerErrorException('Module failed to be created');

    //Group module to its group
    const groupModule = await this.groupingService.populateGroup(groupId, [
      newModule.moduleID,
    ]);

    //if grouping failed
    if (!groupModule)
      throw new InternalServerErrorException(
        `Failed to group module[${newModule.moduleID}] to group [${groupId}]`,
      );

    console.log(`CreateModule: dto.styling: ${JSON.stringify(dto.styling)}`);
    //Styling
    if (dto.styling) {
      const styling = await this.setStyling(
        newModule.moduleID,
        userId,
        dto.styling.colour,
      );

      return {
        ...newModule,
        styling: styling.styling,
      };
    }

    return newModule;
  } //create

  //return all modules
  //courseId -> Return all modules for course
  //universityId -> Return all modules for university
  //else -> return all modules user is enrolled in
  async getAll(
    userId: string,
    filters: ModuleFiltersDto,
  ): Promise<ModuleListResponseDto> {
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
    const foundModules = await this.dbService.db
      .selectDistinct({
        ...getTableColumns(modules),
        ModuleGroupingID: GroupModules.GroupID,
        CourseID: Course.CourseID,
        styling: ModuleStyling.styling,
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
  ): Promise<ModuleSingleResponseDto> {
    const [module] = await this.dbService.db
      .select({
        ...getTableColumns(modules),
        styling: ModuleStyling.styling,
      })
      .from(modules)
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
  ): Promise<ModuleSingleResponseDto> {
    //check that module exists
    const oldModule = await this.getById(userId, moduleId);

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

    let newModule = oldModule;
    //If no updateFields - return module early
    if (Object.keys(updateFields).length === 0 && !dto.styling)
      return oldModule;
    else if (Object.keys(updateFields).length > 0) {
      //update module
      const [nuweModule] = await this.dbService.db
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
      newStyling = (await this.setStyling(moduleId, userId, dto.styling.colour))
        .styling;

      newStyling = { colour: dto.styling.colour };
    } else {
      //Keep original styling - is this really necessary?

      newStyling = oldModule.styling || null;
    }

    return {
      ...newModule,
      styling: newStyling,
    };
  } //update

  async deleteById(moduleId: string): Promise<DeleteModuleResponseDto> {
    //delete actual module
    const [module] = await this.dbService.db
      .delete(modules)
      .where(eq(modules.moduleID, moduleId))
      .returning();

    return {
      moduleCode: module.moduleCode,
      success: !!module,
    };
  } //delete

  //SUbscribe user to module -> moduleEnrollment
  async enrollToModule(
    userId: string,
    moduleId: string,
  ): Promise<EnrolResponseDto> {
    //Check if module exists
    await this.getById(userId, moduleId);

    //Check if user already enrolled to module
    const [enrollmentStatus] = await this.dbService.db
      .select()
      .from(ModuleEnrollment)
      .where(
        and(
          eq(ModuleEnrollment.UserID, userId),
          eq(ModuleEnrollment.ModuleID, moduleId),
        ),
      )
      .limit(1);

    //If user already enrolled, return early
    if (enrollmentStatus)
      return {
        moduleID: moduleId,
        UserID: userId,
        message: `User[${userId}] already enrolled for module[${moduleId}]`,
      };

    //Enroll student to module
    const newlyEnrolled = await this.dbService.db
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

  //🎅's Little Helpers

  //Check if a module already exists for the ModuleGrouping
  //True for duplicate | false otherwise
  private async existingModuleCodeForModuleGrouping(
    moduleCode: string,
    groupId: string,
  ): Promise<boolean> {
    const [existingModule] = await this.dbService.db
      .select()
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
  async setStyling(moduleId: string, userId: string, styling: string) {
    const styleJson = { colour: styling };

    //Check if styling already exists for module+user
    let [modStyle] = await this.dbService.db
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
      [modStyle] = await this.dbService.db
        .insert(ModuleStyling)
        .values({
          ModuleID: moduleId,
          UserID: userId,
          styling: styleJson,
        })
        .returning();
    } else {
      //Update styling
      [modStyle] = await this.dbService.db
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
  async getStyling(moduleId: string, userId: string) {
    const [styling] = await this.dbService.db
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
  async getUniForModule(moduleId: string) {
    const [uni] = await this.dbService.db
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
  ): Promise<boolean> {
    //Returns true if module is owned by user, false otherwise
    //IF STUDENT_OWNED, and module belongs to course that belongs to university of STUDENT_OWNED UniversityRole entity, then student owns module
    const [module] = await this.dbService.db
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
  ): Promise<ModuleStylingResponseDto> {
    const module = await this.getById(userID, moduleID);

    const updatedStyling = await this.setStyling(
      moduleID,
      userID,
      dto.styling.colour,
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
} //ModuleService
