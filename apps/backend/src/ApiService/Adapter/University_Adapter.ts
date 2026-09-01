import { RequestTimeoutException } from '@nestjs/common';
import { CourseDto, CreateCourseDto } from 'src/Course/dto/course.dto';
import { CreateEventDtoV2 } from 'src/Events/dto/EventDto.dto';
import { CreateModuleDto, ModulesDto } from 'src/Module/dto/module.dto';
import { UniversityDto } from 'src/University/dto/university.dto';

export abstract class University_Adapter {
  protected uniID: string;
  protected baseUrl: string | null;
  protected apiKey: string | null;

  constructor(protected uni: UniversityDto) {
    this.uniID = uni.UniversityID;
    this.baseUrl = uni.BaseApiUrl ?? null;
    this.apiKey = uni.ApiKey ?? null;
  }

  abstract authenticate(): Promise<void>;

  /**
   * Get all courses at the university
   */
  abstract getCourses(page: number, limit: number): Promise<CreateCourseDto[]>;

  /**
   * Get all Modules for a selected course
   */
  abstract getModules(course: CourseDto): Promise<CreateModuleDto[]>;

  /**
   * Get all Events for a selected module
   */
  abstract getEvents(Module: ModulesDto): Promise<CreateEventDtoV2[]>;

  /**
   * Make a request to the external api, specifying only the url
   * @param url - Path for the endpoint being hit
   * @returns
   */
  async request<T = any>(
    url: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    await this.authenticate();

    const timeout = 15000; //15 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      let finalUrl = `${this.baseUrl}/${url}`;

      // console.log(`University_Adapter finalUrl: [${finalUrl}]`);
      if (params) {
        const queryParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });

        const queryString = queryParams.toString();
        if (queryString) {
          finalUrl += `?${queryString}`;
        }
      }

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
