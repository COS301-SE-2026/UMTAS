import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { eq, getTableColumns, inArray } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';
import {
  Event,
  UniversityEvent,
  PersonalEvent,
  modules,
  ModuleEnrollment,
  Venue,
  EventVenue,
} from '../entities/index';
import {
  CreateEventDto,
  EventSingleResponseDto,
  EventFiltersDto,
  EventListResponseDto,
  UpdateEventDto,
  DeleteResponseDto,
  EventDto,
  UpdateEventCriteriaDto,
} from './dto/EventDto.dto';

import { AppDatabase } from '../db/database.service';
import { ModuleService } from '../Module/module.service';
import { EventImportFingerprintService } from './event-import-fingerprint.service';
import { EventCriteria } from './dto/event.types';

@Injectable()
export class EventService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly moduleService: ModuleService,
    private readonly eventImportFingerprintService: EventImportFingerprintService,
  ) {}

  //Create
  async create(
    userId: string,
    dto: CreateEventDto,
  ): Promise<EventSingleResponseDto> {
    const moduleId = dto.eventCriteria.moduleId;

    //Create Event
    let event: EventDto;
    if (moduleId) event = await this.createUniversityEvent(moduleId, dto);
    else event = await this.createPersonalEvent(userId, dto);

    return { event };
  } //END_Create

  //getAllEvents
  async getAllEvents(
    userId: string,
    filters: EventFiltersDto,
  ): Promise<EventListResponseDto> {
    //moduleId -> Return events for that module
    //Else -> Return events for modules that user is enrolled in

    let events: EventDto[];

    if (filters.moduleId)
      // Events for a module
      events = await this.getEventsByModule(filters.moduleId); //No moduleId provided, filter only by user
    else events = await this.getEventsByUser(userId);

    return { events };
  } //getAllEvents

  //getById - Shouldn't be changing again
  async getById(eventId: string): Promise<EventSingleResponseDto> {
    const [event] = await this.dbService.db
      .select()
      .from(Event)
      .where(eq(Event.eventID, eventId))
      .limit(1);

    if (!event)
      throw new InternalServerErrorException(`Event[${eventId}] not found`);

    return { event: await this.mapEventToDto(event) };
  } //getById

  async updateEvent(
    userId: string,
    role: string,
    eventId: string,
    dto: UpdateEventDto,
  ): Promise<EventSingleResponseDto> {
    //Check that at least one field is provided
    const critUpdate =
      dto.eventCriteria && Object.keys(dto.eventCriteria).length > 0;
    const recUpdate = dto.isRecurring !== undefined;
    const nameUpdate = dto.eventName !== undefined;
    const codeUpdate = dto.activityCode !== undefined;
    const activityTypeUpdate = dto.activityType !== undefined;
    const validatedUpdate = dto.validated !== undefined;

    if (
      !critUpdate &&
      !recUpdate &&
      !nameUpdate &&
      !codeUpdate &&
      !activityTypeUpdate &&
      !validatedUpdate
    )
      throw new BadRequestException('At least one update field required');
    //END_field presence check

    //Ownership check
    //Student can update event if its created from a module that is STUDENT_OWNED
    //If module isn't STUDENT_OWNED user needs to be admin/lecturer
    if (role === 'student' && !(await this.ownershipCheck(userId, eventId)))
      throw new ForbiddenException(
        `User[${userId}][${role}] cannot update event they don't own`,
      );
    //If not a student, no ownership check necessary

    const updatedEvent = await this.dbService.db.transaction(
      async (tx: AppDatabase) => {
        //Check that event exists
        const existingEvent = (await this.getById(eventId)).event;

        if (!existingEvent)
          throw new NotFoundException(
            `Event not found for eventId: ${eventId}`,
          );

        const mergedCriteria = this.mergeEventCriteria(
          existingEvent.eventCriteria,
          dto.eventCriteria,
        );
        const nextEventName = dto.eventName?.trim() ?? existingEvent.eventName;
        const nextActivityCode =
          dto.activityCode?.trim() ?? existingEvent.activityCode;
        const nextIsRecurring =
          dto.isRecurring ?? existingEvent.isRecurring ?? false;
        const nextValidated = dto.validated ?? existingEvent.validated;
        const nextActivityType = dto.activityType ?? existingEvent.activityType;
        this.assertTimingMatchesRecurrence(mergedCriteria, nextIsRecurring);
        const nextImportFingerprint =
          this.eventImportFingerprintService.buildForEvent({
            activityType: nextActivityType,
            activityCode: nextActivityCode,
            eventCriteria: mergedCriteria,
          });

        //Update actual event entity
        const [event] = await tx
          .update(Event)
          .set({
            eventName: nextEventName,
            activityCode: nextActivityCode,
            activityType: nextActivityType,
            eventCriteria: mergedCriteria,
            isRecurring: nextIsRecurring,
            validated: nextValidated,
            importFingerprint: nextImportFingerprint,
          })
          .where(eq(Event.eventID, eventId))
          .returning();

        if (dto.eventCriteria?.moduleId) {
          await tx
            .update(UniversityEvent)
            .set({
              moduleID: dto.eventCriteria.moduleId,
            })
            .where(eq(UniversityEvent.eventID, eventId));
        }

        if (!event)
          throw new InternalServerErrorException(
            `Event[${eventId}] not updated`,
          );

        return event;
      }, //END_transaction
    );

    return { event: await this.mapEventToDto(updatedEvent) };
  } //update

  //Delete event
  async deleteEvent(
    userId: string,
    role: string,
    eventId: string,
  ): Promise<DeleteResponseDto> {
    //Ownership check
    if (role === 'student' && !(await this.ownershipCheck(userId, eventId)))
      throw new ForbiddenException(
        `User[${userId}][${role}] cannot update event they don't own`,
      );

    //fetch event
    const existingEvent = await this.getById(eventId);

    if (!existingEvent)
      throw new NotFoundException(`Event [${eventId}] doesn't exist`);

    await this.dbService.db.delete(Event).where(eq(Event.eventID, eventId));

    return {
      eventName: existingEvent.event.eventName,
      activityCode: existingEvent.event.activityCode,
      success: true,
    };
  } //delete

  //Attendance methods

  //Create attendance

  //END_Attendance methods

  //=======================================================
  //🎅's Little Helpers

  //Create Personal Event helper
  async createPersonalEvent(
    userId: string,
    dto: CreateEventDto,
  ): Promise<EventDto> {
    //Create Personal Event
    //Create Event entity
    //-> Create PersonalEvent join table entity
    //Currently no venue

    //Create Event
    const event = await this.createEvent(dto, userId);

    await this.replaceEventVenues(event.eventId, dto.venues);

    //Create PersonalEvent table entry
    const [persEvent] = await this.dbService.db
      .insert(PersonalEvent)
      .values({
        UserID: userId,
        eventID: event.eventId,
      })
      .returning();

    if (!persEvent)
      throw new InternalServerErrorException(
        `Failed to create personalEvent relationship for User[${userId}] | Event[${event.eventId}]`,
      );

    return event;
  } //END_createPersonalEvent

  //Create University Owned Event helper
  async createUniversityEvent(
    moduleId: string,
    dto: CreateEventDto,
  ): Promise<EventDto> {
    //Create University event
    //Create Event entity
    //-> Create UniversityEvent JOin table entity
    //-> If venue present -> Create venue entity and link through EventVenue

    const event = await this.createEvent(dto);

    await this.replaceEventVenues(event.eventId, dto.venues);

    //-> Create UniversityEvent JOin table entity
    const [uniEvent] = await this.dbService.db
      .insert(UniversityEvent)
      .values({
        moduleID: moduleId,
        eventID: event.eventId,
      })
      .returning();

    if (!uniEvent)
      throw new InternalServerErrorException(
        `Failed to create University event for module[${moduleId}] | event[${event.eventId}]`,
      );

    return event;
  } //END_createUniversityEvent

  //Create simple event entity
  private async createEvent(
    dto: CreateEventDto,
    userId?: string,
  ): Promise<EventDto> {
    //Define fields
    const eventCriteria = dto.eventCriteria;

    let eventName: string;
    let activityCode: string;
    let isRec: boolean;

    if (userId) {
      //Implies personal event fields are being created

      eventName = dto.eventName ?? `Event_${userId.slice(0, 20)}`;
      activityCode = dto.activityCode ?? `Pers_Event`;
      isRec = dto.isRecurring ?? false; //Personal events might not recur
    } else {
      //Create University event fields

      eventName = dto.eventName ?? `Event_For_Uni}`;
      activityCode = dto.activityCode ?? `Uni_Event`;
      isRec = dto.isRecurring ?? true; //University events usually recur
    } //END_if-else

    this.assertTimingMatchesRecurrence(eventCriteria, isRec);

    const [event] = await this.dbService.db
      .insert(Event)
      .values({
        eventName: eventName,
        activityCode,
        activityType: dto.activityType ?? null,
        eventCriteria: eventCriteria,
        isRecurring: isRec,
        validated: dto.validated ?? true,
        importFingerprint: this.eventImportFingerprintService.buildForEvent({
          activityType: dto.activityType,
          activityCode,
          eventCriteria: eventCriteria,
        }),
      })
      .returning();

    if (!event)
      throw new InternalServerErrorException(
        `Failed to create event Name[${eventName}] | Code[${activityCode}]`,
      );

    return this.mapEventToDto(event);
  } //END_createEvent

  //Get event for module
  private async getEventsByModule(moduleId: string): Promise<EventDto[]> {
    const events = await this.dbService.db
      .select(getTableColumns(Event))
      .from(Event)
      .innerJoin(UniversityEvent, eq(UniversityEvent.eventID, Event.eventID))
      .where(eq(UniversityEvent.moduleID, moduleId));

    return Promise.all(events.map((event) => this.mapEventToDto(event)));
  } //END_getEventsByModule

  //Get events for modules user is enrolled in
  private async getEventsByUser(userId: string): Promise<EventDto[]> {
    const events = await this.dbService.db
      .select(getTableColumns(Event))
      .from(Event)
      .innerJoin(UniversityEvent, eq(UniversityEvent.eventID, Event.eventID))
      .innerJoin(
        ModuleEnrollment,
        eq(ModuleEnrollment.ModuleID, UniversityEvent.moduleID),
      )
      .where(eq(ModuleEnrollment.UserID, userId));

    return Promise.all(events.map((event) => this.mapEventToDto(event)));
  } //END_getEventsByUser

  //Check if user owns event through module
  private async ownershipCheck(
    userId: string,
    eventId: string,
  ): Promise<boolean> {
    //Get module from which event is created
    const [module] = await this.dbService.db
      .select({
        moduleId: modules.moduleID,
      })
      .from(modules)
      .innerJoin(
        UniversityEvent,
        eq(UniversityEvent.moduleID, modules.moduleID),
      )
      .where(eq(UniversityEvent.eventID, eventId))
      .limit(1);

    //Do ownership check on module
    return await this.moduleService.moduleOwnershipCheck(
      userId,
      module.moduleId,
    );
  } //END_ownershipCheck

  //Map an event to the DTO - idk why this is even necessary but I kept getting type errors when returning an event which is literally fetched straight from the database
  private async mapEventToDto(
    event: typeof Event.$inferSelect,
  ): Promise<EventDto> {
    const venues = await this.getEventVenues(event.eventID);
    return {
      eventId: event.eventID,
      eventName: event.eventName,
      activityCode: event.activityCode ?? undefined,
      activityType: event.activityType as EventDto['activityType'],
      eventCriteria: event.eventCriteria,
      isRecurring: event.isRecurring,
      validated: event.validated,
      venues,
    };
  } //END_mapEventToDto

  private async getEventVenues(eventId: string): Promise<EventDto['venues']> {
    const rows = await this.dbService.db
      .select({ venueId: Venue.VenueID, venueName: Venue.VenueName })
      .from(EventVenue)
      .innerJoin(Venue, eq(EventVenue.VenueID, Venue.VenueID))
      .where(eq(EventVenue.EventID, eventId));
    return rows.map((row) => ({
      venueId: row.venueId,
      venueName: row.venueName ?? '',
    }));
  }

  private async replaceEventVenues(
    eventId: string,
    venues: EventDto['venues'],
  ): Promise<void> {
    if (venues === undefined) return;
    const venueIds = [...new Set(venues.map(({ venueId }) => venueId))];
    if (venueIds.length !== venues.length) {
      throw new BadRequestException('Event venues must not contain duplicates');
    }
    if (venueIds.length === 0) return;

    const existing = await this.dbService.db
      .select({ venueId: Venue.VenueID })
      .from(Venue)
      .where(inArray(Venue.VenueID, venueIds));
    if (existing.length !== venueIds.length) {
      throw new BadRequestException('One or more venueIds do not exist');
    }

    await this.dbService.db
      .insert(EventVenue)
      .values(
        venueIds.map((venueId) => ({ EventID: eventId, VenueID: venueId })),
      )
      .onConflictDoNothing({
        target: [EventVenue.EventID, EventVenue.VenueID],
      });
  }

  private mergeEventCriteria(
    existingCriteria: EventCriteria,
    updateCriteria?: UpdateEventCriteriaDto,
  ): EventCriteria {
    if (!updateCriteria) {
      return existingCriteria;
    }

    const mergedCriteria: EventCriteria = {
      eventSource: updateCriteria.eventSource ?? existingCriteria.eventSource,
      date: updateCriteria.date ?? existingCriteria.date,
      startTime: updateCriteria.startTime ?? existingCriteria.startTime,
      endTime: updateCriteria.endTime ?? existingCriteria.endTime,
    };

    if (updateCriteria.moduleId !== undefined)
      mergedCriteria.moduleId = updateCriteria.moduleId;
    else if (existingCriteria.moduleId !== undefined)
      mergedCriteria.moduleId = existingCriteria.moduleId;
    if (updateCriteria.dayOfWeek !== undefined) {
      mergedCriteria.dayOfWeek = updateCriteria.dayOfWeek;
      delete mergedCriteria.date;
    }
    if (updateCriteria.date !== undefined) {
      mergedCriteria.date = updateCriteria.date;
      delete mergedCriteria.dayOfWeek;
    }

    return mergedCriteria;
  } //END_mergeEventCriteria

  private assertTimingMatchesRecurrence(
    criteria: EventCriteria,
    isRecurring: boolean,
  ): void {
    if (isRecurring && (criteria.date !== undefined || !criteria.dayOfWeek)) {
      throw new BadRequestException(
        'Recurring events require dayOfWeek and must not include date',
      );
    }
    if (!isRecurring && (criteria.dayOfWeek !== undefined || !criteria.date)) {
      throw new BadRequestException(
        'Non-recurring events require date and must not include dayOfWeek',
      );
    }
  }
} //EventService
