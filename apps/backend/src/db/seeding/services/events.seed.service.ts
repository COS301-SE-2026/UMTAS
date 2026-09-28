import { Injectable } from '@nestjs/common';

import { and, eq, inArray, ne } from 'drizzle-orm';

import {
  Event,
  EventAttendance,
  EventVenue,
  ModuleEnrollment,
  UniversityEvent,
  Venue,
  modules,
  usersTable,
} from '../../../entities';

import type { AppDatabase } from '../../database.service';

import { BaseSeedService } from '../base.seed.service';
import { SeedPersistenceService } from '../seed-persistence.service';

import {
  EventSource,
  type UniversityEventCriteria,
} from '../../../Events/dto/event.types';

import {
  FIRST_YEAR_EVENTS,
  type SeedEvent,
} from '../Constants/Events.constants';
import { EventImportFingerprintService } from 'src/Events/event-import-fingerprint.service';

type SeededModule = {
  id: string;
  code: string;
};

type SeededVenue = {
  id: string;
  name: string;
};

const ATTENDANCE_WEEKS = 12;

const DAY_OFFSETS: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

@Injectable()
export class EventsSeedService extends BaseSeedService {
  constructor(
    private readonly persistence: SeedPersistenceService,
    private readonly eventFingerprintService: EventImportFingerprintService,
  ) {
    super();
  }

  async seed(db: AppDatabase): Promise<void> {
    // Get all first-year module codes
    const moduleCodes = [
      ...new Set(FIRST_YEAR_EVENTS.map((event) => event.moduleCode)),
    ];

    // Get all venue names
    const venueNames = [
      ...new Set(FIRST_YEAR_EVENTS.map((event) => event.venueName)),
    ];

    // Resolve modules and venues
    const modulesByCode = await this.getSeededModulesByCode(db, moduleCodes);

    const venuesByName = await this.getSeededVenuesByName(db, venueNames);

    // Validate that every module and venue exists
    this.validateReferences(modulesByCode, venuesByName);

    // Enroll every user in every module that has seeded events
    await this.enrollAllUsersInModules(
      db,
      [...modulesByCode.values()].map((module) => module.id),
    );

    let eventsCreated = 0;
    let relationshipsCreated = 0;
    let venuesCreated = 0;

    const seededEvents: { eventId: string; event: SeedEvent }[] = [];

    // Seed every configured event
    for (const event of FIRST_YEAR_EVENTS) {
      const module = modulesByCode.get(event.moduleCode);

      const venue = venuesByName.get(event.venueName);

      if (!module || !venue) {
        continue;
      }

      const result = await this.seedEvent(db, event, module, venue);

      seededEvents.push({ eventId: result.eventId, event });

      if (result.eventCreated) {
        eventsCreated++;
      }

      if (result.moduleRelationshipCreated) {
        relationshipsCreated++;
      }

      if (result.venueRelationshipCreated) {
        venuesCreated++;
      }
    }

    // Every user attends every seeded event
    const attendancesCreated = await this.seedAttendanceForAllUsers(
      db,
      seededEvents,
    );

    this.logResult('First-year events', eventsCreated);

    this.logResult('Module event relationships', relationshipsCreated);

    this.logResult('Event venue relationships', venuesCreated);

    this.logResult('Event attendances', attendancesCreated);
  } //END_seed

  private async getSeededModulesByCode(
    db: AppDatabase,
    codes: string[],
  ): Promise<Map<string, SeededModule>> {
    const seededModules = await db
      .select({
        id: modules.moduleID,
        code: modules.moduleCode,
      })
      .from(modules)
      .where(inArray(modules.moduleCode, codes));

    return new Map(seededModules.map((module) => [module.code, module]));
  } //END_getSeededModulesByCode

  private async getSeededVenuesByName(
    db: AppDatabase,
    names: string[],
  ): Promise<Map<string, SeededVenue>> {
    const seededVenues = await db
      .select({
        id: Venue.VenueID,
        name: Venue.VenueName,
      })
      .from(Venue)
      .where(inArray(Venue.VenueName, names));

    return new Map(seededVenues.map((venue) => [venue.name, venue]));
  } //END_getSeededVenuesByName

