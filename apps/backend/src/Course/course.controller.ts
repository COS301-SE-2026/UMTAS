import { CourseService } from './course.service';

import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseSingleResponseDto,
  CourseListResponseDto,
  DeleteCourseResponseDto,
  CourseFilters,
} from './dto/course.dto';

import {
  Post,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';

// import { CurrentSession } from '../auth/session.decorator';
// import type { SessionData } from '../auth/session.decorator';
import { Roles } from '../auth/roles.guard';

@ApiTags('Courses')
@Controller('Courses')
export class CourseController {
  constructor(private readonly service: CourseService) {}

  //Create
  @Post()
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Create a Course',
    operationId: 'createCourse',
  })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: CourseSingleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid course payload',
  })
  @ApiResponse({
    status: 409,
    description: 'Course already exists',
  })
  create(@Body() dto: CreateCourseDto) {
    return this.service.create(dto);
  }

  //GetAll per but put method since we use body for filters
  @Post('getAll')
  @Roles()
  @ApiOperation({
    summary: 'Get all courses',
    operationId: 'getCourses',
  })
  @ApiQuery({
    name: 'Degree',
    required: false,
    type: String,
    description: 'Filter by Degree',
  })
  @ApiResponse({
    status: 200,
    description: 'Courses returned successfully',
    type: CourseListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No Courses found',
  })
  getAll(@Body() filters: CourseFilters): Promise<CourseListResponseDto> {
    return this.service.getAll(filters);
  }

  //GetById
  @Get(':CourseId')
  @Roles()
  @ApiOperation({
    summary: 'get a Course by ID',
    operationId: 'getCourseById',
  })
  @ApiResponse({
    status: 200,
    description: 'Course returned successfully',
    type: CourseSingleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Course ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  getById(@Param('CourseId', ParseUUIDPipe) CourseId: string) {
    return this.service.getById(CourseId);
  }

  //Update
  @Patch(':CourseId')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Update an Course',
    operationId: 'updateCourse',
  })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    type: CourseSingleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update payload or CourseId',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  update(
    @Param('CourseId', ParseUUIDPipe) CourseId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.service.update(CourseId, dto);
  }

  //Delete
  @Delete(':CourseId')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Delete Course by Course ID',
    operationId: 'deleteCourse',
  })
  @ApiResponse({
    status: 200,
    description: 'Course deleted successfully',
    type: DeleteCourseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Course ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  delete(@Param('CourseId', ParseUUIDPipe) CourseId: string) {
    return this.service.delete(CourseId);
  }
} //CourseController
