import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  NotImplementedException,
} from '@nestjs/common';
import { eq, and, SQL } from 'drizzle-orm';

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
import { Course, CourseModule,  ModuleEnrollment, University} from '../entities/index';
import { CourseService } from 'src/Course/course.service';


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

  //return all
  //Optional courseId: If (courseId)-> fetch all modules for user enrolled in that course
  //else -> fetch all modules for user across all courses
  //userId -> return modules user is enrolled in
  //courseId -> ignore userId -> return all modules defined for course
  //universityId -> return all modules defined for a university over all courses
  async getAll(filters: ModuleFiltersDto): Promise<ModuleListResponseDto> {
    
    //define empty conditions array to be added to based of filters
    const conditions: SQL[] = [];

    //Dynamically add conditions for where clause based of filters
    //userId
    if (filters.userId) {

      conditions.push(eq(ModuleEnrollment.UserID, filters.userId));
    }
      
    //courseId
    if (filters.courseId)
      conditions.push(eq(CourseModule.CourseID, filters.courseId));

    //universityId
    if (filters.universityId)
      conditions.push(eq(Course.UniversityID, filters.universityId));

    if (conditions.length===0) 
      throw new BadRequestException('At least one filter is required: userId | courseId | universityId');

    //Build actual query joining Modules -> ModuleEnrollment + CourseModule + Course and then add in dynamic where conditions
    const foundModules = await this.dbService.db
      .selectDistinct({
        moduleID: modules.moduleID,
        moduleCode: modules.moduleCode,
        moduleName: modules.moduleName,
        moduleDescription: modules.moduleDescription
      })
      .from(modules)
      .leftJoin(ModuleEnrollment, eq(ModuleEnrollment.ModuleID, modules.moduleID))
      .leftJoin(CourseModule, eq(CourseModule.ModuleID, modules.moduleID))
      .leftJoin(Course, eq(Course.CourseID, CourseModule.CourseID))
      .where(and(...conditions));

    if (foundModules.length===0)
      throw new NotFoundException(`No matching modules found for filters: ${filters}`);

    return {modules: foundModules};
  } //getAll

  async getById(moduleId: string): Promise<ModuleSingleResponseDto> {
    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(eq(modules.moduleID, moduleId))
      .limit(1);

    if (!module) throw new NotFoundException('Module not found');

    return module;
  } //getById

  async update(
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
        CourseID: CourseModule.CourseID
      })
      .from(modules)
      .innerJoin(CourseModule, eq(CourseModule.ModuleID, modules.moduleID))
      .where(eq(modules.moduleID, moduleId))
      .limit(1);

    if (!module)
      throw new NotFoundException(`Module id[${moduleId}] not found`);

    //validate a field is present for update
    if (
      dto.moduleCode === undefined &&
      dto.moduleName === undefined &&
      dto.moduleDescription === undefined 
    ) throw new BadRequestException('At least one field is required to update a module');

    const updatedCode = dto.moduleCode?.trim().toUpperCase();
    const updatedName = dto.moduleName?.trim();
    const updatedDescription = dto.moduleDescription?.trim();

    //If module with same code as updated code already exists in the same course -> throw a fit
    if (updatedCode && await this.existingModuleCodeForCourse(updatedCode, module.CourseID,moduleId))
      throw new ConflictException(`Duplicate module code[${updatedCode}] found for course[${module.CourseID}]`);

    //update module
    const [newModule] = await this.dbService.db
      .update(modules)
      .set({
        moduleCode: updatedCode ?? module.moduleCode,
        moduleName: updatedName ?? module.moduleName,
        moduleDescription: updatedDescription ?? module.moduleDescription,
        // styling: dto.styling ?? module.styling,
      })
      .where(eq(modules.moduleID, moduleId))
      .returning();

    if (!newModule)
      throw new InternalServerErrorException('Module not updated');

    return newModule;
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
  private async existingModuleCodeForCourse(moduleCode: string, courseId: string,moduleID ?: string): Promise<boolean> {

    const [existingModule] = await this.dbService.db
      .select()
      .from(modules)
      .innerJoin(CourseModule, eq(modules.moduleID, CourseModule.ModuleID))
      .where(and(eq(modules.moduleCode, moduleCode), eq(CourseModule.CourseID, courseId)))
      .limit(1);

    //If module code exists for course, return true
    if (moduleID == undefined)
      return !!existingModule;

    else if (existingModule != undefined && existingModule.Modules.moduleID != moduleID)
      return true;
    else
      return false
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
} //ModuleService
