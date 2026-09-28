import { Injectable } from '@nestjs/common';

import { and, eq, inArray } from 'drizzle-orm';

import {
  EventsToTimetables,
  Event,
  Timetable,
  UserTimetable,
  modules,
  Venue,
} from '../../../entities';

import type { AppDatabase } from '../../database.service';

import { BaseSeedService } from '../base.seed.service';
import { SeedPersistenceService } from '../seed-persistence.service';

import {
  EventSource,
  type UniversityEventCriteria,
} from '../../../Events/dto/event.types';

import { FIRST_YEAR_EVENTS } from '../Constants/Events.constants';

import { EventImportFingerprintService } from 'src/Events/event-import-fingerprint.service';

const DEMO_SCHEDULE = 'DEMO_SCHEDULE';

@Injectable()
export class TimetableSeedService extends BaseSeedService {
  constructor(
    private readonly persistence: SeedPersistenceService,
    private readonly eventFingerprintService: EventImportFingerprintService,
  ) {
    super();
  }

  async seed(db: AppDatabase): Promise<void> {
    // Get all seeded users
    const users = await this.getSeededUsers(db);

    if (users.length === 0) {
      this.logger.warn(
        'Demo schedule could not be seeded because no users exist.',
      );
      return;
    }

    // Resolve all seeded events
    const eventIds = await this.getSeededEventIds(db);

    if (eventIds.length === 0) {
      this.logger.warn(
        'Demo schedule could not be seeded because no events exist.',
      );
      return;
    }

    // Seed the timetable
    const timetable = await this.getOrCreateTimetable(db, eventIds);

    // Assign the timetable to every user
    let userTimetablesCreated = 0;

    for (const user of users) {
      const created = await this.ensureUserTimetable(
        db,
        user.id,
        timetable.timetable.timetableID,
      );

      if (created) {
        userTimetablesCreated++;
      }
    }

    this.logResult('Demo timetable', timetable.created ? 1 : 0);

    this.logResult('Demo timetable users', userTimetablesCreated);
  } //END_seed

  private async getSeededUsers(db: AppDatabase): Promise<{ id: string }[]> {
    const users = await db.query.usersTable.findMany({
      columns: {
        id: true,
      },
    });

    return users;
  } //END_getSeededUsers

  private async getSeededEventIds(db: AppDatabase): Promise<string[]> {
    const fingerprints = await this.getEventFingerprints(db);

    if (fingerprints.length === 0) {
      return [];
    }

    const events = await db
      .select({
        eventID: Event.eventID,
      })
      .from(Event)
      .where(inArray(Event.importFingerprint, fingerprints));

    return events.map((event) => event.eventID);
  } //END_getSeededEventIds

  private async getEventFingerprints(db: AppDatabase): Promise<string[]> {
    const moduleCodes = [
      ...new Set(FIRST_YEAR_EVENTS.map((event) => event.moduleCode)),
    ];

    const venueNames = [
      ...new Set(FIRST_YEAR_EVENTS.map((event) => event.venueName)),
    ];

    const seededModules = await db
      .select({
        id: modules.moduleID,
        code: modules.moduleCode,
      })
      .from(modules)
      .where(inArray(modules.moduleCode, moduleCodes));

    const seededVenues = await db
      .select({
        name: Venue.VenueName,
      })
      .from(Venue)
      .where(inArray(Venue.VenueName, venueNames));

    const modulesByCode = new Map(
      seededModules.map((module) => [module.code, module.id]),
    );

    const venuesByName = new Map(
      seededVenues.map((venue) => [venue.name, venue.name]),
    );

    const fingerprints: string[] = [];

    for (const event of FIRST_YEAR_EVENTS) {
      const moduleId = modulesByCode.get(event.moduleCode);

      const venueName = venuesByName.get(event.venueName);

      if (!moduleId || !venueName) {
        continue;
      }

      const eventCriteria: UniversityEventCriteria = {
        eventSource: EventSource.UNIVERSITY,
        moduleId,
        activityType: event.activityType,
        dayOfWeek: event.dayOfWeek,
        startTime: event.startTime,
        endTime: event.endTime,
      };

      const fingerprint = this.eventFingerprintService.buildForModuleEvent({
        moduleId,
        activityType: event.activityType,
        activityCode: event.eventCode,
        eventCriteria,
        eventName: event.eventName,
        venueNames: [venueName],
      });

      fingerprints.push(fingerprint);
    }

    return fingerprints;
  } //END_getEventFingerprints

  private async getOrCreateTimetable(
    db: AppDatabase,
    eventIds: string[],
  ): Promise<{
    timetable: typeof Timetable.$inferSelect;
    created: boolean;
  }> {
    const [existingTimetable] = await db
      .select()
      .from(Timetable)
      .where(eq(Timetable.timetableName, DEMO_SCHEDULE))
      .limit(1);

    let timetable: typeof Timetable.$inferSelect;
    let created = false;

    if (existingTimetable) {
      timetable = existingTimetable;
    } else {
      const [newTimetable] = await this.persistence.insertTimetables(db, [
        {
          timetableName: DEMO_SCHEDULE,
        },
      ]);

      if (!newTimetable) {
        throw new Error('Failed to create demo timetable.');
      }

      timetable = newTimetable;
      created = true;
    }

    await this.ensureTimetableEvents(db, timetable.timetableID, eventIds);

    return {
      timetable,
      created,
    };
  } //END_getOrCreateTimetable

  private async ensureTimetableEvents(
    db: AppDatabase,
    timetableId: string,
    eventIds: string[],
  ): Promise<void> {
    const existingEvents = await db
      .select({
        eventID: EventsToTimetables.eventID,
      })
      .from(EventsToTimetables)
      .where(eq(EventsToTimetables.timetableID, timetableId));

    const existingEventIds = new Set(
      existingEvents.map((event) => event.eventID),
    );

    const missingEventIds = eventIds.filter(
      (eventId) => !existingEventIds.has(eventId),
    );

    if (missingEventIds.length === 0) {
      return;
    }

    await this.persistence.insertEventsToTimetables(
      db,
      missingEventIds.map((eventID) => ({
        eventID,
        timetableID: timetableId,
      })),
    );
  } //END_ensureTimetableEvents

  private async ensureUserTimetable(
    db: AppDatabase,
    userId: string,
    timetableId: string,
  ): Promise<boolean> {
    const [existing] = await db
      .select({
        id: UserTimetable.UserTimetableID,
      })
      .from(UserTimetable)
      .where(
        and(
          eq(UserTimetable.UserID, userId),
          eq(UserTimetable.TimetableID, timetableId),
        ),
      )
      .limit(1);

    if (existing) {
      return false;
    }

    await this.persistence.insertUserTimetables(db, [
      {
        UserID: userId,
        TimetableID: timetableId,
      },
    ]);

    return true;
  } //END_ensureUserTimetable
} //END_TimetableSeedService
