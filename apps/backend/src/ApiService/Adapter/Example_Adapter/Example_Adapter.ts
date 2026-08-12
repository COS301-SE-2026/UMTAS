import { University_Adapter } from '../University_Adapter';

//Dto's
import { ModuleListResponseDto } from 'src/Module/dto/module.dto';
import { CourseListResponseDto } from 'src/Course/dto/course.dto';
import { EventListResponseDto } from 'src/Events/dto/EventDto.dto';

//Exceptions
import {
  Injectable,
  NotImplementedException,
  RequestTimeoutException,
} from '@nestjs/common';

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

    const response = await this.request('courses');

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

  //🎅's little helpers
  async request<T = any>(url: string): Promise<T> {
    const timeout = 10000; //10 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      let finalUrl = `${this.baseUrl}/${url}`;
      finalUrl = finalUrl.endsWith('/') ? finalUrl : `${finalUrl}/`;

      //example: url='courses'
      const response = await fetch(`${finalUrl}`, {
        signal: controller.signal,
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      //someting wrong
      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} | ${response.statusText}`,
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return (await response.text()) as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new RequestTimeoutException(
          `Request timed out after ${timeout}ms`,
        );
      }

      throw error;
    }
  }
}
