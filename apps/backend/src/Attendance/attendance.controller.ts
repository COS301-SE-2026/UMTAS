import {
  Param,
  Body,
  Controller,
  Post,
  Get,
  Patch,
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

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

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
  @Roles('student')
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
  @Roles('student')
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
} //END_AttendanceController
