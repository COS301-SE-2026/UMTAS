import { ApiService } from './ApiService.service';

import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';

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
    return this.service.getCourses(session.uniId);
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
  ): Promise<ModuleListResponseDto> {
    return this.service.getModules(session.uniId);
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
  ): Promise<EventListResponseDto> {
    return this.service.getEvents(session.uniId);
  } //END_getEvents
}
