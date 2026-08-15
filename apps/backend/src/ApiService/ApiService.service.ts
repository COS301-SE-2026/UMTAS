import {
  BadRequestException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { CourseDto, CourseListResponseDto } from 'src/Course/dto/course.dto';
import { EventListResponseDto } from 'src/Events/dto/EventDto.dto';
import { ModuleListResponseDto, ModulesDto } from 'src/Module/dto/module.dto';
import { UniversityDto } from 'src/University/dto/university.dto';
import { UniversityService } from 'src/University/university.service';
import { AdapterRegistry } from './Registry/AdapterRegistry';
import { CourseService } from 'src/Course/course.service';
import { ModuleService } from 'src/Module/module.service';

//Context
@Injectable()
export class ApiService {
  constructor(
    private readonly adapterRegistry: AdapterRegistry,
    private readonly uniService: UniversityService,
    private readonly courseService: CourseService,
    private readonly moduleService: ModuleService,
  ) {}

  async getCourses(uniId: string): Promise<CourseListResponseDto> {
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

  async getModules(
    userId: string,
    uniId: string,
    courseId: string,
  ): Promise<ModuleListResponseDto> {
    const uni = await this.getUni(uniId);

    //Course the user is referring to
    const course = await this.getCourse(courseId);

    const adapter = this.adapterRegistry.getAdapter(uni);

    const result = await adapter.getModules(course);

    const modules: ModulesDto[] = await Promise.all(
      result.map((module) => this.moduleService.create(userId, module)),
    );

    return {
      modules,
      message: `Modules returned for course[${course.CourseName}] = [${modules.length}]`,
    };

    throw new NotImplementedException();
  } //END_getModules

  async getEvents(uniId: string): Promise<EventListResponseDto> {
    const uni = await this.getUni(uniId);

    console.log(uni);

    throw new NotImplementedException();
  } //END_getEvents

  //🎅's little helpers
  private async getUni(uniId: string): Promise<UniversityDto> {
    return await this.uniService.getById(uniId);
  } //END_getUni

  private async getCourse(courseId: string): Promise<CourseDto> {
    if (courseId.trim().length === 0)
      throw new BadRequestException(`Invalid courseID`);

    return await this.courseService.getById(courseId);
  }
} //END_ApiService
