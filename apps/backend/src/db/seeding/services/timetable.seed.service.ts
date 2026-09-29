import { Injectable } from '@nestjs/common';

import { and, eq, inArray, notLike } from 'drizzle-orm';

import {
  Event,
  EventsToTimetables,
  Timetable,
  UserTimetable,
  ModuleEnrollment,
  ModuleTeaches,
  UniversityEvent,
  UniversityRole,
  usersTable,
} from '../../../entities';

import type { AppDatabase } from '../../database.service';

import { BaseSeedService } from '../base.seed.service';
import { SeedPersistenceService } from '../seed-persistence.service';
import { SeedQueryService } from './seed-query.service';

import { EventImportFingerprintService } from 'src/Events/event-import-fingerprint.service';

const DEMO_SCHEDULE = 'DEMO_SCHEDULE';

// Must match the event names created by the attendance conflict demo
const ATTENDANCE_DEMO_EVENT_PREFIX = 'Attendance demo';

@Injectable()
export class TimetableSeedService extends BaseSeedService {
  constructor(
    private readonly persistence: SeedPersistenceService,
    private readonly query: SeedQueryService,
    private readonly eventFingerprintService: EventImportFingerprintService,
  ) {
    super();
  }

  async seed(db: AppDatabase): Promise<void> {
    const universityId = await this.query.getUniversityIDByName(db, 'Pretoria');

    if (!universityId) {
      this.logger.warn(
        'University of Pretoria is missing; skipping timetable seed.',
      );
      return;
    }

    const users = await this.getSeededUsers(db, universityId);

    if (users.length === 0) {
      this.logger.warn(
        'Demo schedules could not be seeded because no users exist.',
      );
      return;
    }

    let timetablesCreated = 0;
    let userTimetablesCreated = 0;
    let timetableEventsCreated = 0;

    for (const user of users) {
      const eventIds = await this.getUserEventIds(db, user.id);

      if (eventIds.length === 0) {
        this.logger.warn(
          `No enrolled events found for user ${user.id}; skipping timetable.`,
        );
        continue;
      }

      const timetable = await this.getOrCreateUserTimetable(
        db,
        user.id,
        eventIds,
      );

      if (timetable.created) {
        timetablesCreated++;
      }

      timetableEventsCreated += timetable.eventsCreated;

      const userTimetableCreated = await this.ensureUserTimetable(
        db,
        user.id,
        timetable.timetable.timetableID,
      );

      if (userTimetableCreated) {
        userTimetablesCreated++;
      }
    }

    this.logResult('Demo timetables', timetablesCreated);
    this.logResult('Demo timetable events', timetableEventsCreated);
    this.logResult('Demo timetable users', userTimetablesCreated);
  } //END_seed

  private async getUserEventIds(
    db: AppDatabase,
    userId: string,
  ): Promise<string[]> {
    const enrolledModules = await db
      .select({
        moduleId: ModuleEnrollment.ModuleID,
      })
      .from(ModuleEnrollment)
      .where(eq(ModuleEnrollment.UserID, userId));

    // Lecturers see the modules they teach as well
    const taughtModules = await db
      .select({
        moduleId: ModuleTeaches.ModuleID,
      })
      .from(ModuleTeaches)
      .where(eq(ModuleTeaches.UserID, userId));

    const moduleIds = [
      ...new Set([
        ...enrolledModules.map((enrollment) => enrollment.moduleId),
        ...taughtModules.map((teaching) => teaching.moduleId),
      ]),
    ];

    if (moduleIds.length === 0) {
      return [];
    }

    // Attendance demo events must never appear on a schedule
    const events = await db
      .select({
        eventId: UniversityEvent.eventID,
      })
      .from(UniversityEvent)
      .innerJoin(Event, eq(Event.eventID, UniversityEvent.eventID))
      .where(
        and(
          inArray(UniversityEvent.moduleID, moduleIds),
          notLike(Event.eventName, `${ATTENDANCE_DEMO_EVENT_PREFIX}%`),
        ),
      );

    return [...new Set(events.map((event) => event.eventId))];
  } //END_getUserEventIds

  private async getSeededUsers(
    db: AppDatabase,
    universityId: string,
  ): Promise<{ id: string }[]> {
    const seededUsers = await db
      .select({
        id: usersTable.id,
      })
      .from(usersTable)
      .where(inArray(usersTable.email, this.constants.UserEmails));

    const universityAdmins = await db
      .select({
        id: usersTable.id,
      })
      .from(usersTable)
      .innerJoin(UniversityRole, eq(UniversityRole.UserID, usersTable.id))
      .where(
        and(
          eq(UniversityRole.UniversityID, universityId),
          eq(UniversityRole.role, 'UNIVERSITY_ADMIN'),
        ),
      );

    // Seeded users and university admins, without duplicates
    const usersById = new Map(seededUsers.map((user) => [user.id, user]));

    for (const admin of universityAdmins) {
      usersById.set(admin.id, admin);
    }

    return [...usersById.values()];
  } //END_getSeededUsers

  private async getOrCreateUserTimetable(
    db: AppDatabase,
    userId: string,
    eventIds: string[],
  ): Promise<{
    timetable: typeof Timetable.$inferSelect;
    created: boolean;
    eventsCreated: number;
  }> {
    const timetableName = `${DEMO_SCHEDULE}_${userId.slice(0, 8)}`;

    const [existingTimetable] = await db
      .select()
      .from(Timetable)
      .where(eq(Timetable.timetableName, timetableName))
      .limit(1);

    let timetable: typeof Timetable.$inferSelect;
    let created = false;

    if (existingTimetable) {
      timetable = existingTimetable;
    } else {
      const [newTimetable] = await this.persistence.insertTimetables(db, [
        {
          timetableName,
        },
      ]);

      if (!newTimetable) {
        throw new Error(`Failed to create timetable for user ${userId}.`);
      }

      timetable = newTimetable;
      created = true;
    }

    const eventsCreated = await this.ensureTimetableEvents(
      db,
      timetable.timetableID,
      eventIds,
    );

    return {
      timetable,
      created,
      eventsCreated,
    };
  } //END_getOrCreateTimetable

  private async ensureTimetableEvents(
    db: AppDatabase,
    timetableId: string,
    eventIds: string[],
  ): Promise<number> {
    const existingEvents = await db
      .select({
        eventID: EventsToTimetables.eventID,
      })
      .from(EventsToTimetables)
      .where(eq(EventsToTimetables.timetableID, timetableId));

    const existingEventIds = new Set(
      existingEvents.map((event) => event.eventID),
    );

    const desiredEventIds = new Set(eventIds);

    // Remove events the user should no longer have (old seed leftovers, attendance demo events)
    const staleEventIds = [...existingEventIds].filter(
      (eventId) => !desiredEventIds.has(eventId),
    );

    if (staleEventIds.length > 0) {
      await db
        .delete(EventsToTimetables)
        .where(
          and(
            eq(EventsToTimetables.timetableID, timetableId),
            inArray(EventsToTimetables.eventID, staleEventIds),
          ),
        );
    }

    const missingEventIds = eventIds.filter(
      (eventId) => !existingEventIds.has(eventId),
    );

    if (missingEventIds.length === 0) {
      return 0;
    }

    await this.persistence.insertEventsToTimetables(
      db,
      missingEventIds.map((eventID) => ({
        eventID,
        timetableID: timetableId,
      })),
    );

    return missingEventIds.length;
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
