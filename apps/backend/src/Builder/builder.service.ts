import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { AppDatabase, DatabaseService } from '../db/database.service';

import {
  BuilderListResponseDto,
  BuilderSingleResponseDto,
  CreateBuilderModuleDto,
  UpdateBuilderDto,
} from './dto/builder.dto';
import {
  CreateModuleDto,
  DeleteModuleResponseDto,
} from '../Module/dto/module.dto';
import { CourseDto } from '../Course/dto/course.dto';

import { UniversityRole, ModuleEnrollment } from '../entities/index';

import { UniversityService } from '../University/university.service';
import { CourseService } from '../Course/course.service';
import { ModuleService } from '../Module/module.service';

//Applies only to STUDENT_OWNED role for students
// When creating user defined modules
// modules defined in this class should belong to user owned university and course
@Injectable()
export class BuilderService {
  constructor(
    protected readonly dbService: DatabaseService,
    protected readonly uniService: UniversityService,
    protected readonly courseService: CourseService,
    protected readonly moduleService: ModuleService,
  ) {}

  //Create User Module
  //Ensure that user defined university + course exists -> create respective module owned by user course
  async createModule(
    userId: string,
    dto: CreateBuilderModuleDto,
  ): Promise<BuilderSingleResponseDto> {
    return await this.dbService.db.transaction(async (tx: AppDatabase) => {
      const userCourse = await this.doUserUniCourseCheck(userId, tx);

      //At this stage the user will definitly have a personalised university + course

      //Create module dto mapping
      const moduleDto: CreateModuleDto = {
        moduleCode: dto.moduleCode,
        moduleName: dto.moduleName,
        semester: dto.semester,
        CourseID: userCourse.CourseID,
        moduleDescription: dto.moduleDescription,
        styling: dto.styling,
      };

      //Create actual module
      const module = await this.moduleService.create(userId, moduleDto, tx);

      //Enroll Student to their module
      const [enrollment] = await tx
        .insert(ModuleEnrollment)
        .values({
          ModuleID: module.moduleID,
          UserID: userId,
        })
        .returning();

      if (!enrollment)
        throw new InternalServerErrorException(
          `User [${userId}] was not enrolled to module [${module.moduleID}]`,
        );

      return module;
    }); //END_transaction
  } //createModule

  //get All USer defined modules
  async getAllModules(userId: string): Promise<BuilderListResponseDto> {
    return await this.dbService.db.transaction(async (tx: AppDatabase) => {
      //Get user course
      const userCourse = await this.doUserUniCourseCheck(userId, tx);

      const filters = {
        courseId: userCourse.CourseID,
      };

      const modulesResponse = await this.moduleService.getAll(
        userId,
        filters,
        tx,
      );

      return modulesResponse;
    }); //END_transaction
  } //END_getAllModules

  //Get module by moduleID - no ownership check necessary?
  async getModuleById(
    userId: string,
    moduleId: string,
  ): Promise<BuilderSingleResponseDto> {
    return await this.moduleService.getById(userId, moduleId);
  } //END_getModuleById

  //Update
  //User can modify whatever they want on user owned modules
  async updateModule(
    userId: string,
    moduleId: string,
    dto: UpdateBuilderDto,
  ): Promise<BuilderSingleResponseDto> {
    return this.dbService.db.transaction(async (tx: AppDatabase) => {
      //IF user doesn't own module -> throw a fit
      if (
        !(await this.moduleService.moduleOwnershipCheck(userId, moduleId, tx))
      )
        throw new ForbiddenException(
          `User [${userId}] does not own module [${moduleId}]`,
        );

      //Update any field of module if owned by user
      const module = await this.moduleService.update(userId, moduleId, dto, tx);

      return module;
    }); //END_transaction
  } //END_updateModule

  //Delete
  //User can delete user owned modules
  async deleteModule(
    userId: string,
    moduleId: string,
  ): Promise<DeleteModuleResponseDto> {
    return this.dbService.db.transaction(async (tx: AppDatabase) => {
      //IF user doesn't own module -> throw a fit
      if (
        !(await this.moduleService.moduleOwnershipCheck(userId, moduleId, tx))
      )
        throw new ForbiddenException(
          `User [${userId}] does not own module [${moduleId}]`,
        );

      return this.moduleService.deleteById(moduleId);
    }); //END_transaction
  } //END_deleteModule

  //🎅's Little Helpers

  //Check if user has personal uni and course | Return course
  protected async doUserUniCourseCheck(
    userId: string,
    tx: DatabaseService['db'],
  ): Promise<CourseDto> {
    //Get user university role entry for uniID
    let [uniRole] = await tx
      .select()
      .from(UniversityRole)
      .where(
        and(
          eq(UniversityRole.UserID, userId),
          eq(UniversityRole.role, 'STUDENT_OWNED'),
        ),
      )
      .limit(1);

    //If user does not yet have a university role -> this implies they dont have a personalised university
    if (!uniRole) uniRole = await this.createUserUni(userId, tx);

    //Check for course -> if not found -> create user course
    const { courses } = await this.courseService.getAll(
      {
        UniversityID: uniRole.UniversityID,
      },
      tx,
    );

    let course = courses[0];
    if (!course)
      course = await this.createUserCourse(userId, uniRole.UniversityID, tx);

    return course;
  } //ENDdoUserUniCourseCheck

  //Called when user doesn't have a personalised uni to create one
  protected async createUserUni(
    userId: string,
    tx: DatabaseService['db'],
  ): Promise<typeof UniversityRole.$inferSelect> {
    //Create custom university
    const uniName = `user_${userId.slice(0, 25)}`;

    //Check if uni already exists
    let uni = await this.uniService.getByName(uniName, tx);

    if (!uni)
      uni = await this.uniService.create(
        {
          UniversityName: uniName,
        },
        tx,
      );

    //Create role linking user to university with STUDENT_OWNED role
    const [uniRole] = await tx
      .insert(UniversityRole)
      .values({
        UserID: userId,
        UniversityID: uni.UniversityID,
        role: 'STUDENT_OWNED',
      })
      .returning();

    if (!uniRole)
      throw new InternalServerErrorException(
        `Failed to create university role for user: ${userId}`,
      );

    return uniRole;
  } //createUserUni

  //Called when user has personalised uni but not course for some reason :'(
  protected async createUserCourse(
    userId: string,
    uniId: string,
    tx: DatabaseService['db'],
  ): Promise<CourseDto> {
    const course = await this.courseService.create(
      {
        CourseName: `user_${userId.slice(0, 25)}`,
        UniversityID: uniId,
      },
      tx,
    );

    return course;
  } //END_createUserCourse
} //BuilderService
