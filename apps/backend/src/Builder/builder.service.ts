import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  NotImplementedException
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';

import { CreateModuleDto, SingleModuleResponseDto } from '../Module/dto/module.dto';

import { University, UniversityRole, Course, CourseModule,  ModuleEnrollment} from '../entities/index';

import { UniversityService } from 'src/University/university.service';
import { CourseService } from 'src/Course/course.service';
import { CourseDto } from 'src/Course/dto/course.dto';
import { UniversityController } from 'src/University/university.controller';

//Applies only to STUDENT_OWNED role for students
// When creating user defined modules
// modules defined in this class should belong to user owned university and course
@Injectable()
export class BuilderService {

    constructor(
        private readonly dbService: DatabaseService,
        private readonly uniService: UniversityService,
        private readonly courseService: CourseService
    ) {}

    async createModule(userId: string, dto: CreateModuleDto): Promise<SingleModuleResponseDto> {
        
        const code = dto.code?.trim().toUpperCase();
        const name = dto.name?.trim();
        const description = dto.description?.trim();

        const userCourse = await this.doUserUniCourseCheck(userId);

        
        throw new NotImplementedException("Sorry nhe");
    }//createModule






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

        throw new NotImplementedException("Sorry nhe");
    }

    //Called when user doesn't have a personalised uni to create one
    private async createUserUni(userId: string): Promise<typeof UniversityRole.$inferSelect>{

        //Create custom university
        const uni = await this.uniService.create({
            UniversityName: `user_${userId.slice(0, 25)}`
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

}//BuilderService