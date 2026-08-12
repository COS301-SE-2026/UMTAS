import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
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
  UpdateAcademicCalendarDto,
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
  @Public()
  @ApiOperation({
    summary: 'Generate and persist a calendar snapshot',
    operationId: 'generateAcademicCalendar',
  })
  @ApiBody({ type: GenerateCalendarDto })
  @ApiResponse({
    status: 201,
    description: 'Calendar generated successfully',
    type: GeneratedCalendarDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid generation request' })
  @ApiResponse({ status: 404, description: 'Calendar or timetable not found' })
  @ApiResponse({ status: 409, description: 'Calendar data conflicts' })
  @ApiResponse({
    status: 422,
    description: 'Calendar data cannot be converted into a valid snapshot',
  })
  generateCalendar(
    @Body() dto: GenerateCalendarDto,
  ): Promise<GeneratedCalendarDto> {
    return this.service.generateCalendar(dto);
  }

  @Get('generate/:id')
  @Public()
  @ApiOperation({
    summary: 'Get a generated calendar snapshot',
    operationId: 'getGeneratedAcademicCalendar',
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
  @ApiResponse({ status: 400, description: 'Invalid generated calendar ID' })
  @ApiResponse({ status: 404, description: 'Generated calendar not found' })
  getGeneratedCalendar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GeneratedCalendarDto> {
    return this.service.getGeneratedCalendar(id);
  }

  @Post()
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Create an academic calendar',
    operationId: 'createAcademicCalendar',
  })
  @ApiBody({ type: CreateAcademicCalendarDto })
  @ApiResponse({
    status: 201,
    description: 'Academic calendar created successfully',
    type: AcademicCalendarDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid calendar payload' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({
    status: 409,
    description: 'A calendar already exists for this university and year',
  })
  createCalendar(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateAcademicCalendarDto,
  ): Promise<AcademicCalendarDto> {
    return this.service.createCalendar(session.user.id, dto);
  }

  @Get(':id/restrictions')
  @Roles('uni_admin')
  @ApiOperation({
    summary: "List an academic calendar's restrictions",
    operationId: 'getCalendarRestrictions',
  })
  @ApiParam(CALENDAR_ID_PARAM)
  @ApiResponse({
    status: 200,
    description: 'Calendar restrictions returned successfully',
    type: CalendarRestrictionListDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid academic calendar ID' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Academic calendar not found' })
  getRestrictions(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CalendarRestrictionListDto> {
    return this.service.getRestrictions(session.user.id, id);
  }

  @Post(':id/restrictions')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Create an academic calendar restriction',
    operationId: 'createCalendarRestriction',
  })
  @ApiParam(CALENDAR_ID_PARAM)
  @ApiBody({ type: CreateCalendarRestrictionDto })
  @ApiResponse({
    status: 201,
    description: 'Calendar restriction created successfully',
    type: CalendarRestrictionDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid restriction request' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Academic calendar not found' })
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
    return this.service.createRestriction(session.user.id, id, dto);
  }

  @Put(':id/restrictions/:restrictionId')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Replace an academic calendar restriction',
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
  @ApiResponse({ status: 400, description: 'Invalid restriction request' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
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
      session.user.id,
      id,
      restrictionId,
      dto,
    );
  }

  @Delete(':id/restrictions/:restrictionId')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Delete an academic calendar restriction',
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
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({
    status: 404,
    description: 'Calendar or restriction not found',
  })
  deleteRestriction(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('restrictionId', ParseUUIDPipe) restrictionId: string,
  ): Promise<DeleteCalendarRestrictionResponseDto> {
    return this.service.deleteRestriction(session.user.id, id, restrictionId);
  }

  @Get(':id')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Get an academic calendar',
    operationId: 'getAcademicCalendar',
  })
  @ApiParam(CALENDAR_ID_PARAM)
  @ApiResponse({
    status: 200,
    description: 'Academic calendar returned successfully',
    type: AcademicCalendarDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid academic calendar ID' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Academic calendar not found' })
  getCalendar(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicCalendarDto> {
    return this.service.getCalendar(session.user.id, id);
  }

  @Put(':id')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Replace an academic calendar',
    operationId: 'updateAcademicCalendar',
  })
  @ApiParam(CALENDAR_ID_PARAM)
  @ApiBody({ type: UpdateAcademicCalendarDto })
  @ApiResponse({
    status: 200,
    description: 'Academic calendar updated successfully',
    type: AcademicCalendarDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid calendar request' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Academic calendar not found' })
  @ApiResponse({
    status: 409,
    description: 'A calendar already exists for this university and year',
  })
  updateCalendar(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicCalendarDto,
  ): Promise<AcademicCalendarDto> {
    return this.service.updateCalendar(session.user.id, id, dto);
  }

  @Delete(':id')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Delete an academic calendar',
    operationId: 'deleteAcademicCalendar',
  })
  @ApiParam(CALENDAR_ID_PARAM)
  @ApiResponse({
    status: 200,
    description: 'Academic calendar deleted successfully',
    type: DeleteAcademicCalendarResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid academic calendar ID' })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Academic calendar not found' })
  @ApiResponse({
    status: 409,
    description: 'Generated snapshots still reference this calendar',
  })
  deleteCalendar(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteAcademicCalendarResponseDto> {
    return this.service.deleteCalendar(session.user.id, id);
  }
}
