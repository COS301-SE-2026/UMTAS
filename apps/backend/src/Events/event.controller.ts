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
import {
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  CreateEventDto,
  EventSingleResponseDto,
  EventListResponseDto,
  UpdateEventDto,
  DeleteResponseDto,
  EventFiltersDto,
  CreateEventDtoV2,
  ValidateEventResponseDto,
  ValidateEventDto,
  UpdateEventVenueDto,
} from './dto/EventDto.dto';

import { EventService } from './event.service';
import type { SessionData } from '../auth/session.decorator';
import { CurrentSession } from '../auth/session.decorator';
import { Roles } from '../auth/roles.guard';
import { EventServiceV2 } from './eventV2.service';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(
    private readonly service: EventService,
    private readonly service2: EventServiceV2,
  ) {}

  @Post('v2')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Create an event - V2',
    operationId: 'createEventV2',
  })
  @ApiBody({ type: CreateEventDtoV2 })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: EventSingleResponseDto,
  })
  createEvent2(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateEventDtoV2,
  ) {
    //make activityType and activityCode very optional
    //isrecurring default to false - just need date
    //validated - dfault false - need a validate event endpoint!!!!!!!!!
    //
    return this.service2.createV2(dto, session.user.id, session.uniId);
  }

  @Post()
  @Roles()
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
  @Roles()
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
      timetableId: filters.timetableId,
      all: filters.all,
    });
  } //getAllEvents

  //get by id
  @Get(':eventId')
  @Roles()
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
  @Roles()
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
  @Roles()
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

  @Patch('validate/:id')
  @Roles()
  @ApiOperation({
    summary: 'Validate an event',
    operationId: 'validateEvent',
  })
  @ApiBody({ type: ValidateEventDto })
  @ApiResponse({
    status: 200,
    description: 'Event[${updated.eventName}] validated=[${updated.validated}]',
    type: ValidateEventResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  validateEvent(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: ValidateEventDto,
  ): Promise<ValidateEventResponseDto> {
    return this.service2.validateEvent(eventId, dto.validated);
  }

  @Patch(':id/venue')
  @Roles('student', 'uni_admin', 'lecturer')
  @ApiOperation({
    summary: "Attach or clear an event's venue",
    operationId: 'updateEventVenue',
  })
  @ApiBody({ type: UpdateEventVenueDto })
  @ApiResponse({
    status: 200,
    description: 'Venue updated successfully',
    type: EventSingleResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Event not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  updateEventVenue(
    @CurrentSession() session: SessionData,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() updateEventVenueDto: UpdateEventVenueDto,
  ): Promise<EventSingleResponseDto> {
    return this.service.updateEventVenue(session, eventId, updateEventVenueDto);
  }
} //EventController
