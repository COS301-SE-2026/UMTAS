import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  NotImplementedException,
} from '@nestjs/common';
import { eq, and, SQL, getTableColumns } from 'drizzle-orm';

import { DatabaseService } from '../db/database.service';
import { modules, ModuleStyling } from '../entities/Modules/index';
import {
  CreateModuleDto,
  DeleteModuleResponseDto,
  ModuleListResponseDto,
  ModuleSingleResponseDto,
  UpdateModuleDto,
  ModuleFiltersDto
} from './dto/module.dto';
import { Course, CourseModule,  ModuleEnrollment, University, UniversityRole} from '../entities/index';
import { CourseService } from 'src/Course/course.service';
import { equal } from 'assert';


//Module service
//If its user owned modules -> MUST BE HANDLED THROUGH BUILDER SERVICE
@Injectable()
export class ModuleService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly courseService: CourseService
  ) {}

  // Create module
  async create(dto: CreateModuleDto): Promise<ModuleSingleResponseDto> {
    const code = dto.moduleCode?.trim().toUpperCase();
    const name = dto.moduleName?.trim();
    const courseId = dto.courseID?.trim();
    const description = dto.moduleDescription?.trim();

    //Check that course exists
    await this.courseService.getById(courseId);
    
    //If module with same code already exists for course -> throw a fit
    if (await this.existingModuleCodeForCourse(code, courseId))
        throw new ConflictException(`Module code [${code}] already exists for course [${courseId}]`);

    //Else create new module, ensure that courseModule join table also populated
    const [newModule] = await this.dbService.db
      .insert(modules)
      .values({
        moduleCode: code,
        moduleName: name,
        moduleDescription: description
      })
      .returning();

    if (!newModule)
      throw new InternalServerErrorException('Module not created');

    //Define module for course
    const [courseModule] = await this.dbService.db
      .insert(CourseModule)
      .values({
        ModuleID: newModule.moduleID,
        CourseID: courseId
      }).returning();

    if (!courseModule)
      throw new InternalServerErrorException(`CourseModule Join table insert failed for creating module: ${newModule.moduleCode}`);

    return newModule;
  } //create

  //return all modules
  //courseId -> Return all modules for course
  //universityId -> Return all modules for university
  //else -> return all modules user is enrolled in
  async getAll(userId: string, filters: ModuleFiltersDto): Promise<ModuleListResponseDto> {
    
    //define empty conditions array to be added to based of filters
    const conditions: SQL[] = [];

    //Dynamically add conditions for where clause based of filters
    if (filters.universityId)//universityId
      conditions.push(eq(Course.UniversityID, filters.universityId));
    else if (filters.courseId)//courseId
      conditions.push(eq(CourseModule.CourseID, filters.courseId));
    else //userId
      conditions.push(eq(ModuleEnrollment.UserID, userId));

    //Build actual query joining Modules -> ModuleEnrollment + CourseModule + Course and then add in dynamic where conditions
    const foundModules = await this.dbService.db
      .selectDistinct({
        ...getTableColumns(modules),
        styling: ModuleStyling.styling
      })
      .from(modules)
      .leftJoin(ModuleStyling, and(
        eq(ModuleStyling.UserID, userId),
        eq(ModuleStyling.ModuleID, modules.moduleID)
      ))
      .leftJoin(ModuleEnrollment, eq(ModuleEnrollment.ModuleID, modules.moduleID))
      .leftJoin(CourseModule, eq(CourseModule.ModuleID, modules.moduleID))
      .leftJoin(Course, eq(Course.CourseID, CourseModule.CourseID))
      .where(and(...conditions));

    return {modules: foundModules};
  } //getAll

  async getById(userId: string, moduleId: string): Promise<ModuleSingleResponseDto> {
    const [module] = await this.dbService.db
      .select({
        ...getTableColumns(modules),
        styling: ModuleStyling.styling
      })
      .from(modules)
      .leftJoin(ModuleStyling, and(
        eq(ModuleStyling.UserID, userId),
        eq(ModuleStyling.ModuleID, modules.moduleID)
      ))
      .where(eq(modules.moduleID, moduleId))
      .limit(1);

    if (!module) throw new NotFoundException('Module not found');

    return module;
  } //getById

  async update(
    userId: string,
    moduleId: string,
    dto: UpdateModuleDto
  ): Promise<ModuleSingleResponseDto> {

    //check that module exists
    const [module] = await this.dbService.db
      .select({ 
        moduleID: modules.moduleID,
        moduleCode: modules.moduleCode,
        moduleName: modules.moduleName,
        moduleDescription: modules.moduleDescription,
        CourseID: CourseModule.CourseID,
        styling: ModuleStyling.styling
      })
      .from(modules)
      .innerJoin(CourseModule, eq(CourseModule.ModuleID, modules.moduleID))
      .leftJoin(ModuleStyling, and(
        eq(ModuleStyling.ModuleID, modules.moduleID), 
        eq(ModuleStyling.UserID, userId)
      ))
      .where(eq(modules.moduleID, moduleId))
      .limit(1);

    if (!module)
      throw new NotFoundException(`Module id[${moduleId}] not found`);

    //validate a field is present for update
    if (
      dto.moduleCode === undefined &&
      dto.moduleName === undefined &&
      dto.moduleDescription === undefined &&
      dto.styling ===undefined
    ) throw new BadRequestException('At least one field is required to update a module');

    //If module with same code as updated code already exists in the same course -> throw a fit
    if (dto.moduleCode){

      const updatedCode = dto.moduleCode?.trim().toUpperCase();
      if (await this.existingModuleCodeForCourse(updatedCode, module.CourseID))
        throw new ConflictException(`Duplicate module code[${updatedCode}] found for course[${module.CourseID}]`);
    }//END_moduleCode update check
      
    //Build fields to update if present
    const updateFields: Partial<typeof modules.$inferInsert> = {};
    if (dto.moduleCode) updateFields.moduleCode = dto.moduleCode.trim().toUpperCase();
    if (dto.moduleName) updateFields.moduleName = dto.moduleName.trim();
    if (dto.moduleDescription) updateFields.moduleDescription = dto.moduleDescription.trim();


    //if fields defined to be updated -> update module
    let newModule = module;
    if (Object.keys(updateFields).length>0){

      const [result] = await this.dbService.db
        .update(modules)
        .set(updateFields)
        .where(eq(modules.moduleID, moduleId)).returning();

      if (!result)
        throw new InternalServerErrorException('Module not updated');

      //CourseID not updateable field for now, might change
      newModule = {
        ...result,
        CourseID: module.CourseID,
        styling: module.styling
      };
    }//END_updateFields presence check
      

    //Styling update - any user can update styling as it doesn't influence module
    let newStyling: { colour: string } | null = null;
    if (dto.styling){

      await this.setStyling(moduleId, userId, dto.styling);

      newStyling = {colour: dto.styling};
    } else {//Keep original styling - is this really necessary?
      
      newStyling = module.styling || null;
    }

    return {
      moduleID: newModule.moduleID,
      moduleCode: newModule.moduleCode,
      moduleName: newModule.moduleName,
      moduleDescription: newModule.moduleDescription,
      styling: newStyling
    };
  } //update

  async deleteById(moduleId: string): Promise<DeleteModuleResponseDto> {

    //Check that module actually exists - Is this necessary???
    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(eq(modules.moduleID, moduleId))
      .limit(1);

    if (!module) throw new NotFoundException(`Module [${moduleId}] not found`);

    //delete actual module
    await this.dbService.db
      .delete(modules)
      .where(eq(modules.moduleID, moduleId));

    return {
      moduleCode: module.moduleCode,
      success: true
    }
  } //delete


  
  //🎅's Little Helpers

  //Check if a module already exists for the course
  private async existingModuleCodeForCourse(moduleCode: string, courseId: string): Promise<boolean> {

    const [existingModule] = await this.dbService.db
      .select()
      .from(modules)
      .innerJoin(CourseModule, eq(modules.moduleID, CourseModule.ModuleID))
      .where(and(eq(modules.moduleCode, moduleCode), eq(CourseModule.CourseID, courseId)))
      .limit(1);

    //If module exists with moduleCode for course, return true else false
    return !!existingModule;
  }//END_existingModuleForCourse

  //Set module styling
  async setStyling(moduleId: string, userId: string, styling: string){

    const styleJson = { colour: styling };

    //Check if styling already exists for module+user
    let [modStyle] = await this.dbService.db
      .select()
      .from(ModuleStyling)
      .where(and(eq(ModuleStyling.ModuleID, moduleId), eq(ModuleStyling.UserID, userId)))
      .limit(1);

    if (!modStyle) {

      //Create style entry
      [modStyle] = await this.dbService.db
        .insert(ModuleStyling)
        .values({
          ModuleID: moduleId,
          UserID: userId,
          styling: styleJson
        }).returning();
    } else {

      //Update styling
      [modStyle] = await this.dbService.db
        .update(ModuleStyling)
        .set({
          styling: styleJson
        }).returning();
    }

    return modStyle;
  }//END_setStyling

  //Get module styling
  async getStyling(moduleId: string, userId: string){

    const [styling] = await this.dbService.db
      .select()
      .from(ModuleStyling)
      .where(and(eq(ModuleStyling.ModuleID, moduleId), eq(ModuleStyling.UserID, userId)))
      .limit(1);

    return styling;
  }

  //Get University that owns module
  async getUniForModule(moduleId: string) {

    const [uni] = await this.dbService.db
      .select({
        UniversityID: University.UniversityID
      })
      .from(University)
      .innerJoin(Course, eq(Course.UniversityID, University.UniversityID))
      .innerJoin(CourseModule, eq(Course.CourseID, CourseModule.CourseID))
      .where(eq(CourseModule.ModuleID, moduleId))
      .limit(1);

    return uni;
  }

  async moduleOwnershipCheck(userId: string, moduleId: string): Promise<boolean> {
    //Returns true if module is owned by user, false otherwise
    //IF STUDENT_OWNED, and module belongs to course that belongs to university of STUDENT_OWNED UniversityRole entity, then student owns module
    const [module] = await this.dbService.db
      .select({
        moduleId: modules.moduleID
      })
      .from(modules)
      .innerJoin(CourseModule, eq(CourseModule.ModuleID, modules.moduleID))
      .innerJoin(Course, eq(Course.CourseID, CourseModule.CourseID))
      .innerJoin(University, eq(University.UniversityID, Course.UniversityID))
      .innerJoin(UniversityRole, eq(UniversityRole.UniversityID, University.UniversityID))
      .where(and(
        eq(modules.moduleID, moduleId),
        eq(UniversityRole.role, 'STUDENT_OWNED'),
        eq(UniversityRole.UserID, userId)
      ))
      .limit(1);

      return !!module;
  }
} //ModuleService
