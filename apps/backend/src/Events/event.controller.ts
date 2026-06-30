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
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  CreateEventDto,
  EventSingleResponseDto,
  EventListResponseDto,
  UpdateEventDto,
  DeleteResponseDto,
  EventFiltersDto,
} from './dto/EventDto.dto';

import { EventService } from './event.service';
import { Roles } from '../auth/roles.guard';
import type { SessionData } from '../auth/session.decorator';
import { CurrentSession } from '../auth/session.decorator';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly service: EventService) {}

  @Post()
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Create an event',
    operationId: 'createEvent',
  })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: EventSingleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid event payload',
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
    status: 500,
    description: 'Event was not created',
  })
  createEvent(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateEventDto,
  ): Promise<EventSingleResponseDto> {
    return this.service.create(session.user.id, dto);
  }

  //get All
  @Get()
  @Roles('student')
  @ApiOperation({
    summary: 'Get all events',
    operationId: 'getAllEvents',
  })
  @ApiResponse({
    status: 200,
    description: 'Events fetched successfully',
    type: EventListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No active session',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  getAllEvents(
    @CurrentSession() session: SessionData,
    @Query() filters: EventFiltersDto,
  ): Promise<EventListResponseDto> {
    return this.service.getAllEvents(session.user.id, {
      moduleId: filters.moduleId,
    });
  } //getAllEvents

  //get by id
  @Get(':eventId')
  @Roles('student')
  @ApiOperation({
    summary: 'Get event by ID',
    operationId: 'getEventById',
  })
  @ApiResponse({
    status: 200,
    description: 'Event fetched successfully',
    type: EventSingleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  getById(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<EventSingleResponseDto> {
    return this.service.getById(eventId);
  } //get by id

  //update
  @Patch(':id')
  @Roles('student')
  @ApiOperation({
    summary: 'Update an event',
    operationId: 'updateEvent',
  })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    type: EventSingleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid update payload',
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
    description: 'Event or referenced module not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Event was not updated',
  })
  updateEvent(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: UpdateEventDto,
  ): Promise<EventSingleResponseDto> {
    return this.service.updateEvent(
      session.user.id,
      session.user.role,
      eventId,
      dto,
    );
  }

  //delete
  @Delete(':id')
  @Roles('student')
  @ApiOperation({
    summary: 'Delete an event',
    operationId: 'deleteEvent',
  })
  @ApiResponse({
    status: 200,
    description: 'Event deleted successfully',
    type: DeleteResponseDto,
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
    description: 'Event not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Event was not deleted',
  })
  deleteEvent(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) eventId: string,
  ): Promise<DeleteResponseDto> {
    return this.service.deleteEvent(
      session.user.id,
      session.user.role,
      eventId,
    );
  }
} //EventController
