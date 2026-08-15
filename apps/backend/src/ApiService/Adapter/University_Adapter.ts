import { RequestTimeoutException } from '@nestjs/common';
import { CreateCourseDto } from 'src/Course/dto/course.dto';
import { CreateEventDto } from 'src/Events/dto/EventDto.dto';
import { CreateModuleDto } from 'src/Module/dto/module.dto';

export abstract class University_Adapter {
  constructor(
    protected readonly baseUrl: string,
    protected readonly uniId: string,
  ) {}

  abstract authenticate(): Promise<void>;

  abstract getCourses(): Promise<CreateCourseDto[]>;

  abstract getModules(): Promise<CreateModuleDto[]>;

  abstract getEvents(): Promise<CreateEventDto[]>;

  /**
   * Make a request to the external api, specifying only the url
   * @param url - Path for the endpoint being hit
   * @returns
   */
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
}
