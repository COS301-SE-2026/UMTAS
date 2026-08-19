import { Injectable, Logger } from '@nestjs/common';
import { BuilderService } from './builder.service';
import { DatabaseService } from 'src/db/database.service';
import { UniversityService } from 'src/University/university.service';
import { CourseServiceV2 } from 'src/Course/courseV2.service';
import { ModuleServiceV2 } from 'src/Module/moduleV2.service';
import { CreateBuilderEventDto } from './dto/builder.dto';
import { AppDatabase } from 'src/auth/auth';
import { EventServiceV2 } from 'src/Events/eventV2.service';
import {
  CreateEventDtoV2,
  EventCriteriaDtoV2,
  EventSingleResponseDto,
} from 'src/Events/dto/EventDto.dto';
import { CreateModuleDto, ModulesDto } from 'src/Module/dto/module.dto';
import { CourseDto } from 'src/Course/dto/course.dto';

const PERS_MODULE_CODE: string = 'PERS';
@Injectable()
export class BuilderServiceV2 extends BuilderService {
  private readonly OOPSIE = new Logger(this.constructor.name);

  constructor(
    protected readonly dbService: DatabaseService,
    protected readonly uniService: UniversityService,
    protected readonly courseService: CourseServiceV2,
    protected readonly moduleService: ModuleServiceV2,
    protected readonly eventService: EventServiceV2,
  ) {
    super(dbService, uniService, courseService, moduleService);
  } //END_constr

  async createEvent(
    userId: string,
    dto: CreateBuilderEventDto,
    tx?: AppDatabase,
  ): Promise<EventSingleResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.createEvent(userId, dto, t);
      }); //END_transaction
    }

    //Get personal Course and Module
    const course = await this.doUserUniCourseCheck(userId, tx);
    const module = await this.getPersonalModule(userId, course);

    //If moduleId defined - create for module - else for personal module
    const moduleId = dto.eventCriteria?.moduleId ?? module.moduleID;

    const uniId = course.UniversityID;

    //Validate Dto
    const validated = this.validateCreateBuilderEventDto(dto, moduleId);

    const result = await this.eventService.createV2(
      validated,
      userId,
      uniId,
      tx,
    );

    return {
      ...result,
      message: `Personal event[${result.event.eventName}] created.`,
    };
  } //END_createEvent

  //🎅's little helpers

  //Validate createBuilderEventDto
  protected validateCreateBuilderEventDto(
    dto: CreateBuilderEventDto,
    moduleId: string,
  ): CreateEventDtoV2 {
    const v: CreateEventDtoV2 = {
      eventName: dto.eventName?.trim() ? dto.eventName : `Personal`,
      activityCode: dto.activityCode ?? 'Pers',
      activityType: dto.activityType?.trim() ? dto.activityType : 'lecture',
      eventCriteria: this.validateEventCriteria(dto, moduleId),
      isRecurring: dto.isRecurring ?? false,
    };

    return v;
  } //END_validateCreateBuilderEventDto

  //Validate EventCrieria -> EventCriteriaDtoV2
  protected validateEventCriteria(
    dto: CreateBuilderEventDto,
    moduleId: string,
  ): EventCriteriaDtoV2 {
    const v: EventCriteriaDtoV2 = {
      moduleId,
      ...dto.eventCriteria,
    };

    return v;
  } //END_validateEventCriteria

  /** Get Personal Module
   *
   * @param userId - Personal for user
   * @param course - CourseDto - Users personal course
   *
   * @abstract Will create a Personal module if not existing
   */
  protected async getPersonalModule(
    userId: string,
    course: CourseDto,
  ): Promise<ModulesDto> {
    const createModuleDto: CreateModuleDto = {
      moduleName: `Personal_Module [${userId}]`,
      moduleCode: PERS_MODULE_CODE,
      moduleDescription: `Module to hold all Personal Events`,
      CourseID: course.CourseID,
      validated: true,
    }; //createModuleDto

    const module = await this.moduleService.create(userId, createModuleDto); //module

    this.OOPSIE.log(`getPersonalModule: module=[${JSON.stringify(module)}]`);

    return module;
  } //END_getPersonalModule
}
