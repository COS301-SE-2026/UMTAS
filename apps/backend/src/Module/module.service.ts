import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { DatabaseService } from '../db/database.service';
import { modules } from '../entities/Modules/index';
import {
  CreateModuleDto,
  DeleteModuleResponseDto,
  ModuleListResponseDto,
  SingleModuleResponseDto,
  UpdateModuleDto,
} from './dto/module.dto';
import { University, UniversityRole, Course, CourseModule,  ModuleEnrollment} from '../entities/index';

@Injectable()
export class ModuleService {
  constructor(private readonly dbService: DatabaseService) {}

  // Create module
  // For now no role checking will be done, simply implementing like all students are using builder interface
  // IF (universityRole==Student && Student isn't enrolled in any course/university): Create university + course for user using uuid of user ensuring modules are still owned by a university belonging to certain course
  // NOTE: styling not implemented, neither in dto
  async create(
    userId: string,
    dto: CreateModuleDto,
  ): Promise<SingleModuleResponseDto> {
    const code = dto.code?.trim().toUpperCase();
    const name = dto.name?.trim();
    const description = dto.description?.trim();
    // const styling = dto.styling?.trim();

    //Firstly check student role
    //If STUDENT_OWNED -> dummy uni and course should exists, if not -> create
    // if (!userId) throw new BadRequestException('UserId not provided');
    const course = await this.checkRole(userId);

    //Check if module with same code exists for the same course
    const [existingModule] = await this.dbService.db
      .select()
      .from(modules)
      .innerJoin(CourseModule, eq(modules.moduleID, CourseModule.ModuleID))
      .where(and(eq(modules.moduleCode, code), eq(CourseModule.CourseID, course.CourseID)))
      .limit(1);

    //If module already exists for course, throw a fit
    if (existingModule)
      throw new ConflictException(`Module: ${code} already exists`);

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
        CourseID: course.CourseID
      }).returning();

    if (!courseModule)
      throw new InternalServerErrorException(`CourseModule Join table insert failed for creating module: ${newModule.moduleCode}`);

    //Auto enroll student into module
    await this.dbService.db
    .insert(ModuleEnrollment)
    .values({
      ModuleID: newModule.moduleID,
      UserID: userId
    });

    return {
      module: newModule
    }
  } //create

  //return all
  async getAll(userId: string): Promise<ModuleListResponseDto> {
    const foundModules = await this.dbService.db
      .select({
        moduleID: modules.moduleID,
        moduleCode: modules.moduleCode,
        moduleName: modules.moduleName,
        moduleDescription: modules.moduleDescription
      })
      .from(modules)
      .innerJoin(ModuleEnrollment, eq(ModuleEnrollment.ModuleID, modules.moduleID))
      .where(eq(ModuleEnrollment.UserID, userId));

    if (foundModules.length === 0) throw new NotFoundException('No modules found for user');

    return { 
      modules: foundModules 
    };
  } //getAll

  async getById(moduleId: number): Promise<SingleModuleResponseDto> {
    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(eq(modules.moduleID, moduleId))
      .limit(1);

    if (!module) throw new NotFoundException('Module not found');

    return {
      module
    };
  } //getById

  async update(
    userId: string,
    moduleId: number,
    dto: UpdateModuleDto,
  ): Promise<SingleModuleResponseDto> {

    //Ownership check -> role==STUDENT_OWNED && module belongs to respective course
    const [ownership] = await this.dbService.db
      .select({ CourseID: Course.CourseID })
      .from(Course)
      .innerJoin(CourseModule, eq(Course.CourseID, CourseModule.CourseID))
      .innerJoin(UniversityRole, eq(Course.UniversityID, UniversityRole.UniversityID))
      .where(and(
        eq(CourseModule.ModuleID, moduleId),
        eq(UniversityRole.UserID, userId),
        eq(UniversityRole.role, 'STUDENT_OWNED')
      )).limit(1);

    if (!ownership) throw new ForbiddenException(`${userId} does not own this module: ${moduleId}`);

    //Find module
    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(eq(modules.moduleID, moduleId))
      .limit(1);

    if (!module)
      throw new NotFoundException(`Module id[${moduleId}] not found`);

    //validate a field is present for update
    if (
      dto.code === undefined &&
      dto.name === undefined &&
      dto.description === undefined 
    ) {
      throw new BadRequestException('At least one field is required to update a module');
    }

    if (dto.code && dto.code.length > 10)
      throw new BadRequestException('Module code should be shorter than 10 characters');

    const updatedCode = dto.code?.trim().toUpperCase();
    const updatedName = dto.name?.trim();
    const updatedDescription = dto.description?.trim();

    //Check if duplicate module code exists for same course
    if (updatedCode && updatedCode !== module.moduleCode) {

      const [existingModule] = await this.dbService.db
        .select()
        .from(modules)
        .innerJoin(CourseModule, eq(modules.moduleID, CourseModule.ModuleID))
        .where(and(
          eq(modules.moduleCode, updatedCode), 
          eq(CourseModule.CourseID, ownership.CourseID)
        ))
        .limit(1);

      //If module with same code as updated code already exists in the same course -> throw fit
      if (existingModule)
        throw new ConflictException('Duplicate module for new code found');
    } //duplicate module for new code

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

    return {
      module: newModule
    };
  } //update

  async deleteById(
    userId: string,
    moduleId: number,
  ): Promise<DeleteModuleResponseDto> {

    //Ownership check -> role==STUDENT_OWNED && module belongs to respective course
    const [ownership] = await this.dbService.db
      .select({ CourseID: Course.CourseID })
      .from(Course)
      .innerJoin(CourseModule, eq(Course.CourseID, CourseModule.CourseID))
      .innerJoin(UniversityRole, eq(Course.UniversityID, UniversityRole.UniversityID))
      .where(and(
        eq(CourseModule.ModuleID, moduleId),
        eq(UniversityRole.UserID, userId),
        eq(UniversityRole.role, 'STUDENT_OWNED')
      )).limit(1);

    if (!ownership) throw new ForbiddenException(`${userId} doesn't own module: ${moduleId}`);

    //Check that module actually exists
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
      success: true
    }
  } //delete

  //🎅's Little Helpers
  private async checkRole(userId: string){

    //fetch role
    let [uniRole] = await this.dbService.db
      .select()
      .from(UniversityRole)
      .where(and(eq(UniversityRole.UserID, userId), eq(UniversityRole.role, 'STUDENT_OWNED'))).limit(1);

      //If no uniRole exists, means student isn't enrolled at uni -> create dummy uni
    if (!uniRole) {

      //Create dummy uni
      const [uni] = await this.dbService.db
        .insert(University)
        .values({
          UniversityName: `user_${userId.slice(0, 8)}`
        }).returning();

      //create unirole for user to join to university
      [uniRole] = await this.dbService.db
        .insert(UniversityRole)
        .values({
          UserID: userId,
          UniversityID: uni.UniversityID,
          role: 'STUDENT_OWNED'
        }).returning();
    }

    //Role specific behaviour to find course
    let course;
    if (uniRole.role=='STUDENT_OWNED') {
      course = await this.getStudentOwnedCourse(userId);
    } else if (uniRole.role=="STUDENT"){
      //This means the student already belongs to a uni and enrolled in a course
      const [existingCourse] = await this.dbService.db
        .select()
        .from(Course)
        .innerJoin(UniversityRole, eq(Course.UniversityID, UniversityRole.UniversityID))
        .where(eq(UniversityRole.UserID, userId)).limit(1);

      //if course not found -> throw excpetion
      if (!existingCourse) throw new BadRequestException('Course not defined for STUDENT.');

      course = existingCourse;
    } else throw new BadRequestException(`Unsupported role: ${uniRole.role}`);

    return course;
  }//END_checkRole

  private async getStudentOwnedCourse(userId: string){

    //University will be defined + uniROle for user

    //First check if course already exists
    const [course] = await this.dbService.db
      .select({
        CourseID: Course.CourseID,
        CourseName: Course.CourseName,
        UniversityID: Course.UniversityID,
      })
      .from(Course)
      .innerJoin(UniversityRole, eq(Course.UniversityID, UniversityRole.UniversityID))
      .where(eq(UniversityRole.UserID, userId)).limit(1);

      //if already enrolled in course, return course 
    if (course) return course;

    //fetch uniRole for uniID
    const [uniRole] = await this.dbService.db
      .select()
      .from(UniversityRole)
      .where(and(eq(UniversityRole.UserID, userId), eq(UniversityRole.role, 'STUDENT_OWNED'))).limit(1);

    //create dummy course
    const [newCourse] = await this.dbService.db
      .insert(Course)
      .values({
        CourseName: `Course for: ${userId.slice(0, 8)}`,
        UniversityID: uniRole.UniversityID
      }).returning();

    return newCourse;
  }//END_ensureBuilderContext
} //ModuleService
