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
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

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
import { OptionalAuth } from '../auth/auth.guard';
import { AttendanceSessionService } from './attendance-session.service';
import { NfcAttendanceService } from './nfc-attendance.service';
import { AttendanceCaptureService } from './attendance-capture.service';
import {
  AttendanceCaptureResultDto,
  AttendanceSessionFiltersDto,
  AttendanceSessionListResponseDto,
  AttendanceRecordResponseDto,
  AttendanceSessionResponseDto,
  CreateAttendanceSessionDto,
  DeleteAttendanceSessionResponseDto,
  RecordIdentifiedAttendanceDto,
  RecordBarcodeAttendanceDto,
  RecordCameraAttendanceDto,
  RecordAttendanceDto,
  SessionAttendanceResponseDto,
  SetGuestCountDto,
  UpdateAttendanceSessionDto,
  VerifiedAttendanceHistoryResponseDto,
} from './dto/attendance-session.dto';
import {
  ConfirmNfcTagRegistrationDto,
  NfcCheckInDto,
  NfcTagRegistrationResponseDto,
  NfcTagTestResponseDto,
  OperatorAttendanceSlotsResponseDto,
  OperatorSlotsQueryDto,
  RegisteredNfcTagDto,
  RegisteredNfcTagStatusDto,
  SelectPreferredEventDto,
  OperatorAttendanceSlotDto,
} from './dto/nfc-attendance.dto';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly service: AttendanceService,
    private readonly sessionService: AttendanceSessionService,
    private readonly captureService: AttendanceCaptureService,
    private readonly nfcService: NfcAttendanceService,
  ) {}

  @Get('nfc-tags/me')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Get the current operator NFC sticker status',
    operationId: 'getMyNfcTag',
  })
  getMyNfcTag(
    @CurrentSession() session: SessionData,
  ): Promise<RegisteredNfcTagStatusDto> {
    return this.nfcService
      .getRegisteredTag(this.actor(session))
      .then((tag) => ({ tag }));
  }

  @Post('nfc-tags/registration')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Prepare a replacement NFC sticker credential',
    operationId: 'prepareNfcTagRegistration',
  })
  @ApiBody({ schema: { type: 'object', additionalProperties: false } })
  prepareNfcTagRegistration(
    @CurrentSession() session: SessionData,
    @Body() _body: Record<string, never>,
  ): NfcTagRegistrationResponseDto {
    return this.nfcService.prepareRegistration(this.actor(session));
  }

  @Post('nfc-tags/registration/confirm')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Confirm a written NFC sticker and activate it',
    operationId: 'confirmNfcTagRegistration',
  })
  confirmNfcTagRegistration(
    @CurrentSession() session: SessionData,
    @Body() dto: ConfirmNfcTagRegistrationDto,
  ): Promise<RegisteredNfcTagDto> {
    return this.nfcService.confirmRegistration(
      this.actor(session),
      dto.activationTicket,
    );
  }

  @Post('nfc-tags/test')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Validate the current operator NFC sticker without attendance',
    operationId: 'testNfcTag',
  })
  testNfcTag(
    @CurrentSession() session: SessionData,
    @Body() dto: NfcCheckInDto,
  ): Promise<NfcTagTestResponseDto> {
    return this.nfcService.testRegisteredTag(this.actor(session), dto);
  }

  @Get('operator/slots')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'List the current operator event occurrences for one date',
    operationId: 'getOperatorAttendanceSlots',
  })
  @ApiQuery({ name: 'date', required: false, example: '2026-09-17' })
  getOperatorAttendanceSlots(
    @CurrentSession() session: SessionData,
    @Query() query: OperatorSlotsQueryDto,
  ): Promise<OperatorAttendanceSlotsResponseDto> {
    return this.captureService.getOperatorSlots(
      this.actor(session),
      query.date,
    );
  }

  @Put('operator/preferred-event')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Select the operator preferred attendance event',
    operationId: 'selectPreferredAttendanceEvent',
  })
  selectPreferredAttendanceEvent(
    @CurrentSession() session: SessionData,
    @Body() dto: SelectPreferredEventDto,
  ): Promise<OperatorAttendanceSlotDto> {
    return this.captureService.selectPreferredEvent(this.actor(session), dto);
  }

  @Delete('operator/preferred-event')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Clear the operator preferred attendance event',
    operationId: 'clearPreferredAttendanceEvent',
  })
  clearPreferredAttendanceEvent(
    @CurrentSession() session: SessionData,
  ): Promise<void> {
    return this.captureService.clearPreferredEvent(this.actor(session));
  }

  @Post('records')
  @OptionalAuth()
  @ApiOperation({
    summary: 'Record identified or guest attendance from an NFC sticker',
    operationId: 'recordAttendance',
    security: [{ cookie: [] }, {}],
  })
  recordAttendance(
    @CurrentSession() session: SessionData | undefined,
    @Body() dto: RecordAttendanceDto,
  ): Promise<AttendanceRecordResponseDto> {
    return this.captureService.recordAttendance(
      session ? this.actor(session) : undefined,
      dto,
    );
  }

  @Post('records/barcode')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Record the user resolved from a barcode in the current slot',
    operationId: 'recordBarcodeAttendance',
  })
  recordBarcodeAttendance(
    @CurrentSession() session: SessionData,
    @Body() dto: RecordBarcodeAttendanceDto,
  ): Promise<AttendanceCaptureResultDto> {
    return this.captureService.recordBarcodeAttendance(
      this.actor(session),
      dto,
    );
  }

  @Put('records/camera')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Replace the anonymous headcount for the current slot',
    operationId: 'recordCameraAttendance',
  })
  recordCameraAttendance(
    @CurrentSession() session: SessionData,
    @Body() dto: RecordCameraAttendanceDto,
  ): Promise<SessionAttendanceResponseDto> {
    return this.captureService.recordCameraAttendance(this.actor(session), dto);
  }

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

  @Get('sessions')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'List attendance sessions visible to the operator',
    operationId: 'listAttendanceSessions',
  })
  listSessions(
    @CurrentSession() session: SessionData,
    @Query() filters: AttendanceSessionFiltersDto,
  ): Promise<AttendanceSessionListResponseDto> {
    return this.sessionService.listSessions(this.actor(session), filters);
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

  @Patch('sessions/:sessionId')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Correct an attendance session',
    operationId: 'updateAttendanceSession',
  })
  updateSession(
    @CurrentSession() session: SessionData,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: UpdateAttendanceSessionDto,
  ): Promise<AttendanceSessionResponseDto> {
    return this.sessionService.updateSession(
      this.actor(session),
      sessionId,
      dto,
    );
  }

  @Delete('sessions/:sessionId')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Delete an attendance session and its records',
    operationId: 'deleteAttendanceSession',
  })
  deleteSession(
    @CurrentSession() session: SessionData,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<DeleteAttendanceSessionResponseDto> {
    return this.sessionService.deleteSession(this.actor(session), sessionId);
  }

  @Post('sessions/:sessionId/records')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Record one identified attendee',
    operationId: 'recordIdentifiedAttendance',
  })
  recordIdentifiedAttendance(
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
    summary: 'Replace the aggregate attendance count',
    operationId: 'setAttendanceCount',
  })
  setAttendanceCount(
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
  }

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
  }

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
  }

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
  }

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
  }

  private actor(session: SessionData) {
    return {
      userId: session.user.id,
      uniRole: session.uniRole,
      uniId: session.uniId,
    };
  }
}
