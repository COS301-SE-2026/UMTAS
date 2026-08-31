import { ApiService } from './ApiService.service';

import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Query,
} from '@nestjs/common';

//Responses
import {
  CourseListResponseDto,
  CourseSingleResponseDto,
} from '../Course/dto/course.dto';
import { EventListResponseDto } from '../Events/dto/EventDto.dto';
import { ModuleListResponseDto } from '../Module/dto/module.dto';

//Session data
import { CurrentSession } from '../auth/session.decorator';
import type { SessionData } from '../auth/session.decorator';
import { Roles } from 'src/auth/roles.guard';

//kontant
import { getRedisClient } from 'src/redis/redis';

const TTL: number = parseInt(process.env.Api_Service_TTL || '300', 10);
// const TTL = 0;

@ApiTags('ApiService')
@Controller('api-service')
export class ApiServiceController {
  private readonly logging = process.env.DEV;

  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly service: ApiService) {}

  @Get('/courses')
  @Roles()
  @ApiOperation({
    summary: 'Fetch courses',
    description: "Fetches courses for the authenticated user's university.",
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 0,
    description: 'Page index: zero index',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 50,
    description: 'Courses per page',
  })
  @ApiBadRequestResponse({
    description: 'The authenticated user is not associated with a university.',
  })
  @ApiNotFoundResponse({
    description: 'The university or its API adapter could not be found.',
  })
  @ApiResponse({
    status: 200,
    description: 'Courses fetched successfully',
    type: CourseListResponseDto,
  })
  async getCourses(
    @CurrentSession() session: SessionData,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ): Promise<CourseListResponseDto> {
    const startTime = Date.now();

    //Validate page and limit
    const vPage = Number(page);
    const vLimit = Number(limit);

    if (vPage < 0 || vLimit < 0 || vLimit > 100)
      throw new BadRequestException(
        `Invalid page[${vPage}] or limit[${vLimit}]`,
      );
    //END_Validate page and limit

    //Validate University ID
    const uniId = session.uniId;

    if (uniId === undefined || uniId.trim().length === 0)
      throw new BadRequestException(
        `You have not selected a university. Tsk Tsk Tsk.`,
      );
    //END_Validate uniID

    //get cache client
    const redis = getRedisClient();
    //unique key to identify cache members
    const kontantKey = `api-service:courses:${uniId}:${vPage}:${vLimit}`;
    //if cache item exists -> return early
    if (redis) {
      try {
        const geKontant = await redis.get(kontantKey);

        if (geKontant) {
          const duration = Date.now() - startTime;
          this.log(
            `\x1b[1;36m KONTANT HIT: ${kontantKey} | ${duration}ms\x1b[0m`,
          );
          return JSON.parse(geKontant) as CourseListResponseDto;
        }
      } catch (error) {
        this.warn(`Redis GET failed: ${error}`);
      }
    }

    //Fetch from api
    const result = await this.service.getCourses(
      uniId,
      Number(vPage),
      Number(vLimit),
    );

    //Cache for 5mins
    if (redis) {
      try {
        await redis.set(kontantKey, JSON.stringify(result), 'EX', TTL);
      } catch (error) {
        this.warn(`Redis SET failed: ${error}`);
      }
    }

    const duration = Date.now() - startTime;
    this.log(
      `\x1b[38;5;208m KONTANT MIS: ${kontantKey} | ${duration}ms\x1b[0m`,
    );

    return result;
  } //END_getCourses

  @Get('course')
  @Roles()
  @ApiOperation({
    summary: 'Get a specific course',
    description:
      'Returns the specified course together with its module and events.',
  })
  @ApiQuery({
    name: 'courseId',
    required: true,
    type: String,
    description: 'UUID of the course to fetch.',
  })
  @ApiBadRequestResponse({
    description: 'The authenticated user is not associated with a university.',
  })
  @ApiNotFoundResponse({
    description: 'The university or its API adapter could not be found.',
  })
  @ApiResponse({
    status: 200,
    description: 'Course fetched successfully',
    type: CourseSingleResponseDto,
  })
  async getCourse(
    @CurrentSession() session: SessionData,
    @Query('courseId') courseId: string,
  ): Promise<CourseSingleResponseDto> {
    const uniId = session.uniId;

    if (uniId === undefined || uniId.trim().length === 0)
      throw new BadRequestException(
        `You have not selected a university. Tsk Tsk Tsk.`,
      );

    return await this.service.getCourseWithModulesAndEvents(
      session.user.id,
      uniId,
      courseId,
    );
  } //END_getCourse

  @Get('/modules')
  @Roles()
  @ApiOperation({
    summary: 'Fetch modules',
    description:
      "Fetches modules for a course at the authenticated user's university.",
  })
  @ApiQuery({
    name: 'courseId',
    required: true,
    type: String,
    description: 'UUID of the course to fetch modules for.',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @ApiResponse({
    status: 200,
    description: 'Modules fetched successfully.',
    type: ModuleListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The university or course ID is invalid.',
  })
  @ApiNotFoundResponse({
    description: 'The university, course, or API adapter could not be found.',
  })
  async getModules(
    @CurrentSession() session: SessionData,
    @Query('courseId') courseId: string,
  ): Promise<ModuleListResponseDto> {
    const startTime = Date.now();

    const uniId = session.uniId;

    if (uniId === undefined || uniId.trim().length === 0)
      throw new BadRequestException(
        `You have not selected a university. Tsk Tsk Tsk.`,
      );

    //get cache client
    const redis = getRedisClient();
    //unique key to identify cache members
    const kontantKey = `api-service:modules:${uniId}:${courseId}`;
    //if cache item exists -> return early
    if (redis) {
      try {
        const geKontant = await redis.get(kontantKey);

        if (geKontant) {
          const duration = Date.now() - startTime;
          this.log(
            `\x1b[1;36m KONTANT HIT: ${kontantKey} | ${duration}ms\x1b[0m`,
          );
          return JSON.parse(geKontant) as ModuleListResponseDto;
        }
      } catch (error) {
        this.warn(`Redis GET failed: ${error}`);
      }
    }

    const result = await this.service.getModules(
      session.user.id,
      uniId,
      courseId,
    );

    //Cache for 5mins
    if (redis) {
      try {
        await redis.set(kontantKey, JSON.stringify(result), 'EX', TTL);
      } catch (error) {
        this.warn(`Redis SET failed: ${error}`);
      }
    }

    const duration = Date.now() - startTime;
    this.log(
      `\x1b[38;5;208m KONTANT MIS: ${kontantKey} | ${duration}ms\x1b[0m`,
    );

    return result;
  } //END_getModules

  @Get('/events')
  @Roles()
  @ApiOperation({
    summary: 'Fetch events',
    description:
      "Fetches events for a module at the authenticated user's university.",
  })
  @ApiQuery({
    name: 'moduleId',
    required: true,
    type: String,
    description: 'UUID of the module to fetch events for.',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @ApiResponse({
    status: 200,
    description: 'Events fetched successfully.',
    type: EventListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The university or module ID is invalid.',
  })
  @ApiNotFoundResponse({
    description: 'The university, module, or API adapter could not be found.',
  })
  async getEvents(
    @CurrentSession() session: SessionData,
    @Query('moduleId') moduleId: string,
  ): Promise<EventListResponseDto> {
    const startTime = Date.now();

    const uniId = session.uniId;

    if (uniId === undefined || uniId.trim().length === 0)
      throw new BadRequestException(
        `You have not selected a university. Tsk Tsk Tsk.`,
      );

    //get cache client
    const redis = getRedisClient();
    //unique key to identify cache members
    const kontantKey = `api-service:events:${uniId}:${moduleId}`;
    //if cache item exists -> return early
    if (redis) {
      try {
        const geKontant = await redis.get(kontantKey);

        if (geKontant) {
          const duration = Date.now() - startTime;
          this.log(
            `\x1b[1;36m KONTANT HIT: ${kontantKey} | ${duration}ms\x1b[0m`,
          );
          return JSON.parse(geKontant) as EventListResponseDto;
        }
      } catch (error) {
        this.warn(`Redis GET failed: ${error}`);
      }
    }

    const result = await this.service.getEvents(
      session.user.id,
      uniId,
      moduleId,
    );

    //Cache for 5mins
    if (redis) {
      try {
        await redis.set(kontantKey, JSON.stringify(result), 'EX', TTL);
      } catch (error) {
        this.warn(`Redis SET failed: ${error}`);
      }
    }

    const duration = Date.now() - startTime;
    this.log(
      `\x1b[38;5;208m KONTANT MIS: ${kontantKey} | ${duration}ms\x1b[0m`,
    );

    return result;
  } //END_getEvents

  //🎅's little helpers
  private log(message: string) {
    if (this.logging) {
      this.logger.log(message);
    }
  }

  private warn(message: string) {
    if (this.logging) {
      this.logger.warn(message);
    }
  }
}
