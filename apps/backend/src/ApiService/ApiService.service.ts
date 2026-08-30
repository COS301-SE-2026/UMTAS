import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CourseDto,
  CourseListResponseDto,
  CourseSingleResponseDto,
} from 'src/Course/dto/course.dto';
import { EventDto, EventListResponseDto } from 'src/Events/dto/EventDto.dto';
import { ModuleListResponseDto, ModulesDto } from 'src/Module/dto/module.dto';
import { UniversityDto } from 'src/University/dto/university.dto';
import { UniversityService } from 'src/University/university.service';
import { AdapterRegistry } from './Registry/AdapterRegistry.service';
import { EventServiceV2 } from 'src/Events/eventV2.service';
import { ModuleServiceV2 } from 'src/Module/moduleV2.service';
import { CourseServiceV2 } from 'src/Course/courseV2.service';

//Context
@Injectable()
export class ApiService {
  constructor(
    private readonly adapterRegistry: AdapterRegistry,
    private readonly uniService: UniversityService,
    private readonly courseService: CourseServiceV2,
    private readonly moduleService: ModuleServiceV2,
    private readonly eventService: EventServiceV2,
  ) {}

  async getCourses(
    uniId: string,
    page: number,
    limit: number,
  ): Promise<CourseListResponseDto> {
    const uni = await this.getUni(uniId);

    const adapter = this.adapterRegistry.getAdapter(uni);

    const result = await adapter.getCourses(page, limit);

    const courses: CourseDto[] = await Promise.all(
      result.map((course) => this.courseService.create(course)),
    );

    return {
      courses,
      message: `Number of courses returned = [${courses.length}]`,
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

    const events: EventDto[] = [];

    for (const event of result) {
      events.push(
        (await this.eventService.createV2(event, userId, uniId)).event,
      );
    } //END_event

    return {
      events,
      message: `Events returned for Module[${module.moduleName}] = [${events.length}]`,
    };
  } //END_getEvents

  async getCourseWithModulesAndEvents(
    userId: string,
    uniId: string,
    courseId: string,
  ): Promise<CourseSingleResponseDto> {
    const course = await this.getCourse(courseId);

    const modules = (await this.getModules(userId, uniId, courseId)).modules;

    for (const m of modules) {
      m.Events = (await this.getEvents(userId, uniId, m.moduleID)).events;
    } //END_m

    course.Modules = modules;

    return course;
  } //END_getCourseWithModulesAndEvents

  //🎅's little helpers
  protected async getUni(uniId: string): Promise<UniversityDto> {
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
