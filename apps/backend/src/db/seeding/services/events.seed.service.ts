import { Injectable } from '@nestjs/common';

import { and, eq, inArray } from 'drizzle-orm';

import {
  Event,
  EventVenue,
  UniversityEvent,
  Venue,
  modules,
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

    let eventsCreated = 0;
    let relationshipsCreated = 0;
    let venuesCreated = 0;

    // Seed every configured event
    for (const event of FIRST_YEAR_EVENTS) {
      const module = modulesByCode.get(event.moduleCode);

      const venue = venuesByName.get(event.venueName);

      if (!module || !venue) {
        continue;
      }

      const result = await this.seedEvent(db, event, module, venue);

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

    this.logResult('First-year events', eventsCreated);

    this.logResult('Module event relationships', relationshipsCreated);

    this.logResult('Event venue relationships', venuesCreated);
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
} //END_EventsSeedService
