import { ApiService } from './ApiService.service';

import { ApiTags } from '@nestjs/swagger';
import { Controller } from '@nestjs/common';

//Responses
import { CourseListResponseDto } from '../Course/dto/course.dto';
import { EventListResponseDto } from '../Events/dto/EventDto.dto';
import { ModuleListResponseDto } from '../Module/dto/module.dto';

//Session data
import { CurrentSession } from '../auth/session.decorator';
import type { SessionData } from '../auth/session.decorator';

@ApiTags('ApiService')
@Controller('ApiService')
export class ApiController {
  constructor(private readonly service: ApiService) {}

  getCourses(
    @CurrentSession() session: SessionData,
  ): Promise<CourseListResponseDto> {
    return this.service.getCourses(session.uniId);
  } //END_getCourses

  getModules(
    @CurrentSession() session: SessionData,
  ): Promise<ModuleListResponseDto> {
    return this.service.getModules(session.uniId);
  } //END_getModules

  getEvents(
    @CurrentSession() session: SessionData,
  ): Promise<EventListResponseDto> {
    return this.service.getEvents(session.uniId);
  } //END_getEvents
}
