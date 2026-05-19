import {
  Param,
  Body,
  Controller,
  Post,
  Get,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  CreateEventDto,
  EventResponseDto,
  EventListResponseDto,
  UpdateEventDto,
} from './dto/EventDto.dto';

import { EventService } from './event.service';
import { Roles } from 'src/auth/roles.guard';
import type { SessionData } from '../auth/session.decorator';
import { CurrentSession } from '../auth/session.decorator';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly service: EventService) {}

  @Post()
  @Roles('student')
  @ApiOperation({
    summary: 'Create an event',
    operationId: 'createEvent',
  })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: EventResponseDto,
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
  ) {
    return this.service.createEvent(session.user.id, dto);
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
  getAllEvents(@CurrentSession() session: SessionData) {
    return this.service.getAllEvents(session.user.id);
  } //getAllEvents

  //get by id
  @Get(':id')
  @Roles('student')
  @ApiOperation({
    summary: 'Get event by ID',
    operationId: 'getEventById',
  })
  @ApiResponse({
    status: 200,
    description: 'Event fetched successfully',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  getById(
    @CurrentSession() session: SessionData,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getById(session.user.id, id);
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
    type: EventResponseDto,
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
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
  ) {
    return this.service.updateEvent(session.user.id, id, dto);
  }
} //EventController
