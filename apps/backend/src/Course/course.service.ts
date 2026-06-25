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
import {CreateCourseDto, UpdateCourseDto, CourseSingleResponseDto, CourseListResponseDto, DeleteCourseResponseDto } from './dto/course.dto';

@Injectable()
export class CourseService {

    constructor(private readonly dbService: DatabaseService) {}

    async create(dto: CreateCourseDto): Promise<CourseSingleResponseDto> {

        throw new NotImplementedException('sorry neh');
    }//Create

    async getAll(): Promise<CourseListResponseDto> {

        throw new NotImplementedException('sorry neh');
    }//GetAll

    async getById(courseId: string): Promise<CourseSingleResponseDto> {

        throw new NotImplementedException('sorry neh');
    }//getByID

    async update(courseId: string, dto: UpdateCourseDto): Promise<CourseSingleResponseDto> {

        throw new NotImplementedException('sorry neh');
    }//update

    async delete(courseId: string): Promise<DeleteCourseResponseDto> {

        throw new NotImplementedException('sorry neh');
    }//Delete

    //🎅's Little Helpers


}//UniversityService