import {
  Param,
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  AttendanceFilters,
  AttendanceSingleResponse,
  AttendanceListResponse,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  deleteAttendanceResponse,
} from './dto/attendance.dto';

import { AttendanceService } from './attendance.service';
import { Roles } from '../auth/roles.guard';
import type { SessionData } from '../auth/session.decorator';
import { CurrentSession } from '../auth/session.decorator';
import { AttendanceSessionService } from './attendance-session.service';
import {
  AttendanceCaptureResultDto,
  AttendanceSessionResponseDto,
  CreateAttendanceSessionDto,
  RecordIdentifiedAttendanceDto,
  SessionAttendanceResponseDto,
  SetGuestCountDto,
  VerifiedAttendanceHistoryResponseDto,
} from './dto/attendance-session.dto';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly service: AttendanceService,
    private readonly sessionService: AttendanceSessionService,
  ) {}

  @Post('sessions')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Create an attendance session for an event occurrence',
    operationId: 'createAttendanceSession',
  })
  createSession(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateAttendanceSessionDto,
  ): Promise<AttendanceSessionResponseDto> {
    return this.sessionService.createSession(this.actor(session), dto);
  }

  @Get('sessions/:sessionId')
  @Roles('student', 'lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Get an attendance session and role-safe totals',
    operationId: 'getAttendanceSession',
  })
  getSession(
    @CurrentSession() session: SessionData,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<AttendanceSessionResponseDto> {
    return this.sessionService.getSession(this.actor(session), sessionId);
  }

  @Post('sessions/:sessionId/open')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Open attendance capture',
    operationId: 'openAttendanceSession',
  })
  openSession(
    @CurrentSession() session: SessionData,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<AttendanceSessionResponseDto> {
    return this.sessionService.openSession(this.actor(session), sessionId);
  }

  @Post('sessions/:sessionId/close')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Close attendance capture',
    operationId: 'closeAttendanceSession',
  })
  closeSession(
    @CurrentSession() session: SessionData,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<AttendanceSessionResponseDto> {
    return this.sessionService.closeSession(this.actor(session), sessionId);
  }

  @Post('sessions/:sessionId/cancel')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Cancel attendance capture',
    operationId: 'cancelAttendanceSession',
  })
  cancelSession(
    @CurrentSession() session: SessionData,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<AttendanceSessionResponseDto> {
    return this.sessionService.cancelSession(this.actor(session), sessionId);
  }

  /** Manual persistence primitives only; NFC, barcode, and camera adapters are intentionally absent. */
  @Post('sessions/:sessionId/records')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Record one identified attendee manually',
    operationId: 'recordManualAttendance',
  })
  recordManualAttendance(
    @CurrentSession() session: SessionData,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: RecordIdentifiedAttendanceDto,
  ): Promise<AttendanceCaptureResultDto> {
    return this.sessionService.recordIdentifiedAttendance(
      this.actor(session),
      sessionId,
      dto,
    );
  }

  @Put('sessions/:sessionId/attendance/count')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Replace the aggregate guest count manually',
    operationId: 'setManualAttendanceCount',
  })
  setManualAttendanceCount(
    @CurrentSession() session: SessionData,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SetGuestCountDto,
  ): Promise<SessionAttendanceResponseDto> {
    return this.sessionService.setGuestCount(
      this.actor(session),
      sessionId,
      dto,
    );
  }

  @Get('me/verified-history')
  @Roles('student', 'lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Get only the current user’s identified attendance history',
    operationId: 'getVerifiedAttendanceHistory',
  })
  getVerifiedHistory(
    @CurrentSession() session: SessionData,
  ): Promise<VerifiedAttendanceHistoryResponseDto> {
    return this.sessionService.getOwnVerifiedHistory(this.actor(session));
  }

  @Post()
  @Roles('student')
  @ApiOperation({
    summary: 'Create attendance record for current user for an event',
    operationId: 'createAttendance',
  })
  @ApiBody({ type: CreateAttendanceDto })
  createAttendance(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateAttendanceDto,
  ): Promise<AttendanceSingleResponse> {
    return this.service.createAttendance(session.user.id, dto);
  } //END_createAttendance

  //GetAllAttendance records - with filters
  @Get()
  @Roles('student', 'lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Get all attendance records for user or with filters',
    operationId: 'getAllAttendance',
  })
  getAllAttendance(
    @CurrentSession() session: SessionData,
    @Query() filters: AttendanceFilters,
  ): Promise<AttendanceListResponse> {
    return this.service.getAllAttendanceRecords(session.user.id, {
      eventID: filters.eventID,
      eventDate: filters.eventDate,
      state: filters.state,
      AlsoFilterByUser: filters.AlsoFilterByUser,
    });
  } //END_getAllAttendance

  //get by attendanceID
  @Get(':attendanceId')
  @Roles('student', 'lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Get attendance record by attendanceID',
    operationId: 'getAttendanceById',
  })
  getById(
    @Param('attendanceId', ParseUUIDPipe) attendanceId: string,
  ): Promise<AttendanceSingleResponse> {
    return this.service.getById(attendanceId);
  } //END_getById

  //Update attendance record
  @Patch(':attendanceId')
  @Roles('student')
  @ApiOperation({
    summary: 'Update date or state of attendance',
    operationId: 'updateAttendance',
  })
  @ApiBody({ type: UpdateAttendanceDto })
  updateAttendance(
    @Param('attendanceId', ParseUUIDPipe) attendanceId: string,
    @Body() dto: UpdateAttendanceDto,
  ): Promise<AttendanceSingleResponse> {
    return this.service.updateAttendanceRecord(attendanceId, dto);
  } //END_updateAttendance

  @Delete(':attendanceId')
  @Roles('student')
  @ApiOperation({
    summary:
      'Delete an attendance record - effectively making attendance NOT_STATED',
    operationId: 'deleteAttendance',
  })
  deleteAttendance(
    @Param('attendanceId', ParseUUIDPipe) attendanceId: string,
  ): Promise<deleteAttendanceResponse> {
    return this.service.deleteAttendance(attendanceId);
  } //END_deleteAttendance

  private actor(session: SessionData) {
    return {
      userId: session.user.id,
      uniRole: session.uniRole,
      uniId: session.uniId,
    };
  }
} //END_AttendanceController
