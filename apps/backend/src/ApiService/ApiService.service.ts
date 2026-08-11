import {
  BadRequestException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { CourseListResponseDto } from 'src/Course/dto/course.dto';
import { EventListResponseDto } from 'src/Events/dto/EventDto.dto';
import { ModuleListResponseDto } from 'src/Module/dto/module.dto';
import { UniversityDto } from 'src/University/dto/university.dto';
import { UniversityService } from 'src/University/university.service';
import { AdapterRegistry } from './Registry/AdapterRegistry';

//Context
@Injectable()
export class ApiService {
  constructor(private readonly uniService: UniversityService) {}

  async getCourses(uniId?: string): Promise<CourseListResponseDto> {
    const uni = await this.getUni(uniId);

    const registry = new AdapterRegistry(uni);

    const adapter = registry.get(uni.UniversityID);

    adapter.getCourses();

    throw new NotImplementedException();
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
