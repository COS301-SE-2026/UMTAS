import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import {
  CurrentSession,
  CurrentUniId,
  type SessionData,
} from 'src/auth/session.decorator';
import { Roles } from 'src/auth/roles.guard';

import { StudentRoutingService } from './student-routing.service';
import {
  AlternativeRoutesQueryDto,
  AlternativeRoutesResponseDto,
  StudentRoutesQueryDto,
  StudentRoutesResponseDto,
} from './dto';

@ApiTags('Student Routes')
@ApiSecurity('umtas-session')
@Controller('routes/student')
export class StudentRoutingController {
  constructor(private readonly studentRoutingService: StudentRoutingService) {}

  @Get()
  @Roles('student')
  @ApiOperation({
    summary: 'Get a students routes for a date',
    description:
      'Returns the students attended events for the requested date and the routes between events.',
    operationId: 'getStudentRoutesForDate',
  })
  @ApiOkResponse({
    description: 'Student routes returned successfully',
    type: StudentRoutesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The requested date is invalid',
  })
  @ApiNotFoundResponse({
    description: 'A required event, venue, building, or route was not found',
  })
  getRoutesForDate(
    @CurrentSession() session: SessionData,
    @CurrentUniId() uniId: string,
    @Query() query: StudentRoutesQueryDto,
  ): Promise<StudentRoutesResponseDto> {
    return this.studentRoutingService.getRoutesForDate(
      session.user.id,
      uniId,
      query,
    );
  } //END_getRoutesForDate

  @Get('alternatives')
  @Roles('student')
  @ApiOperation({
    summary: 'Get an alternative route between two events',
    description:
      'Returns the selected indexed route between the buildings of two events on a requested date. Route index 0 is the default route.',
    operationId: 'getAlternativeRouteBetweenEvents',
  })
  @ApiOkResponse({
    description: 'Alternative route returned successfully',
    type: AlternativeRoutesResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'The events are invalid, identical, in the same building, or the route index is invalid',
  })
  @ApiNotFoundResponse({
    description:
      'The events are not attended on the requested date, or the requested route is unavailable',
  })
  getAlternativeRouteBetweenEvents(
    @CurrentSession() session: SessionData,
    @CurrentUniId() uniId: string,
    @Query() query: AlternativeRoutesQueryDto,
  ): Promise<AlternativeRoutesResponseDto> {
    return this.studentRoutingService.getAlternativeRouteBetweenEvents(
      session.user.id,
      uniId,
      query,
    );
  } //END_getAlternativeRouteBetweenEvents
} //END_StudentRoutingController
