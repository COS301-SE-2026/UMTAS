import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.guard';
import { CurrentSession, type SessionData } from '../auth/session.decorator';
import { AcademicCalendarService } from './academic_calendar.service';
import {
  AcademicCalendarDto,
  CalendarRestrictionDto,
  CalendarRestrictionListDto,
  CreateAcademicCalendarDto,
  CreateCalendarRestrictionDto,
  DeleteAcademicCalendarResponseDto,
  DeleteCalendarRestrictionResponseDto,
  GenerateCalendarDto,
  GeneratedCalendarDto,
  UpdateCalendarRestrictionDto,
} from './dto';

const CALENDAR_ID_PARAM = {
  name: 'id',
  type: String,
  format: 'uuid',
  description: 'Academic calendar ID',
} as const;

const RESTRICTION_ID_PARAM = {
  name: 'restrictionId',
  type: String,
  format: 'uuid',
  description: 'Calendar restriction ID',
} as const;

@ApiTags('Academic Calendar')
@Controller('academic-calendar')
export class AcademicCalendarController {
  constructor(private readonly service: AcademicCalendarService) {}

  @Post('generate')
  @Roles('student')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Generate and persist a calendar snapshot',
    description:
      "Generates a restriction-aware pseudo-calendar snapshot using the selected university's current-year academic calendar and a timetable owned by the authenticated student.",
    operationId: 'generateCalendar',
  })
  @ApiBody({ type: GenerateCalendarDto })
  @ApiResponse({
    status: 201,
    description: 'Calendar generated successfully',
    type: GeneratedCalendarDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid generation request',
  })
  @ApiResponse({
    status: 404,
    description: 'Calendar or timetable not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Calendar data conflicts',
  })
  @ApiResponse({
    status: 422,
    description: 'Calendar data cannot be converted into a valid snapshot',
  })
  @ApiResponse({
    status: 501,
    description: 'Calendar generation is not implemented',
  })
  generateCalendar(
    @CurrentSession() session: SessionData,
    @Body() dto: GenerateCalendarDto,
  ): Promise<GeneratedCalendarDto> {
    return this.service.generateCalendar(
      session.user.id,
      this.selectedUniversityId(session),
      dto,
    );
  }

  @Get('generate/:id')
  @Roles('student')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Get a generated calendar snapshot',
    description:
      'Returns a generated snapshot only when its timetable belongs to the authenticated student.',
    operationId: 'getGeneratedCalendar',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Generated calendar ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Generated calendar returned successfully',
    type: GeneratedCalendarDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid generated calendar ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Generated calendar not found',
  })
  getGeneratedCalendar(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GeneratedCalendarDto> {
    return this.service.getGeneratedCalendar(
      session.user.id,
      this.selectedUniversityId(session),
      id,
    );
  }

  @Post()
  @Roles('uni_admin')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Create an academic calendar',
    description:
      'Creates one calendar for the university selected in the current session and a four-digit academic year.',
    operationId: 'createAcademicCalendar',
  })
  @ApiBody({ type: CreateAcademicCalendarDto })
  @ApiResponse({
    status: 201,
    description: 'Academic calendar created successfully',
    type: AcademicCalendarDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid calendar payload',
  })
  @ApiResponse({
    status: 401,
    description: 'No active session',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'A calendar already exists for this university and year',
  })
  createCalendar(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateAcademicCalendarDto,
  ): Promise<AcademicCalendarDto> {
    return this.service.createCalendar(this.selectedUniversityId(session), dto);
  }

  @Get(':id/restrictions')
  @Roles('uni_admin')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: "List an academic calendar's restrictions",
    description:
      'Returns restrictions in chronological order for a calendar managed by the authenticated university administrator.',
    operationId: 'listCalendarRestrictions',
  })
  @ApiParam(CALENDAR_ID_PARAM)
  @ApiResponse({
    status: 200,
    description: 'Calendar restrictions returned successfully',
    type: CalendarRestrictionListDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid academic calendar ID',
  })
  @ApiResponse({
    status: 401,
    description: 'No active session',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Academic calendar not found',
  })
  getRestrictions(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CalendarRestrictionListDto> {
    return this.service.getRestrictions(this.selectedUniversityId(session), id);
  }

  @Post(':id/restrictions')
  @Roles('uni_admin')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Create an academic calendar restriction',
    description:
      'Creates a dated restriction. Omitted endDate defaults to startDate and omitted description defaults to an empty string.',
    operationId: 'createCalendarRestriction',
  })
  @ApiParam(CALENDAR_ID_PARAM)
  @ApiBody({ type: CreateCalendarRestrictionDto })
  @ApiResponse({
    status: 201,
    description: 'Calendar restriction created successfully',
    type: CalendarRestrictionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid restriction request',
  })
  @ApiResponse({
    status: 401,
    description: 'No active session',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Academic calendar not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Restriction conflicts with existing data',
  })
  @ApiResponse({
    status: 422,
    description: 'Restriction is not valid for its type',
  })
  createRestriction(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCalendarRestrictionDto,
  ): Promise<CalendarRestrictionDto> {
    return this.service.createRestriction(
      this.selectedUniversityId(session),
      id,
      dto,
    );
  }

  @Put(':id/restrictions/:restrictionId')
  @Roles('uni_admin')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Replace an academic calendar restriction',
    description:
      'Fully replaces a restriction after validating its date range and type-specific fields.',
    operationId: 'updateCalendarRestriction',
  })
  @ApiParam(CALENDAR_ID_PARAM)
  @ApiParam(RESTRICTION_ID_PARAM)
  @ApiBody({ type: UpdateCalendarRestrictionDto })
  @ApiResponse({
    status: 200,
    description: 'Calendar restriction updated successfully',
    type: CalendarRestrictionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid restriction request',
  })
  @ApiResponse({
    status: 401,
    description: 'No active session',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Calendar or restriction not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Restriction conflicts with existing data',
  })
  @ApiResponse({
    status: 422,
    description: 'Restriction is not valid for its type',
  })
  updateRestriction(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('restrictionId', ParseUUIDPipe) restrictionId: string,
    @Body() dto: UpdateCalendarRestrictionDto,
  ): Promise<CalendarRestrictionDto> {
    return this.service.updateRestriction(
      this.selectedUniversityId(session),
      id,
      restrictionId,
      dto,
    );
  }

  @Delete(':id/restrictions/:restrictionId')
  @Roles('uni_admin')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Delete an academic calendar restriction',
    description:
      'Deletes a restriction only when it belongs to the specified calendar in the selected university.',
    operationId: 'deleteCalendarRestriction',
  })
  @ApiParam(CALENDAR_ID_PARAM)
  @ApiParam(RESTRICTION_ID_PARAM)
  @ApiResponse({
    status: 200,
    description: 'Calendar restriction deleted successfully',
    type: DeleteCalendarRestrictionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid calendar or restriction ID',
  })
  @ApiResponse({
    status: 401,
    description: 'No active session',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Calendar or restriction not found',
  })
  deleteRestriction(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('restrictionId', ParseUUIDPipe) restrictionId: string,
  ): Promise<DeleteCalendarRestrictionResponseDto> {
    return this.service.deleteRestriction(
      this.selectedUniversityId(session),
      id,
      restrictionId,
    );
  }

  @Get(':id')
  @Roles('uni_admin')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Get an academic calendar',
    description:
      'Returns a calendar belonging to the university selected in the current session.',
    operationId: 'getAcademicCalendar',
  })
  @ApiParam(CALENDAR_ID_PARAM)
  @ApiResponse({
    status: 200,
    description: 'Academic calendar returned successfully',
    type: AcademicCalendarDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid academic calendar ID',
  })
  @ApiResponse({
    status: 401,
    description: 'No active session',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Academic calendar not found',
  })
  getCalendar(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicCalendarDto> {
    return this.service.getCalendar(this.selectedUniversityId(session), id);
  }

  @Delete(':id')
  @Roles('uni_admin')
  @ApiCookieAuth('umtas-session')
  @ApiOperation({
    summary: 'Delete an academic calendar',
    description:
      'Deletes a calendar and cascades to its restrictions. Deletion is rejected while generated snapshots reference it.',
    operationId: 'deleteAcademicCalendar',
  })
  @ApiParam(CALENDAR_ID_PARAM)
  @ApiResponse({
    status: 200,
    description: 'Academic calendar deleted successfully',
    type: DeleteAcademicCalendarResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid academic calendar ID',
  })
  @ApiResponse({
    status: 401,
    description: 'No active session',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Academic calendar not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Generated snapshots still reference this calendar',
  })
  deleteCalendar(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteAcademicCalendarResponseDto> {
    return this.service.deleteCalendar(this.selectedUniversityId(session), id);
  }

  private selectedUniversityId(session: SessionData): string {
    if (!session.uniId) {
      throw new ForbiddenException('No university selected');
    }
    return session.uniId;
  }
}
