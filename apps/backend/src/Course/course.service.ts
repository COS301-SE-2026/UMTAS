import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  NotImplementedException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { DatabaseService } from '../db/database.service';
import { Course } from 'src/entities';
import {CourseDto, CreateCourseDto, UpdateCourseDto, CourseSingleResponseDto, CourseListResponseDto, DeleteCourseResponseDto } from './dto/course.dto';

@Injectable()
export class CourseService {

    constructor(private readonly dbService: DatabaseService) {}

    async create(dto: CreateCourseDto): Promise<CourseSingleResponseDto> {

        //Check if course already exists
        const course = await this.duplicateCourseNamePerUniversity(dto.CourseName, dto.UniversityID);
        if (course) throw new ConflictException(`Course [${dto.CourseName}] already exists for universityID: ${dto.UniversityID}`);

        const [newCourse] = await this.dbService.db
            .insert(Course)
            .values({
                CourseName: dto.CourseName,
                UniversityID: dto.UniversityID
            }).returning();

        if (!newCourse) throw new InternalServerErrorException(`Course [${dto.CourseName}] failed to create`);

        return newCourse;
    }//Create

    async getAll(uniId: string): Promise<CourseListResponseDto> {

        const courses = await this.dbService.db
            .select()
            .from(Course)
            .where(eq(Course.UniversityID, uniId));

        if (courses.length===0) throw new NotFoundException(`No courses found for universityID: ${uniId}`)

        return {courses};
    }//GetAll

    async getById(courseId: string): Promise<CourseSingleResponseDto> {

        const [course] = await this.dbService.db
            .select()
            .from(Course)
            .where(eq(Course.CourseID, courseId)).limit(1);

        if (!course) throw new NotFoundException(`No course found for CourseID: ${courseId}`)

        return course;
    }//getByID

    async update(courseId: string, dto: UpdateCourseDto): Promise<CourseSingleResponseDto> {

        //check if course exists
        const course = await this.getById(courseId);

        //Check that atleast one update field provided
        if (
            dto.CourseName===undefined &&
            dto.UniversityID===undefined
        ) throw new BadRequestException('At least one field required for update');

        //Check if new name is duplicate for uni id
        const updatedName = dto.CourseName?.trim();
        if (updatedName && await this.duplicateCourseNamePerUniversity(updatedName, course.UniversityID))
            throw new ConflictException(`Course ${updatedName} already exists for universityID: ${course.UniversityID}`);

        //Update course
        const [newCourse] = await this.dbService.db
            .update(Course)
            .set({
                CourseName: updatedName ?? course.CourseName,
                UniversityID: dto.UniversityID ?? course.UniversityID
            })
            .where(eq(Course.CourseID, courseId)).returning();

        //update failed
        if (!newCourse) throw new InternalServerErrorException(`Failed to update course`);

        return newCourse;
    }//update

    async delete(courseId: string): Promise<DeleteCourseResponseDto> {

        throw new NotImplementedException('sorry neh');
    }//Delete

    //🎅's Little Helpers
    async duplicateCourseNamePerUniversity(cName: string, uniId: string): Promise<CourseDto> {

        //Find course for university with same name
        const [course] = await this.dbService.db
            .select()
            .from(Course)
            .where(and(eq(Course.UniversityID, uniId), eq(Course.CourseName, cName))).limit(1);

        return course;
    }//END_duplicateCourseNamePerUniversity


}//UniversityService