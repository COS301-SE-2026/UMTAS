import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
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
import { University, UniversityRole, Course, CourseModule } from '../entities/index';

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
    const courseId = dto.courseID?.trim();
    // const styling = dto.styling?.trim();

    if (!code || !name)
      throw new BadRequestException(
        'Code and name are required for module creation',
      );

    if (code.length > 10)
      throw new BadRequestException(
        'Module code should be shorter than 10 characters',
      );

    //if (courseID) -> create module | else -> create university if not defined and dummy course
    //first check if course exists
    let course;
      
    if (!courseId) course = await this.createDummyUniversityAndCourse(userId);
      else {
        [course] = await this.dbService.db
          .select()
          .from(Course)
          .where(eq(Course.CourseID, courseId)).limit(1);
      } 

    const [existingModule] = await this.dbService.db
      .select()
      .from(modules)
      .innerJoin(CourseModule, eq(modules.moduleID, CourseModule.ModuleID))
      .where(and(eq(modules.moduleCode, code), eq(course.CourseID, course.CourseID)))
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

    const [courseModule] = await this.dbService.db
      .insert(CourseModule)
      .values({
        ModuleID: newModule.moduleID,
        CourseID: course.CourseID
      }).returning();

    if (!courseModule)
      throw new InternalServerErrorException(`CourseModule Join table insert failed for creating module: ${newModule.moduleCode}`);

    return { module: {
        ...newModule,
        courseID: course.CourseID
    } };
  } //create

  //return all
  async getAll(userId: string): Promise<ModuleListResponseDto> {
    const foundModules = await this.dbService.db
      .select()
      .from(modules)
      .where(eq(modules.userID, userId));

    return { modules: foundModules };
  } //getAll

  async getById(userId: string, id: number): Promise<SingleModuleResponseDto> {
    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(and(eq(modules.userID, userId), eq(modules.moduleID, id)))
      .limit(1);

    if (!module) throw new NotFoundException('Module not found');

    return {
      module,
    };
  } //getById

  async update(
    userId: string,
    moduleId: number,
    dto: UpdateModuleDto,
  ): Promise<SingleModuleResponseDto> {
    //Find module
    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(and(eq(modules.userID, userId), eq(modules.moduleID, moduleId)))
      .limit(1);

    if (!module)
      throw new NotFoundException(`Module id[${moduleId}] not found`);

    if (
      dto.code === undefined &&
      dto.name === undefined &&
      dto.description === undefined &&
      dto.styling === undefined
    ) {
      throw new BadRequestException(
        'At least one field is required to update a module',
      );
    }

    if (dto.code && dto.code.length > 10)
      throw new BadRequestException(
        'Module code should be shorter than 10 characters',
      );

    const updatedCode = dto.code?.trim().toUpperCase();
    const updatedDescription = dto.description?.trim();

    if (updatedCode && updatedCode !== module.moduleCode) {
      //check for module with same NEW code
      const [dupModule] = await this.dbService.db
        .select()
        .from(modules)
        .where(
          and(eq(modules.userID, userId), eq(modules.moduleCode, updatedCode)),
        )
        .limit(1);

      if (dupModule)
        throw new ConflictException('Duplicate module for new code found');
    } //duplicate module for new code

    const [newModule] = await this.dbService.db
      .update(modules)
      .set({
        moduleCode: updatedCode ?? module.moduleCode,
        moduleName: dto.name?.trim() ?? module.moduleName,
        moduleDescription: updatedDescription ?? module.moduleDescription,
        styling: dto.styling ?? module.styling,
      })
      .where(and(eq(modules.userID, userId), eq(modules.moduleID, moduleId)))
      .returning();

    if (!newModule)
      throw new InternalServerErrorException('Module not updated');

    return {
      module: newModule,
    };
  } //update

  async deleteById(
    userId: string,
    moduleId: number,
  ): Promise<DeleteModuleResponseDto> {
    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(and(eq(modules.userID, userId), eq(modules.moduleID, moduleId)))
      .limit(1);

    if (!module) throw new NotFoundException(`Module [${moduleId}] not found`);

    await this.dbService.db
      .delete(modules)
      .where(and(eq(modules.userID, userId), eq(modules.moduleID, moduleId)));

    return {
      success: true,
    };
  } //delete

  //Little Helpers
  private async createDummyUniversityAndCourse(userId: string){

    //Check if user enrolled at university -> if not create dummy uni
    // Create dummy course

    let [uniRole] = await this.dbService.db
      .select()
      .from(UniversityRole)
      .where(eq(UniversityRole.UserID, userId))
      .limit(1);

    //If no uniRole defined -> start creation of university for student
    if (!uniRole) {

      //create personalised uni
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
    }//END_if_uni

    const [course] = await this.dbService.db
      .insert(Course)
      .values({
        CourseName: `Course for: ${userId.slice(0, 8)}`,
        UniversityID: uniRole.UniversityID
      }).returning();

      return course;
  }//END_ensureBuilderContext
} //ModuleService
