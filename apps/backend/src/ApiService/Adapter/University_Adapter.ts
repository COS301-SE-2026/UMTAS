import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { CourseDto, CreateCourseDto } from 'src/Course/dto/course.dto';
import { CreateEventDtoV2 } from 'src/Events/dto/EventDto.dto';
import { CreateModuleDto, ModulesDto } from 'src/Module/dto/module.dto';
import { UniversityDto } from 'src/University/dto/university.dto';

type ErrorResponseBody = Record<string, unknown> | string | null;

export class ExternalApiException extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: ErrorResponseBody,
  ) {
    super(`External API error: ${status} ${statusText}`);
  }
} //END_ExternalApiException

export abstract class University_Adapter {
  protected readonly uniID: string;
  protected readonly baseUrl: string;
  protected apiKey: string | null;

  private readonly REQUEST_TIMEOUT_MS = 10000;

  protected headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  private isAuthenticated: boolean = false;

  constructor(protected readonly uni: UniversityDto) {
    this.uniID = uni.UniversityID;
    this.baseUrl = uni.BaseApiUrl!;
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
  abstract getEvents(module: ModulesDto): Promise<CreateEventDtoV2[]>;

  /**
   * Make a request to the external api, specifying only the url
   * @param url - Path for the endpoint being hit
   * @returns
   */
  protected async request<T>(
    url: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    //authenticate
    if (!this.isAuthenticated) {
      await this.authenticate();
      this.isAuthenticated = true;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.REQUEST_TIMEOUT_MS,
    );

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

      //make actual http request
      const doFetch = async (): Promise<Response> => {
        return fetch(finalUrl, {
          signal: controller.signal,
          headers: this.headers,
        });
      };

      let response = await doFetch();

      //If our time expired on authentication - retry only once
      if (response.status === 401 || response.status === 403) {
        this.isAuthenticated = false;
        await this.authenticate();
        this.isAuthenticated = true;
        response = await doFetch();
      }

      clearTimeout(timeoutId);

      //someting wrong
      if (!response.ok) {
        let body: ErrorResponseBody = null;

        try {
          body = (await response.json()) as Record<string, unknown>;
        } catch {
          body = await response.text();
        }

        throw new ExternalApiException(
          response.status,
          response.statusText,
          body,
        );
      }

      const contentType = response.headers.get('content-type');
      return contentType?.includes('application/json')
        ? await response.json()
        : ((await response.text()) as T);
    } catch (error) {
      clearTimeout(timeoutId);

      //Times up
      if (error instanceof Error && error.name === 'AbortError') {
        throw new RequestTimeoutException(
          `Request timed out after ${this.REQUEST_TIMEOUT_MS}ms`,
        );
      }

      if (error instanceof ExternalApiException) {
        const message = error.body || error.message;

        switch (error.status) {
          case 400:
            throw new BadRequestException(message);
          case 401:
          case 403:
            throw new UnauthorizedException(message);
          case 404:
            throw new NotFoundException(message);
          default:
            throw new InternalServerErrorException(message);
        } //END_switch
      }

      throw error;
    }
  } //END_request
}
