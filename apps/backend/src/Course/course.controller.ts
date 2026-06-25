import { CourseService } from './course.service';

import {CreateCourseDto, UpdateCourseDto, CourseSingleResponseDto, CourseListResponseDto, DeleteCourseResponseDto } from './dto/course.dto';

import {
  Post,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  ParseUUIDPipe
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

// import { CurrentSession } from '../auth/session.decorator';
// import type { SessionData } from '../auth/session.decorator';
import { Roles } from "src/auth/roles.guard";


@ApiTags('Courses')
@Controller('Courses')
export class CourseController {

    constructor(private readonly service: CourseService) {}

    //Create
    @Post()
    @Roles('uni_admin', 'sys_admin')
    @ApiOperation({ 
        summary: 'Create a Course',
        operationId: 'createCourse'
    })
    @ApiBody({type: CreateCourseDto})
    @ApiResponse({
        status: 201,
        description: 'Course created successfully',
        type: CourseSingleResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Missing or invalid course payload'
    })
    @ApiResponse({
        status: 409,
        description: 'Course already exists'
    })
    create(
        @Body() dto: CreateCourseDto
    ) {
        return this.service.create(dto);
    }

    //GetAll
    @Get()
    @Roles('student', 'uni_admin', 'sys_admin')
    @ApiOperation({
        summary: 'Get all courses',
        operationId: 'getCourses'
    })
    @ApiResponse({
        status: 200,
        description: 'Courses returned successfully',
        type: CourseListResponseDto
    })
    @ApiResponse({
        status: 404,
        description: 'No Courses found'
    })
    getAll(){
        return this.service.getAll();
    }

    //GetById
    @Get(':CourseId')
    @Roles('student', 'uni_admin', 'sys_admin')
    @ApiOperation({
        summary: 'get a Course by ID',
        operationId: 'getCourseById'
    })
    @ApiResponse({
        status: 200,
        description: 'Course returned successfully',
        type: CourseSingleResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid Course ID'
    })
    @ApiResponse({
        status: 404,
        description: 'Course not found'
    })
    getById(
        @Param('CourseId', ParseUUIDPipe) CourseId: string
    ) {
        return this.service.getById(CourseId);
    }

    //Update
    @Patch(':CourseId')
    @Roles('uni_admin', 'sys_admin')
    @ApiOperation({
        summary: 'Update an Course',
        operationId: 'updateCourse'
    })
    @ApiBody({type: UpdateCourseDto})
    @ApiResponse({
        status: 200,
        description: 'Course updated successfully',
        type: CourseSingleResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid update payload or CourseId'
    })
    @ApiResponse({
        status: 404,
        description: 'Course not found'
    })
    update(
        @Param('CourseId', ParseUUIDPipe) CourseId: string,
        @Body() dto: UpdateCourseDto
    ) {
        return this.service.update(CourseId, dto)
    }

    //Delete
    @Delete(':CourseId')
    @Roles('sys_admin')//should uni_admin's be allowed to delete
    @ApiOperation({
        summary: 'Delete Course by Course ID',
        operationId: 'deleteCourse'
    })
    @ApiResponse({
        status: 200,
        description: 'Course deleted successfully',
        type: DeleteCourseResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid Course ID'
    })
    @ApiResponse({
        status: 404,
        description: 'Course not found',
    })
    delete(
        @Param('CourseId', ParseUUIDPipe) CourseId: string
    ) {
        return this.service.delete(CourseId);
    }
}//CourseController