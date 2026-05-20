import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  CreateTimetableDto,
  UpdateTimetableDto,
  TimetableResponseDto,
  TimetableListResponseDto,
  DeleteTimetableResponseDto,
} from './dto/timetable.dto';

import { TimetableService } from './timetable.service';
import { Roles } from '../auth/roles.guard';
import { CurrentSession } from '../auth/session.decorator';
import type { SessionData } from '../auth/session.decorator';

@ApiTags('Timetables')
@Controller('timetables')
export class TimetableController {
  constructor(private readonly service: TimetableService) {}

  @Post()
  @Roles('student')
  @ApiOperation({
    summary: 'Create a timetable',
    operationId: 'createTimetable',
  })
  @ApiBody({ type: CreateTimetableDto })
  @ApiResponse({
    status: 201,
    description: 'Timetable created successfully',
    type: TimetableResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid request payload',
  })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 500, description: 'Timetable was not created' })
  createTimetable(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateTimetableDto,
  ): Promise<TimetableResponseDto> {
    return this.service.createTimetable(session.user.id, dto);
  } //createTimetable

  @Get()
  @Roles('student')
  @ApiOperation({
    summary: 'Get all timetables',
    operationId: 'getAllTimetables',
  })
  @ApiResponse({
    status: 200,
    description: 'Timetables fetched successfully',
    type: TimetableListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  getAllTimetables(
    @CurrentSession() session: SessionData,
  ): Promise<TimetableListResponseDto> {
    return this.service.getAllTimetables(session.user.id);
  } //getAllTimetables

  @Get(':id')
  @Roles('student')
  @ApiOperation({
    summary: 'Get timetable by ID',
    operationId: 'getTimetableById',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Timetable ID' })
  @ApiResponse({
    status: 200,
    description: 'Timetable fetched successfully',
    type: TimetableResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Timetable not found' })
  getTimetableById(
    @CurrentSession() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TimetableResponseDto> {
    return this.service.getTimetableById(session.user.id, id);
  } //getTimetableById

  @Patch(':id')
  @Roles('student')
  @ApiOperation({
    summary: 'Update a timetable',
    operationId: 'updateTimetable',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Timetable ID' })
  @ApiBody({ type: UpdateTimetableDto })
  @ApiResponse({
    status: 200,
    description: 'Timetable updated successfully',
    type: TimetableResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid update payload',
  })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Timetable not found' })
  @ApiResponse({ status: 500, description: 'Timetable was not updated' })
  updateTimetable(
    @CurrentSession() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTimetableDto,
  ): Promise<TimetableResponseDto> {
    return this.service.updateTimetable(session.user.id, id, dto);
  } //updateTimetable

  @Delete(':id')
  @Roles('student')
  @ApiOperation({
    summary: 'Delete a timetable',
    operationId: 'deleteTimetable',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Timetable ID' })
  @ApiResponse({
    status: 200,
    description: 'Timetable deleted successfully',
    type: DeleteTimetableResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No active session' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Timetable not found' })
  @ApiResponse({ status: 500, description: 'Timetable was not deleted' })
  deleteTimetable(
    @CurrentSession() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteTimetableResponseDto> {
    return this.service.deleteTimetable(session.user.id, id);
  } //deleteTimetable
} //TimetableController
