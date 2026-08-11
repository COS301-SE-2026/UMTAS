import { University_Adapter } from './University_Adapter';

//Dto's
import { ModuleListResponseDto } from 'src/Module/dto/module.dto';
import { CourseListResponseDto } from 'src/Course/dto/course.dto';
import { EventListResponseDto } from 'src/Events/dto/EventDto.dto';

//Exceptions
import { NotImplementedException } from '@nestjs/common';

export class Example_Adapter extends University_Adapter {
  async authenticate() {}

  async getCourses(): Promise<CourseListResponseDto> {
    throw new NotImplementedException();
  }

  async getModules(): Promise<ModuleListResponseDto> {
    throw new NotImplementedException();
  }

  async getEvents(): Promise<EventListResponseDto> {
    throw new NotImplementedException();
  }
}
