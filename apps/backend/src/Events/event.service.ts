import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, getTableColumns, ilike, inArray } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';
import {
  Event,
  UniversityEvent,
  PersonalEvent,
  modules,
  ModuleEnrollment,
  Venue,
  EventVenue,
  Course,
  GroupModules,
  parseJob,
  usersTable,
  UniversityRole,
  University,
  EventsToTimetables,
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
  UpdateEventVenueDto,
} from './dto/EventDto.dto';

import { AppDatabase } from '../db/database.service';
import { ModuleService } from '../Module/module.service';
import { EventImportFingerprintService } from './event-import-fingerprint.service';
import { EventCriteria } from './dto/event.types';
import { UniversityService } from '../University/university.service';
import { SessionData } from 'src/auth/session.decorator';

@Injectable()
export class EventService {
  constructor(
    protected readonly dbService: DatabaseService,
    protected readonly eventImportFingerprintService: EventImportFingerprintService,
    protected readonly uniService: UniversityService,
    @Inject(forwardRef(() => ModuleService))
    protected readonly moduleService: ModuleService,
  ) {}

  //Create
  async create(
    userId: string,
    dto: CreateEventDto,
    tx?: AppDatabase,
  ): Promise<EventSingleResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.create(userId, dto, t);
      }); //END_transaction
    } //END_transaction precencer check

    const moduleId = dto.eventCriteria.moduleId;

    //Create Event
    let event: EventDto;
    if (moduleId)
      event = await this.createUniversityEvent(userId, moduleId, dto, tx);
    else event = await this.createPersonalEvent(userId, dto, tx);

    return { event };
  } //END_Create

  //getAllEvents
  async getAllEvents(
    userId: string,
    filters: EventFiltersDto,
    tx?: AppDatabase,
  ): Promise<EventListResponseDto> {
    //moduleId -> Return events for that module
    //Else -> Return events for modules that user is enrolled in

    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.getAllEvents(userId, filters, t);
      }); //END_transaction
    } //END_transaction precencer check

    let events: EventDto[];
    // console.log(`Here: ${filters.all}`);
    if (filters.moduleId)
      // Events for a module
      events = await this.getEventsByModule(filters.moduleId, tx); //No moduleId provided, filter only by user
    else if (filters.timetableId)
      events = await this.getEventsByTimetable(filters.timetableId, tx);
    else if (filters.all) {
      const pureEvents = await tx.select().from(Event);
      // console.log(`Here: ${JSON.stringify(pureEvents)}`);
      events = await Promise.all(
        pureEvents.map((event) => this.mapEventToDto(event)),
      );
    } else events = await this.getEventsByUser(userId, tx);

    return { events };
  } //getAllEvents

  //getById - Shouldn't be changing again
  async getById(
    eventId: string,
    tx?: AppDatabase,
  ): Promise<EventSingleResponseDto> {
    const db = tx ?? this.dbService.db;

    const [event] = await db
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
    tx?: AppDatabase,
  ): Promise<EventSingleResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.updateEvent(userId, role, eventId, dto, t);
      }); //END_transaction
    } //END_transaction precencer check

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
    if (role === 'student' && !(await this.ownershipCheck(userId, eventId, tx)))
      throw new ForbiddenException(
        `User[${userId}][${role}] cannot update event they don't own`,
      );
    //If not a student, no ownership check necessary

    //Check that event exists
    const existingEvent = (await this.getById(eventId)).event;

    if (!existingEvent)
      throw new NotFoundException(`Event not found for eventId: ${eventId}`);

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
      throw new InternalServerErrorException(`Event[${eventId}] not updated`);

    return { event: await this.mapEventToDto(event) };
  } //update

  //Delete event
  async deleteEvent(
    userId: string,
    role: string,
    eventId: string,
    tx?: AppDatabase,
  ): Promise<DeleteResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.deleteEvent(userId, role, eventId, t);
      }); //END_transaction
    } //END_transaction precencer check

    //Ownership check
    if (role === 'student' && !(await this.ownershipCheck(userId, eventId, tx)))
      throw new ForbiddenException(
        `User[${userId}][${role}] cannot update event they don't own`,
      );

    //fetch event
    const existingEvent = await this.getById(eventId, tx);

    if (!existingEvent)
      throw new NotFoundException(`Event [${eventId}] doesn't exist`);

    await tx.delete(Event).where(eq(Event.eventID, eventId));

    return {
      eventName: existingEvent.event.eventName,
      activityCode: existingEvent.event.activityCode,
      success: true,
    };
  } //delete

  //=======================================================
  //🎅's Little Helpers

  //Create Personal Event helper
  async createPersonalEvent(
    userId: string,
    dto: CreateEventDto,
    tx?: AppDatabase,
  ): Promise<EventDto> {
    //Create Personal Event
    //Create Event entity
    //-> Create PersonalEvent join table entity
    //Currently no venue
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.createPersonalEvent(userId, dto, t);
      }); //END_transaction
    } //END_transaction precencer check

    const venueIds = await this.validateVenueIds(tx, dto.venues);
    const event = await this.createEvent(tx, dto, userId);
    const [persEvent] = await tx
      .insert(PersonalEvent)
      .values({ UserID: userId, eventID: event.eventID })
      .returning();

    if (!persEvent)
      throw new InternalServerErrorException(
        `Failed to create personalEvent relationship for User[${userId}] | Event[${event.eventID}]`,
      );

    await this.insertEventVenues(tx, event.eventID, venueIds);
    return this.mapEventToDto(event, tx);
  } //END_createPersonalEvent

  //Create University Owned Event helper
  async createUniversityEvent(
    userId: string,
    moduleId: string,
    dto: CreateEventDto,
    tx?: AppDatabase,
  ): Promise<EventDto> {
    //Create University event
    //Create Event entity
    //-> Create UniversityEvent JOin table entity
    //-> If venue present -> Create venue entity and link through EventVenue
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.createUniversityEvent(userId, moduleId, dto, t);
      }); //END_transaction
    } //END_transaction precencer check

    if (dto.activityType === undefined) {
      throw new BadRequestException(
        'activityType is required for university events',
      );
    }

    const moduleUniversityIds = await this.getModuleUniversityIds(tx, moduleId);
    if (moduleUniversityIds.length === 0) {
      throw new BadRequestException(
        `Module[${moduleId}] does not belong to a university`,
      );
    }

    const universityId = await this.resolveAuthorizedModuleUniversity(
      tx,
      userId,
      moduleId,
      moduleUniversityIds,
      dto.venues,
    );

    const venueIds = await this.validateVenueIds(tx, dto.venues, universityId);
    const event = await this.createEvent(tx, dto);
    const [uniEvent] = await tx
      .insert(UniversityEvent)
      .values({ moduleID: moduleId, eventID: event.eventID })
      .returning();

    if (!uniEvent)
      throw new InternalServerErrorException(
        `Failed to create University event for module[${moduleId}] | event[${event.eventID}]`,
      );

    await this.insertEventVenues(tx, event.eventID, venueIds);
    return this.mapEventToDto(event, tx);
  } //END_createUniversityEvent

  private async getModuleUniversityIds(
    db: AppDatabase,
    moduleId: string,
  ): Promise<string[]> {
    const courseLinks = await db
      .select({ universityId: Course.UniversityID })
      .from(GroupModules)
      .innerJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
      .where(eq(GroupModules.ModuleID, moduleId));
    const parserLinks = await db
      .select({ universityId: parseJob.UniversityID })
      .from(GroupModules)
      .innerJoin(parseJob, eq(parseJob.GroupID, GroupModules.GroupID))
      .where(eq(GroupModules.ModuleID, moduleId));

    return Array.from(
      new Set(
        [...courseLinks, ...parserLinks].map(
          ({ universityId }) => universityId,
        ),
      ),
    ).sort();
  }

  private async resolveAuthorizedModuleUniversity(
    db: AppDatabase,
    userId: string,
    moduleId: string,
    moduleUniversityIds: string[],
    venues: EventDto['venues'],
  ): Promise<string> {
    // console.log(`resolveAuthorizedModuleUniversity: userId[${userId}] | moduleId[${moduleId}] | moduleUniversityIds[${moduleUniversityIds}] | venues[${JSON.stringify(venues)}]`);
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    const [enrollment] = await db
      .select({ moduleId: ModuleEnrollment.ModuleID })
      .from(ModuleEnrollment)
      .where(
        and(
          eq(ModuleEnrollment.UserID, userId),
          eq(ModuleEnrollment.ModuleID, moduleId),
        ),
      )
      .limit(1);
    const ownedParserLinks = await db
      .select({ universityId: parseJob.UniversityID })
      .from(GroupModules)
      .innerJoin(parseJob, eq(parseJob.GroupID, GroupModules.GroupID))
      .where(
        and(eq(GroupModules.ModuleID, moduleId), eq(parseJob.UserID, userId)),
      );
    const universityRoles = await db
      .select({
        universityId: UniversityRole.UniversityID,
        role: UniversityRole.role,
      })
      .from(UniversityRole)
      .where(
        and(
          eq(UniversityRole.UserID, userId),
          inArray(UniversityRole.UniversityID, moduleUniversityIds),
        ),
      );
    const [personalUni] = await db
      .select({
        uniName: University.UniversityName,
      })
      .from(University)
      .where(
        and(
          inArray(University.UniversityID, moduleUniversityIds),
          ilike(University.UniversityName, `%user%`),
        ),
      )
      .limit(1);

    const roleAuthorizedUniversityIds = universityRoles
      .filter(
        ({ role }) =>
          (user?.role === 'uni_admin' && role === 'UNIVERSITY_ADMIN') ||
          (user?.role === 'student' && role === 'STUDENT_OWNED'),
      )
      .map(({ universityId }) => universityId);

    const authorizedUniversityIds =
      user?.role === 'sys_admin' || personalUni
        ? moduleUniversityIds
        : Array.from(
            new Set([
              ...(user?.role === 'student' && enrollment
                ? moduleUniversityIds
                : []),
              ...(user?.role === 'student'
                ? ownedParserLinks.map(({ universityId }) => universityId)
                : []),
              ...roleAuthorizedUniversityIds,
            ]),
          ).sort();
    if (authorizedUniversityIds.length === 0) {
      // console.log(`ThrowPart: ${JSON.stringify(authorizedUniversityIds)}`);///removeeeeeeeeeeeeeeeeeee
      throw new ForbiddenException(
        `User[${userId}] cannot create university events for this module`,
      );
    }

    if (venues && venues.length > 0) {
      const venueIds = Array.from(
        new Set(venues.map(({ venueId }) => venueId)),
      );
      const venueUniversities = await db
        .select({ universityId: Venue.UniversityID })
        .from(Venue)
        .where(inArray(Venue.VenueID, venueIds));
      const requestedUniversityIds = Array.from(
        new Set(venueUniversities.map(({ universityId }) => universityId)),
      );
      if (
        requestedUniversityIds.length === 1 &&
        authorizedUniversityIds.includes(requestedUniversityIds[0])
      ) {
        return requestedUniversityIds[0];
      }
    }

    return authorizedUniversityIds[0];
  }

  //Create simple event entity
  private async createEvent(
    db: AppDatabase,
    dto: CreateEventDto,
    userId?: string,
  ): Promise<typeof Event.$inferSelect> {
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

    const [event] = await db
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

    return event;
  } //END_createEvent

  //Get event for module
  private async getEventsByModule(
    moduleId: string,
    tx?: AppDatabase,
  ): Promise<EventDto[]> {
    const db = tx ?? this.dbService.db;

    const events = await db
      .select(getTableColumns(Event))
      .from(Event)
      .innerJoin(UniversityEvent, eq(UniversityEvent.eventID, Event.eventID))
      .where(eq(UniversityEvent.moduleID, moduleId));

    return Promise.all(events.map((event) => this.mapEventToDto(event)));
  } //END_getEventsByModule

  //Get events by timetable
  private async getEventsByTimetable(
    timetableId: string,
    tx?: AppDatabase,
  ): Promise<EventDto[]> {
    const db = tx ?? this.dbService.db;

    const events = await db
      .select(getTableColumns(Event))
      .from(Event)
      .innerJoin(
        EventsToTimetables,
        eq(EventsToTimetables.eventID, Event.eventID),
      )
      .where(eq(EventsToTimetables.timetableID, timetableId));

    return Promise.all(events.map((event) => this.mapEventToDto(event)));
  }

  //Get events for modules user is enrolled in
  private async getEventsByUser(
    userId: string,
    tx?: AppDatabase,
  ): Promise<EventDto[]> {
    const db = tx ?? this.dbService.db;

    const events = await db
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
    tx?: AppDatabase,
  ): Promise<boolean> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.ownershipCheck(userId, eventId, t);
      }); //END_transaction
    } //END_transaction precencer check

    //Get module from which event is created
    const [module] = await tx
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
      tx,
    );
  } //END_ownershipCheck

  //Map an event to the DTO - idk why this is even necessary but I kept getting type errors when returning an event which is literally fetched straight from the database
  protected async mapEventToDto(
    event: typeof Event.$inferSelect,
    db: AppDatabase = this.dbService.db,
  ): Promise<EventDto> {
    const venues = await this.getEventVenues(event.eventID, db);
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

  private async getEventVenues(
    eventId: string,
    db: AppDatabase = this.dbService.db,
  ): Promise<EventDto['venues']> {
    const rows = await db
      .select({ venueId: Venue.VenueID, venueName: Venue.VenueName })
      .from(EventVenue)
      .innerJoin(Venue, eq(EventVenue.VenueID, Venue.VenueID))
      .where(eq(EventVenue.EventID, eventId));
    return rows.map((row) => ({
      venueId: row.venueId,
      venueName: row.venueName ?? '',
    }));
  }

  protected async insertEventVenues(
    db: AppDatabase,
    eventId: string,
    venueIds: string[],
  ): Promise<void> {
    if (venueIds.length === 0) return;
    await db
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

  /**
   * @bug isRecurring will always be set from the createEvent method, so second check will never take place
   * @param criteria
   * @param isRecurring
   */
  private assertTimingMatchesRecurrence(
    criteria: EventCriteria,
    isRecurring: boolean,
  ): void {
    if (isRecurring && (criteria.date !== undefined || !criteria.dayOfWeek)) {
      throw new BadRequestException(
        'Recurring events require dayOfWeek and must not include date',
      );
    }
    // if (!isRecurring && (criteria.dayOfWeek !== undefined || !criteria.date)) {
    //   throw new BadRequestException(
    //     'Non-recurring events require date and must not include dayOfWeek',
    //   );
    // }
  }

  protected async validateVenueIds(
    db: AppDatabase,
    venues: EventDto['venues'],
    universityId?: string,
  ): Promise<string[]> {
    if (venues === undefined) return [];

    const venueIds = [...new Set(venues.map(({ venueId }) => venueId))];

    if (venueIds.length !== venues.length) {
      //but just continue with unique ones instead of throwing
      throw new BadRequestException('Event venues must not contain duplicates');
    }
    if (venueIds.length === 0) return [];

    const existing = await db
      .select({ venueId: Venue.VenueID })
      .from(Venue)
      .where(
        and(
          inArray(Venue.VenueID, venueIds),
          universityId === undefined
            ? undefined
            : eq(Venue.UniversityID, universityId),
        ),
      );

    if (existing.length !== venueIds.length) {
      if (universityId !== undefined) {
        throw new BadRequestException(
          `One or more venueIds do not belong to the university[${universityId}]`,
        );
      }

      throw new BadRequestException('One or more venueIds do not exist');
    }

    return venueIds;
  }

  /**
   * Check if there is a matching event for the input event based of their fingerprints
   * @param event - Find event matching this createEventDto
   * @param tx - transactinoal safety
   */
  private async duplicateEvent(
    fingerprint: string | null,
    tx: AppDatabase,
  ): Promise<EventDto | null> {
    if (!fingerprint) {
      return null;
    }

    const [fetched] = await tx
      .select()
      .from(Event)
      .where(eq(Event.importFingerprint, fingerprint))
      .limit(1);

    return fetched !== undefined ? this.mapEventToDto(fetched) : null;
  }

  async updateEventVenue(
    session: SessionData,
    eventId: string,
    updateEventVenueDto: UpdateEventVenueDto,
    database?: AppDatabase,
  ): Promise<EventSingleResponseDto> {
    if (!database) {
      return this.dbService.db.transaction(async (transaction: AppDatabase) => {
        return this.updateEventVenue(
          session,
          eventId,
          updateEventVenueDto,
          transaction,
        );
      });
    }

    const userId = session.user.id;
    const role = session.user.role as string;
    const universityId = session.uniId;

    if (!universityId) {
      throw new ForbiddenException('No active university selected');
    }

    if (
      role === 'student' &&
      !(await this.ownershipCheck(userId, eventId, database))
    ) {
      throw new ForbiddenException(
        'users cannot update events they do not own',
      );
    }

    const existingEvent = (await this.getById(eventId, database)).event;
    if (!existingEvent) {
      throw new NotFoundException(`Event not found for event id: ${eventId}`);
    }

    let venueIdToLink: string;

    const [existingVenue] = await database
      .select({ id: Venue.VenueID })
      .from(Venue)
      .where(
        and(
          eq(Venue.UniversityID, universityId),
          ilike(Venue.VenueName, updateEventVenueDto.venueName),
        ),
      )
      .limit(1);

    if (existingVenue) {
      venueIdToLink = existingVenue.id;
      if (updateEventVenueDto.buildingId) {
        await database
          .update(Venue)
          .set({ BuildingID: updateEventVenueDto.buildingId })
          .where(eq(Venue.VenueID, venueIdToLink));
      }
    } else {
      const [newVenue] = await database
        .insert(Venue)
        .values({
          VenueName: updateEventVenueDto.venueName,
          UniversityID: universityId,
          BuildingID: updateEventVenueDto.buildingId || null,
        })
        .returning();

      venueIdToLink = newVenue.VenueID;
    }

    await database.delete(EventVenue).where(eq(EventVenue.EventID, eventId));

    await database
      .insert(EventVenue)
      .values({ EventID: eventId, VenueID: venueIdToLink })
      .onConflictDoNothing({
        target: [EventVenue.EventID, EventVenue.VenueID],
      });

    const [event] = await database
      .select()
      .from(Event)
      .where(eq(Event.eventID, eventId))
      .limit(1);

    return { event: await this.mapEventToDto(event, database) };
  }
} //EventService
