import { ApiService } from './ApiService.service';

import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';

//Responses
import { CourseListResponseDto } from '../Course/dto/course.dto';
import { EventListResponseDto } from '../Events/dto/EventDto.dto';
import { ModuleListResponseDto } from '../Module/dto/module.dto';

//Session data
import { CurrentSession } from '../auth/session.decorator';
import type { SessionData } from '../auth/session.decorator';
import { Roles } from 'src/auth/roles.guard';

@ApiTags('ApiService')
@Controller('api-service')
export class ApiServiceController {
  constructor(private readonly service: ApiService) {}

  @Get('/courses')
  @Roles()
  @ApiResponse({
    status: 201,
    description: 'Courses fetched successfully',
    type: CourseListResponseDto,
  })
  getCourses(
    @CurrentSession() session: SessionData,
  ): Promise<CourseListResponseDto> {
    const uniId = session.uniId;

    if (uniId === undefined || uniId.trim().length === 0)
      throw new BadRequestException(
        `It seems you are not referring to any university.`,
      );

    return this.service.getCourses(uniId);
  } //END_getCourses

  @Get('/modules')
  @Roles()
  @ApiResponse({
    status: 201,
    description: 'Modules fetched successfully',
    type: ModuleListResponseDto,
  })
  getModules(
    @CurrentSession() session: SessionData,
    @Query('courseId') courseId: string,
  ): Promise<ModuleListResponseDto> {
    const uniId = session.uniId;

    if (uniId === undefined || uniId.trim().length === 0)
      throw new BadRequestException(
        `It seems you are not referring to any university.`,
      );

    return this.service.getModules(session.user.id, uniId, courseId);
  } //END_getModules

  @Get('/events')
  @Roles()
  @ApiResponse({
    status: 201,
    description: 'Events fetched successfully',
    type: EventListResponseDto,
  })
  getEvents(
    @CurrentSession() session: SessionData,
    @Query('moduleId') moduleId: string,
  ): Promise<EventListResponseDto> {
    const uniId = session.uniId;

    if (uniId === undefined || uniId.trim().length === 0)
      throw new BadRequestException(
        `It seems you are not referring to any university.`,
      );

    return this.service.getEvents(session.user.id, uniId, moduleId);
  } //END_getEvents
}
