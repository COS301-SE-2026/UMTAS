import { University_Adapter } from '../University_Adapter';

//Dto's
import { ModuleListResponseDto } from 'src/Module/dto/module.dto';
import { CourseListResponseDto } from 'src/Course/dto/course.dto';
import { EventListResponseDto } from 'src/Events/dto/EventDto.dto';

//Exceptions
import { Injectable, NotImplementedException } from '@nestjs/common';

//http

//OpenLearning API
@Injectable()
export class Example_Adapter implements University_Adapter {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async authenticate() {}

  async getCourses(): Promise<CourseListResponseDto> {
    console.log(`Example_Adapter: getCourses`);

    const response = await (
      await fetch(`${this.baseUrl}/courses/`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      })
    ).json();

    const data = response.data;

    console.log(`Here: ${JSON.stringify(data[0])}`);

    throw new NotImplementedException();
  }

  async getModules(): Promise<ModuleListResponseDto> {
    throw new NotImplementedException();
  }

  async getEvents(): Promise<EventListResponseDto> {
    throw new NotImplementedException();
  }
}
