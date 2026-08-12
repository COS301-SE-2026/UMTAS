import {
  NotImplementedException,
  RequestTimeoutException,
} from '@nestjs/common';
import { University_Adapter } from '../University_Adapter';
import { CreateCourseDto } from 'src/Course/dto/course.dto';
import { ModuleListResponseDto } from 'src/Module/dto/module.dto';
import { EventListResponseDto } from 'src/Events/dto/EventDto.dto';

interface ExternalCourse {
  course_id: string;
  course_name: string;
  department: string;
  description: string;
}

export class NWU_Adapter implements University_Adapter {
  constructor(
    private readonly baseUrl: string,
    private readonly uniId: string,
  ) {}

  async authenticate(): Promise<void> {}

  async getCourses(): Promise<CreateCourseDto[]> {
    const response: ExternalCourse[] = await this.request('api/courses');

    const result: CreateCourseDto[] = response.map((course) => ({
      UniversityID: this.uniId,
      CourseName: course.course_name,
    }));
    // return courses;

    return result;

    throw new NotImplementedException();
  }

  async getModules(): Promise<ModuleListResponseDto> {
    throw new NotImplementedException();
  }

  async getEvents(): Promise<EventListResponseDto> {
    throw new NotImplementedException();
  }

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

  // 🎅's little helpers
}
