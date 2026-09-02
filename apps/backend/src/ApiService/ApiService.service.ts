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
import { DatabaseService } from 'src/db/database.service';
import { AppDatabase } from 'src/auth/auth';

//Context
@Injectable()
export class ApiService {
  constructor(
    private readonly dbService: DatabaseService,
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

    const courses: CourseDto[] = await this.dbService.db.transaction(
      async (tx: AppDatabase) => {
        const out: CourseDto[] = [];

        for (const c of result) {
          if (c.ExternalID) {
            const course = await this.courseService.getByExternalID(
              c.ExternalID,
              uni.UniversityID,
              tx,
            );

            //If course already exists - check for updated fields and update - return
            if (course) {
              const nonMatchingFields = this.getChanges(c, course);

              if (Object.keys(nonMatchingFields).length > 0) {
                out.push(
                  await this.courseService.update(
                    course.CourseID,
                    nonMatchingFields,
                    tx,
                  ),
                );

                continue;
              }

              out.push(course);
              continue;
            }
          }
        } //END_c

        return out;
      }, //END_tx
    ); //END_transaction

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

    const modules: ModulesDto[] = await this.dbService.db.transaction(
      async (tx: AppDatabase) => {
        const out: ModulesDto[] = [];

        for (const m of result) {
          if (m.ExternalID) {
            const module = await this.moduleService.getByExternalID(
              m.ExternalID,
              course.CourseID,
              tx,
            );

            if (module) {
              const changes = this.getChanges(m, module);

              if (Object.keys(changes).length > 0) {
                out.push(
                  await this.moduleService.update(
                    userId,
                    module.moduleID,
                    changes,
                    tx,
                  ),
                );
                continue;
              }

              out.push(module);
              continue;
            }
          }

          out.push(await this.moduleService.create(userId, m, tx));
        } //END_m

        return out;
      }, //END_tx
    ); //END_transaction

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

    const events: EventDto[] = await this.dbService.db.transaction(
      async (tx: AppDatabase) => {
        const out: EventDto[] = [];

        for (const e of result) {
          const created = await this.eventService.createV2(
            e,
            userId,
            uniId,
            tx,
          );
          out.push(created.event);
        } //END_e

        return out;
      }, //END_tx
    ); //END_transaction

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

  private getChanges<D extends object, T extends object>(
    dto: D,
    dbObject: T,
  ): Partial<D> {
    return Object.fromEntries(
      Object.entries(dto).filter(
        ([key, value]) => value !== dbObject[key as keyof T],
      ),
    ) as Partial<D>;
  } //END_getChanges
} //END_ApiService