  private validateReferences(
    modulesByCode: Map<string, SeededModule>,
    venuesByName: Map<string, SeededVenue>,
  ): void {
    const missingModules = [
      ...new Set(
        FIRST_YEAR_EVENTS.map((event) => event.moduleCode).filter(
          (code) => !modulesByCode.has(code),
        ),
      ),
    ];

    const missingVenues = [
      ...new Set(
        FIRST_YEAR_EVENTS.map((event) => event.venueName).filter(
          (name) => !venuesByName.has(name),
        ),
      ),
    ];

    if (missingModules.length > 0) {
      throw new Error(`Missing seeded modules: ${missingModules.join(', ')}`);
    }

    if (missingVenues.length > 0) {
      throw new Error(`Missing seeded venues: ${missingVenues.join(', ')}`);
    }
  } //END_validateReferences

  private async seedEvent(
    db: AppDatabase,
    event: SeedEvent,
    module: SeededModule,
    venue: SeededVenue,
  ): Promise<{
    eventId: string;
    eventCreated: boolean;
    moduleRelationshipCreated: boolean;
    venueRelationshipCreated: boolean;
  }> {
    const eventCriteria: UniversityEventCriteria = {
      eventSource: EventSource.UNIVERSITY,
      moduleId: module.id,
      activityType: event.activityType,
      dayOfWeek: event.dayOfWeek,
      startTime: event.startTime,
      endTime: event.endTime,
    };

    const importFingerprint = this.eventFingerprintService.buildForModuleEvent({
      moduleId: module.id,
      activityType: event.activityType,
      activityCode: event.eventCode,
      eventCriteria,
      eventName: event.eventName,
      venueNames: [venue.name],
    });

    // Get existing event
    const [existingEvent] = await db
      .select({
        id: Event.eventID,
      })
      .from(Event)
      .where(eq(Event.importFingerprint, importFingerprint))
      .limit(1);

    let eventId: string;
    let eventCreated = false;

    if (existingEvent) {
      eventId = existingEvent.id;

      // Keep the seeded event aligned with the constants
      await db
        .update(Event)
        .set({
          eventName: event.eventName,
          activityCode: event.eventCode,
          activityType: event.activityType,
          eventCriteria: eventCriteria,
          isRecurring: event.isRecurring,
        })
        .where(eq(Event.eventID, eventId));
    } else {
      // Create the event
      const [createdEvent] = await this.persistence.insertEvents(db, [
        {
          eventName: event.eventName,
          activityCode: event.eventCode,
          activityType: event.activityType,
          eventCriteria: eventCriteria,
          isRecurring: event.isRecurring,
          importFingerprint,
        },
      ]);

      if (!createdEvent) {
        throw new Error(`Failed to create event [${event.eventName}]`);
      }

      eventId = createdEvent.eventID;
      eventCreated = true;
    }

    // Ensure module relationship
    const moduleRelationshipCreated = await this.ensureModuleEventRelationship(
      db,
      eventId,
      module.id,
    );

    // Ensure venue relationship
    const venueRelationshipCreated = await this.ensureEventVenueRelationship(
      db,
      eventId,
      venue.id,
    );

    return {
      eventId,
      eventCreated,
      moduleRelationshipCreated,
      venueRelationshipCreated,
    };
  } //END_seedEvent

  private async ensureModuleEventRelationship(
    db: AppDatabase,
    eventId: string,
    moduleId: string,
  ): Promise<boolean> {
    const [relationship] = await db
      .select({
        id: UniversityEvent.UniversityEventID,
      })
      .from(UniversityEvent)
      .where(
        and(
          eq(UniversityEvent.eventID, eventId),
          eq(UniversityEvent.moduleID, moduleId),
        ),
      )
      .limit(1);

    if (relationship) {
      return false;
    }

    await this.persistence.insertUniversityEvents(db, [
      {
        eventID: eventId,
        moduleID: moduleId,
      },
    ]);

    return true;
  } //END_ensureModuleEventRelationship

  private async ensureEventVenueRelationship(
    db: AppDatabase,
    eventId: string,
    venueId: string,
  ): Promise<boolean> {
    const [relationship] = await db
      .select({
        eventId: EventVenue.EventID,
        venueId: EventVenue.VenueID,
      })
      .from(EventVenue)
      .where(
        and(eq(EventVenue.EventID, eventId), eq(EventVenue.VenueID, venueId)),
      )
      .limit(1);

    if (relationship) {
      return false;
    }

    await db.insert(EventVenue).values({
      EventID: eventId,
      VenueID: venueId,
    });

    return true;
  } //END_ensureEventVenueRelationship

