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

    const modules: ModulesDto[] = [];

    for (const module of result) {
      modules.push(await this.moduleService.create(userId, module));
    } //END_module

    return {
      modules,
      message: `Modules returned for course[${course.CourseName}] = [${modules.length}]`,
    };

    throw new NotImplementedException();
  } //END_getModules

  async getEvents(
    userId: string,
    uniId: string,
    moduleId: string,
  ): Promise<EventListResponseDto> {
    const uni = await this.getUni(uniId);

    const module = await this.getModule(userId, moduleId);

    const adapter = this.adapterRegistry.getAdapter(uni);

    const result = await adapter.getEvents(module);

    // const events: EventDto[] = [];

    for (const event of result) {
      console.log(event);
    } //END_event

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

  private async getModule(
    userId: string,
    moduleId: string,
  ): Promise<ModulesDto> {
    if (moduleId.trim().length === 0)
      throw new BadRequestException(`Invalid moduleID`);

    return await this.moduleService.getById(userId, moduleId);
  }
} //END_ApiService
