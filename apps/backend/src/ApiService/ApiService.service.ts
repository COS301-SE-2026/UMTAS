import {
  BadRequestException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { CourseDto, CourseListResponseDto } from 'src/Course/dto/course.dto';
import { EventListResponseDto } from 'src/Events/dto/EventDto.dto';
import { ModuleListResponseDto } from 'src/Module/dto/module.dto';
import { UniversityDto } from 'src/University/dto/university.dto';
import { UniversityService } from 'src/University/university.service';
import { AdapterRegistry } from './Registry/AdapterRegistry';
import { CourseService } from 'src/Course/course.service';

//Context
@Injectable()
export class ApiService {
  constructor(
    private readonly uniService: UniversityService,
    private readonly courseService: CourseService,
    private readonly adapterRegistry: AdapterRegistry,
  ) {}

  async getCourses(uniId?: string): Promise<CourseListResponseDto> {
    const uni = await this.getUni(uniId);

    const adapter = this.adapterRegistry.getAdapter(uni);

    const result = await adapter.getCourses();

    const courses: CourseDto[] = await Promise.all(
      result.map((course) => this.courseService.create(course)),
    );

    return {
      courses,
      message: ``,
    };
  } //END_getCourses

  async getModules(uniId?: string): Promise<ModuleListResponseDto> {
    const uni = await this.getUni(uniId);

    console.log(uni);

    throw new NotImplementedException();
  } //END_getModules

  async getEvents(uniId?: string): Promise<EventListResponseDto> {
    const uni = await this.getUni(uniId);

    console.log(uni);

    throw new NotImplementedException();
  } //END_getEvents

  //🎅's little helpers
  private async getUni(uniId?: string): Promise<UniversityDto> {
    if (uniId === undefined || uniId.trim().length === 0)
      throw new BadRequestException(
        `It seems you are not referring to any university.`,
      );

    return await this.uniService.getById(uniId);
  } //END_getUni
} //END_ApiService
