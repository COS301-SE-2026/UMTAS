import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  NotImplementedException,
  Module
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';

import { BuilderListResponseDto, BuilderSingleResponseDto, CreateBuilderModuleDto, UpdateBuilderDto } from './dto/builder.dto';
import { CreateModuleDto, ModuleSingleResponseDto, ModuleListResponseDto, UpdateModuleDto, DeleteModuleResponseDto } from '../Module/dto/module.dto';
import { CourseDto } from 'src/Course/dto/course.dto';


import { UniversityRole, Course, CourseModule, modules, ModuleEnrollment, ModuleStyling} from '../entities/index';

import { UniversityService } from 'src/University/university.service';
import { CourseService } from 'src/Course/course.service';
import { ModuleService } from 'src/Module/module.service';

//Applies only to STUDENT_OWNED role for students
// When creating user defined modules
// modules defined in this class should belong to user owned university and course
@Injectable()
export class BuilderService {

    constructor(
        private readonly dbService: DatabaseService,
        private readonly uniService: UniversityService,
        private readonly courseService: CourseService,
        private readonly moduleService: ModuleService
    ) {}

    //Create User Module
    //Ensure that user defined university + course exists -> create respective module owned by user course
    async createModule(userId: string, dto: CreateBuilderModuleDto): Promise<CreateBuilderModuleDto> {

        const userCourse = await this.doUserUniCourseCheck(userId);

        //At this stage the user will definitly have a personalised university + course

        //Create module dto mapping
        const moduleDto: CreateModuleDto = {
            moduleCode: dto.moduleCode,
            moduleName: dto.moduleName,
            courseID: userCourse.CourseID,
            moduleDescription: dto.moduleDescription
        };

        //Create actual module
        let module = await this.moduleService.create(moduleDto);

        if (dto.styling) {
            const styling = await this.moduleService.setStyling(module.moduleID, userId, dto.styling);

            if (!styling) throw new InternalServerErrorException(`Module styling failed to be created`);

            //add styling to the module object
            module = module = { ...module, ...styling };
        }
            
        //Enroll Student to their module
        const [enrollment] = await this.dbService.db
            .insert(ModuleEnrollment)
            .values({
                ModuleID: module.moduleID,
                UserID: userId
            }).returning();

        if (!enrollment) throw new InternalServerErrorException(`User [${userId}] was not enrolled to module [${module.moduleID}]`);

        return module;
    }//createModule

    //get All USer defined modules
    async getAllModules(userId: string): Promise<BuilderListResponseDto>{

        //Get user course
        const userCourse = await this.doUserUniCourseCheck(userId);

        const filters = {
            userId,
            courseId: userCourse.CourseID
        };

        const modulesResponse = await this.moduleService.getAll(filters);

        if (modulesResponse && modulesResponse.modules && modulesResponse.modules.length>0) {
            // get styling for modules
            const modulesWithStyling = await Promise.all(

                modulesResponse.modules.map(async (module) => {

                    const styling = await this.moduleService.getStyling(module.moduleID, userId);
                    return {
                        ...module,
                        styling: styling.styling.colour || 'niksi'
                    };
                })
            );

            return {
                ...modulesResponse,
                modules: modulesWithStyling
            }
        }

        return modulesResponse;
    }//END_getAllModules

    //Get module by moduleID - no ownership check necessary?
    async getModuleById(moduleId: string, userId: string): Promise<BuilderSingleResponseDto>{
        
        const module =  await this.moduleService.getById(moduleId);

        const styling = await this.moduleService.getStyling(moduleId, userId);

        const colour = styling.styling?.colour || undefined;

        return {
            ...module, 
            styling: colour
        }
    }//END_getModuleById

    //Update
    //User can modify whatever they want on user owned modules
    async updateModule(userId: string, moduleId: string, dto: UpdateBuilderDto): Promise<BuilderSingleResponseDto> {

        //Get user owned course
        const userCourse = await this.doUserUniCourseCheck(userId);

        //IF user doesn't own module -> throw a fit
        if (!await this.ownershipCheck(moduleId, userCourse.CourseID)) throw new ForbiddenException(`User [${userId}] does not own module [${moduleId}]`);

        //Update any field of module if owned by user
        let module;

        if (dto.styling) {
            const styling = await this.moduleService.setStyling(moduleId, userId, dto.styling);

            if (!styling) throw new InternalServerErrorException(`Module styling failed to be created`);

            //add styling to the module object
            return {
                ...module,
                styling: styling.styling.colour ?? dto.styling
            };
        } else {
            module = await this.moduleService.update(moduleId, dto);
        }

        return module;
    }//END_updateModule

    //Delete
    //User can delete user owned modules
    async deleteModule(userId: string, moduleId: string): Promise<DeleteModuleResponseDto> {

        //Get user owned course
        const userCourse = await this.doUserUniCourseCheck(userId);

        //ownership check
        if (!await this.ownershipCheck(moduleId, userCourse.CourseID)) throw new ForbiddenException(`User [${userId}] does not own module [${moduleId}]`);

        return this.moduleService.deleteById(moduleId);
    }//END_deleteModule



    //🎅's Little Helpers

    //Check if user has personal uni and course | Return course
    private async doUserUniCourseCheck(userId: string): Promise<CourseDto>{

        //Get user university role entry for uniID
        let [uniRole] = await this.dbService.db
            .select()
            .from(UniversityRole)
            .where(and(eq(UniversityRole.UserID, userId), eq(UniversityRole.role, 'STUDENT_OWNED')))
            .limit(1);

        //If user does not yet have a university role -> this implies they dont have a personalised university
        if (!uniRole) uniRole = await this.createUserUni(userId);

        //Check for course -> if not found -> create user course
        let [course] = await this.dbService.db
            .select()
            .from(Course)
            .where(eq(Course.UniversityID, uniRole.UniversityID)).limit(1);

        if (!course) course = await this.createUserCourse(userId, uniRole.UniversityID);

        return course;
    }//ENDdoUserUniCourseCheck

    //Called when user doesn't have a personalised uni to create one
    private async createUserUni(userId: string): Promise<typeof UniversityRole.$inferSelect>{

        //Create custom university
        const uniName = `user_${userId.slice(0, 25)}`;

        //Check if uni already exists
        let uni = await this.uniService.getByName(uniName);

        if (!uni)
            uni = await this.uniService.create({
                UniversityName: uniName
            });

        //Create role linking user to university with STUDENT_OWNED role
        const [uniRole] = await this.dbService.db
            .insert(UniversityRole)
            .values({
                UserID: userId,
                UniversityID: uni.UniversityID,
                role: 'STUDENT_OWNED'
            }).returning();

        if (!uniRole) throw new InternalServerErrorException(`Failed to create university role for user: ${userId}`);

        return uniRole;
    }//createUserUni

    //Called when user has personalised uni but not course for some reason :'(
    private async createUserCourse(userId: string, uniId: string): Promise<CourseDto> {

        const course = await this.courseService.create({
            CourseName: `user_${userId.slice(0, 25)}`,
            UniversityID: uniId
        });

        return course;
    }//END_createUserCourse

    private async ownershipCheck(moduleId: string, courseId: string): Promise<boolean> {

        //Check module ownership
        const [module] = await this.dbService.db
            .select()
            .from(modules)
            .innerJoin(CourseModule, eq(CourseModule.ModuleID, modules.moduleID))
            .where(and(eq(modules.moduleID, moduleId), eq(CourseModule.CourseID, courseId))).limit(1);

        //true if exists | False otherwise
        return !!module;
    }//END_ownershipCheck

}//BuilderService