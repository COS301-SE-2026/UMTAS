import {
  NotFoundException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq, and, SQL } from 'drizzle-orm';

import { DatabaseService } from '../db/database.service';
import { Course } from '../entities';
import {
  CourseDto,
  CreateCourseDto,
  UpdateCourseDto,
  CourseSingleResponseDto,
  CourseListResponseDto,
  DeleteCourseResponseDto,
  CourseFilters,
} from './dto/course.dto';

//Services
import { UniversityService } from '../University/university.service';
import { GroupingService } from '../Grouping/grouping.service';

@Injectable()
export class CourseService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly uniService: UniversityService,
    private readonly groupingService: GroupingService,
  ) {}

  async create(dto: CreateCourseDto): Promise<CourseSingleResponseDto> {
    //Check if university exists
    await this.uniService.getById(dto.UniversityID);

    //Check that ModuleGrouping actually exists
    if (dto.GroupID) await this.groupingService.getById(dto.GroupID);

    //Check if course already exists
    const course = await this.duplicateCourseNamePerUniversity(
      dto.CourseName,
      dto.UniversityID,
    );
    //If course already exists for the university with that name, return early
    if (course) return course;

    //Create new Course
    //Check if GroupID / Degree given and not null
    const [newCourse] = await this.dbService.db
      .insert(Course)
      .values({
        UniversityID: dto.UniversityID,
        CourseName: dto.CourseName,
        ...(dto.GroupID ? { GroupID: dto.GroupID } : {}),
        ...(dto.Degree ? { Degree: dto.Degree } : {}),
      })
      .returning();

    if (!newCourse)
      throw new InternalServerErrorException(
        `Course [${dto.CourseName}] failed to create`,
      );

    return newCourse;
  } //Create

  //get all courses for a university
  //Filters: CourseFilters
  //No filters return all courses in database
  async getAll(filters: CourseFilters): Promise<CourseListResponseDto> {
    const conditions: SQL[] = [];
    console.log('Get all');
    if (filters.UniversityID)
      conditions.push(eq(Course.UniversityID, filters.UniversityID));
    if (filters.Degree) conditions.push(eq(Course.Degree, filters.Degree));

    const courses = await this.dbService.db
      .select()
      .from(Course)
      .where(and(...conditions));

    return { courses };
  } //GetAll

  async getById(courseId: string): Promise<CourseSingleResponseDto> {
    const [course] = await this.dbService.db
      .select()
      .from(Course)
      .where(eq(Course.CourseID, courseId))
      .limit(1);

    if (!course)
      throw new NotFoundException(`No course found for CourseID: ${courseId}`);

    return course;
  } //getByID

  async update(
    courseId: string,
    dto: UpdateCourseDto,
  ): Promise<CourseSingleResponseDto> {
    //If uni declared - check if uni exists
    if (dto.UniversityID) await this.uniService.getById(dto.UniversityID);

    //if groupId defined - check if group exists
    if (dto.GroupID) await this.groupingService.getById(dto.GroupID);

    //check if course exists - getbyid will throw if it doesn't exist
    const oldCourse = await this.getById(courseId);

    //get fields to update
    const updateFields: Partial<typeof Course.$inferSelect> = {};
    if (dto.UniversityID && dto.UniversityID !== oldCourse.UniversityID) {
      updateFields.UniversityID = dto.UniversityID;
      //set to old course name so if university change the name check still takes place
      updateFields.CourseName = oldCourse.CourseName;
    }
    if (dto.GroupID && dto.GroupID !== oldCourse.GroupID)
      updateFields.GroupID = dto.GroupID;
    if (dto.CourseName && dto.CourseName !== oldCourse.CourseName)
      updateFields.CourseName = dto.CourseName;
    if (dto.Degree && dto.Degree !== oldCourse.Degree)
      updateFields.Degree = dto.Degree;

    //If nothing sent to update - return old course
    if (Object.keys(updateFields).length === 0) return oldCourse;

    //If name update -> check for duplicate
    //If uni update -> check for duplicate name at new uni
    //If new name and uni -> check for duplicate newName at new uni
    if (updateFields.CourseName) {
      const uniId = updateFields.UniversityID ?? oldCourse.UniversityID;

      const duplicate = await this.duplicateCourseNamePerUniversity(
        updateFields.CourseName,
        uniId,
      );

      if (duplicate)
        throw new ConflictException(
          `Course[${updateFields.CourseName}] already exists for university[${uniId}]`,
        );
    } //END_Duplicate check

    //Update course
    const [newCourse] = await this.dbService.db
      .update(Course)
      .set(updateFields)
      .where(eq(Course.CourseID, courseId))
      .returning();

    //update failed
    if (!newCourse)
      throw new InternalServerErrorException(`Failed to update course`);

    return newCourse;
  } //update

  async delete(courseId: string): Promise<DeleteCourseResponseDto> {
    //delete course
    const [course] = await this.dbService.db
      .delete(Course)
      .where(eq(Course.CourseID, courseId))
      .returning();

    return {
      success: !!course,
      CourseName: course.CourseName,
    };
  } //Delete

  //🎅's Little Helpers
  async duplicateCourseNamePerUniversity(
    cName: string,
    uniId: string,
  ): Promise<CourseDto> {
    //Find course for university with same name
    const [course] = await this.dbService.db
      .select()
      .from(Course)
      .where(and(eq(Course.UniversityID, uniId), eq(Course.CourseName, cName)))
      .limit(1);

    return course;
  } //END_duplicateCourseNamePerUniversity
} //CourseService