  private async enrollAllUsersInModules(
    db: AppDatabase,
    moduleIds: string[],
  ): Promise<number> {
    if (moduleIds.length === 0) {
      return 0;
    }

    // Get all users
    const users = await db.select({ id: usersTable.id }).from(usersTable);

    if (users.length === 0) {
      return 0;
    }

    // Get existing enrollments for these modules
    const existingEnrollments = await db
      .select({
        moduleId: ModuleEnrollment.ModuleID,
        userId: ModuleEnrollment.UserID,
      })
      .from(ModuleEnrollment)
      .where(inArray(ModuleEnrollment.ModuleID, moduleIds));

    const existingKeys = new Set(
      existingEnrollments.map(
        (enrollment) => `${enrollment.moduleId}:${enrollment.userId}`,
      ),
    );

    // Only enroll the missing user/module pairs
    const missingEnrollments: (typeof ModuleEnrollment.$inferInsert)[] = [];

    for (const moduleId of moduleIds) {
      for (const user of users) {
        if (existingKeys.has(`${moduleId}:${user.id}`)) {
          continue;
        }

        missingEnrollments.push({
          ModuleID: moduleId,
          UserID: user.id,
        });
      } //END_user
    } //END_moduleId

    if (missingEnrollments.length === 0) {
      return 0;
    }

    const created = await this.persistence.insertModuleEnrollments(
      db,
      missingEnrollments,
    );

    return created.length;
  } //END_enrollAllUsersInModules

  private async seedAttendanceForAllUsers(
    db: AppDatabase,
    seededEvents: { eventId: string; event: SeedEvent }[],
  ): Promise<number> {
    if (seededEvents.length === 0) {
      return 0;
    }

    // Get all users
    const users = await db.select({ id: usersTable.id }).from(usersTable);

    if (users.length === 0) {
      return 0;
    }

    const eventIds = seededEvents.map((seeded) => seeded.eventId);

    // Get existing attendance rows for these events
    const existingAttendances = await db
      .select({
        eventId: EventAttendance.eventID,
        userId: EventAttendance.UserID,
        eventDate: EventAttendance.eventDate,
      })
      .from(EventAttendance)
      .where(inArray(EventAttendance.eventID, eventIds));

    const existingKeys = new Set(
      existingAttendances.map(
        (attendance) =>
          `${attendance.eventId}:${attendance.userId}:${attendance.eventDate}`,
      ),
    );

    // Only create the missing user/event/date rows
    const missingAttendances: (typeof EventAttendance.$inferInsert)[] = [];

    for (const { eventId, event } of seededEvents) {
      const dates = this.getOccurrenceDates(event.dayOfWeek);

      for (const user of users) {
        for (const eventDate of dates) {
          if (existingKeys.has(`${eventId}:${user.id}:${eventDate}`)) {
            continue;
          }

          missingAttendances.push({
            eventID: eventId,
            UserID: user.id,
            eventDate,
            state: 'ATTENDING',
          });
        } //END_eventDate
      } //END_user
    } //END_seededEvents

    // Insert in batches to stay well under Postgres' parameter limit
    const BATCH_SIZE = 1000;
    let created = 0;

    for (let i = 0; i < missingAttendances.length; i += BATCH_SIZE) {
      const inserted = await this.persistence.insertEventAttendances(
        db,
        missingAttendances.slice(i, i + BATCH_SIZE),
      );

      created += inserted.length;
    }

    await db
      .update(EventAttendance)
      .set({ state: 'ATTENDING' })
      .where(
        and(
          inArray(EventAttendance.eventID, eventIds),
          ne(EventAttendance.state, 'ATTENDING'),
        ),
      );

    return created;
  } //END_seedAttendanceForAllUsers

  private getOccurrenceDates(dayOfWeek: string): string[] {
    const offset = DAY_OFFSETS[dayOfWeek.toLowerCase()] ?? 0;

    const now = new Date();
    const monday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));

    const dates: string[] = [];

    for (let week = 0; week < ATTENDANCE_WEEKS; week++) {
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + week * 7 + offset);
      dates.push(date.toISOString().slice(0, 10));
    } //END_week

    return dates;
  } //END_getOccurrenceDates
} //END_EventsSeedService
