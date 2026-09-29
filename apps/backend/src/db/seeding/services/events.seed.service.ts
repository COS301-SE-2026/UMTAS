import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { and, eq, inArray, ne } from 'drizzle-orm';

import {
  Event,
  EventAttendance,
  EventVenue,
  ModuleEnrollment,
  ModuleTeaches,
  NfcTag,
  UniversityEvent,
  UniversityRole,
  Venue,
  modules,
  usersTable,
} from '../../../entities';

import type { AppDatabase } from '../../database.service';

import { BaseSeedService } from '../base.seed.service';
import { SeedPersistenceService } from '../seed-persistence.service';
import { SeedQueryService } from './seed-query.service';
import {
  DEFAULT_ATTENDANCE_TIME_ZONE,
  localDateAt,
} from '../../../Attendance/attendance-occurrence';

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

type SeededUser = {
  id: string;
  email: string;
};

type SeedUsers = {
  users: SeededUser[];
  fullAccessIds: Set<string>;
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
    private readonly query: SeedQueryService,
    private readonly eventFingerprintService: EventImportFingerprintService,
  ) {
    super();
  }

  async seed(db: AppDatabase): Promise<void> {
    const universityId = await this.query.getUniversityIDByName(db, 'Pretoria');

    if (!universityId) {
      this.logger.warn(
        'University of Pretoria is missing; skipping event seed.',
      );
      return;
    }

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

    // Resolve who gets everything and who gets a random selection
    const seedUsers = await this.getSeedUsers(db, universityId);

    // Enroll the full access users in everything and the rest in a random selection
    await this.seedUserModuleEnrollments(
      db,
      [...modulesByCode.values()],
      seedUsers,
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

    await this.seedAttendanceConflictDemo(db, modulesByCode, universityId);

    // Every enrolled user attends the seeded events of their modules
    const attendancesCreated = await this.seedAttendanceForAllUsers(
      db,
      seededEvents,
      seedUsers,
    );

    this.logResult('First-year events', eventsCreated);

    this.logResult('Module event relationships', relationshipsCreated);

    this.logResult('Event venue relationships', venuesCreated);

    this.logResult('Event attendances', attendancesCreated);
  } //END_seed

  private async seedAttendanceConflictDemo(
    db: AppDatabase,
    modulesByCode: Map<string, { id: string; code: string }>,
    universityId: string,
  ): Promise<void> {
    const lecturerEmail = this.constants.UserEmails[1];
    const [lecturer] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, lecturerEmail))
      .limit(1);
    const demoModules = this.constants.ATTENDANCE_DEMO_MODULE_CODES.map(
      (code) => modulesByCode.get(code),
    ).filter(
      (module): module is { id: string; code: string } => module !== undefined,
    );

    if (!lecturer || demoModules.length < 2) {
      this.logger.warn(
        'Attendance conflict demo requires the seeded lecturer and two modules',
      );
      return;
    }

    await db
      .insert(ModuleTeaches)
      .values(
        demoModules.map((module) => ({
          ModuleID: module.id,
          UserID: lecturer.id,
        })),
      )
      .onConflictDoNothing();

    const [student] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, this.constants.UserEmails[0]))
      .limit(1);
    if (student) {
      await db
        .insert(ModuleEnrollment)
        .values(
          demoModules.map((module) => ({
            ModuleID: module.id,
            UserID: student.id,
          })),
        )
        .onConflictDoNothing();
    }

    const secret = process.env.BETTER_AUTH_SECRET;
    if (secret) {
      const tokenHash = createHmac('sha256', secret)
        .update('attendance-conflict-demo-token-2026')
        .digest('hex');
      await db
        .insert(NfcTag)
        .values({
          tagId: '00000000-0000-4000-8000-0000000000a1',
          ownerUserId: lecturer.id,
          universityId,
          tokenHash,
        })
        .onConflictDoUpdate({
          target: NfcTag.ownerUserId,
          set: {
            tagId: '00000000-0000-4000-8000-0000000000a1',
            tokenHash,
            universityId,
            updatedAt: new Date(),
          },
        });
    }

    const date = localDateAt(
      new Date(),
      process.env.ATTENDANCE_TIME_ZONE ?? DEFAULT_ATTENDANCE_TIME_ZONE,
    );

    const weekdays = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ] as const;
    for (const [index, module] of demoModules.entries()) {
      for (const dayOfWeek of weekdays) {
        const eventName = `Attendance demo ${index + 1}`;
        const criteria: UniversityEventCriteria = {
          eventSource: EventSource.UNIVERSITY,
          moduleId: module.id,
          activityType: 'lecture',
          dayOfWeek,
          startTime: '00:00',
          endTime: '23:59',
        };

        const importFingerprint =
          this.eventFingerprintService.buildForModuleEvent({
            moduleId: module.id,
            activityType: 'lecture',
            activityCode: module.code,
            eventCriteria: criteria,
            eventName,
          });

        const [existing] = await db
          .select({ id: Event.eventID })
          .from(Event)
          .where(eq(Event.importFingerprint, importFingerprint))
          .limit(1);
        const eventId = existing
          ? existing.id
          : (
              await this.persistence.insertEvents(db, [
                {
                  eventName,
                  activityCode: module.code,
                  activityType: 'lecture',
                  eventCriteria: criteria,
                  isRecurring: true,
                  validated: true,
                  importFingerprint,
                },
              ])
            )[0]?.eventID;

        if (!eventId) continue;
        if (existing) {
          await db
            .update(Event)
            .set({
              eventName,
              activityCode: module.code,
              activityType: 'lecture',
              eventCriteria: criteria,
              isRecurring: true,
              validated: true,
            })
            .where(eq(Event.eventID, eventId));
        }
        await this.ensureModuleEventRelationship(db, eventId, module.id);
      }
    }

    this.logger.log(
      `Seeded recurring attendance conflict demo for ${lecturerEmail}; active on ${date}`,
    );
  } //END_seedAttendanceConflictDemo

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

  private async getSeedUsers(
    db: AppDatabase,
    universityId: string,
  ): Promise<SeedUsers> {
    const seededUsers = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(inArray(usersTable.email, this.constants.UserEmails));

    const universityAdmins = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
      })
      .from(usersTable)
      .innerJoin(UniversityRole, eq(UniversityRole.UserID, usersTable.id))
      .where(
        and(
          eq(UniversityRole.UniversityID, universityId),
          eq(UniversityRole.role, 'UNIVERSITY_ADMIN'),
        ),
      );

    const templateEmail = this.constants.UserEmails[0];
    const lecturerEmail = this.constants.UserEmails[1];

    const usersById = new Map(seededUsers.map((user) => [user.id, user]));

    for (const admin of universityAdmins) {
      usersById.set(admin.id, admin);
    }

    // University admins, the template user and the lecturer get everything
    const fullAccessIds = new Set<string>(
      universityAdmins.map((admin) => admin.id),
    );

    for (const user of usersById.values()) {
      if (user.email === templateEmail || user.email === lecturerEmail) {
        fullAccessIds.add(user.id);
      }
    }

    return {
      users: [...usersById.values()],
      fullAccessIds,
    };
  } //END_getSeedUsers

  private async seedUserModuleEnrollments(
    db: AppDatabase,
    seededModules: SeededModule[],
    seedUsers: SeedUsers,
  ): Promise<number> {
    if (seededModules.length === 0) {
      return 0;
    }

    const { users, fullAccessIds } = seedUsers;

    const moduleIds = seededModules.map((module) => module.id);

    // Work out which modules every seeded user should be enrolled in
    const desiredModuleIds = new Map<string, Set<string>>();

    for (const user of users) {
      const selectedModules = fullAccessIds.has(user.id)
        ? seededModules
        : this.getDeterministicModuleSelection(user.email, seededModules);

      desiredModuleIds.set(
        user.id,
        new Set(selectedModules.map((module) => module.id)),
      );
    }

    // Only look at enrollments for the seeded modules
    const existingEnrollments = await db
      .select({
        moduleId: ModuleEnrollment.ModuleID,
        userId: ModuleEnrollment.UserID,
      })
      .from(ModuleEnrollment)
      .where(inArray(ModuleEnrollment.ModuleID, moduleIds));

    const existingKeys = new Set(
      existingEnrollments.map(
        ({ moduleId, userId }) => `${moduleId}:${userId}`,
      ),
    );

    // Remove stale enrollments left over from the old "everyone gets everything" seed
    const staleModulesByUser = new Map<string, string[]>();

    for (const { moduleId, userId } of existingEnrollments) {
      const desired = desiredModuleIds.get(userId);

      if (!desired || fullAccessIds.has(userId) || desired.has(moduleId)) {
        continue;
      }

      const staleModules = staleModulesByUser.get(userId) ?? [];

      staleModules.push(moduleId);

      staleModulesByUser.set(userId, staleModules);
    }

    for (const [userId, staleModuleIds] of staleModulesByUser) {
      await db
        .delete(ModuleEnrollment)
        .where(
          and(
            eq(ModuleEnrollment.UserID, userId),
            inArray(ModuleEnrollment.ModuleID, staleModuleIds),
          ),
        );
    }

    // Only create the missing user/module rows
    const missingEnrollments: (typeof ModuleEnrollment.$inferInsert)[] = [];

    for (const [userId, desired] of desiredModuleIds) {
      for (const moduleId of desired) {
        if (existingKeys.has(`${moduleId}:${userId}`)) {
          continue;
        }

        missingEnrollments.push({
          ModuleID: moduleId,
          UserID: userId,
        });
      } //END_moduleId
    } //END_user

    if (missingEnrollments.length === 0) {
      return 0;
    }

    const created = await this.persistence.insertModuleEnrollments(
      db,
      missingEnrollments,
    );

    return created.length;
  } //END_seedUserModuleEnrollments

  private async seedAttendanceForAllUsers(
    db: AppDatabase,
    seededEvents: { eventId: string; event: SeedEvent }[],
    seedUsers: SeedUsers,
  ): Promise<number> {
    if (seededEvents.length === 0) {
      return 0;
    }

    const eventIds = seededEvents.map((seeded) => seeded.eventId);

    // Users that receive a random selection instead of everything
    const randomUserIds = new Set(
      seedUsers.users
        .filter((user) => !seedUsers.fullAccessIds.has(user.id))
        .map((user) => user.id),
    );

    const eventModules = await db
      .select({
        eventId: UniversityEvent.eventID,
        moduleId: UniversityEvent.moduleID,
      })
      .from(UniversityEvent)
      .where(inArray(UniversityEvent.eventID, eventIds));

    if (eventModules.length === 0) {
      return 0;
    }

    const moduleUsers = await db
      .select({
        moduleId: ModuleEnrollment.ModuleID,
        userId: ModuleEnrollment.UserID,
      })
      .from(ModuleEnrollment)
      .where(
        inArray(
          ModuleEnrollment.ModuleID,
          eventModules.map((eventModule) => eventModule.moduleId),
        ),
      );

    const usersByModule = new Map<string, string[]>();

    for (const enrollment of moduleUsers) {
      const users = usersByModule.get(enrollment.moduleId) ?? [];

      users.push(enrollment.userId);

      usersByModule.set(enrollment.moduleId, users);
    }

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

    // Every attendance row the random users should have
    const desiredRandomKeys = new Set<string>();

    for (const { eventId, event } of seededEvents) {
      const dates = this.getOccurrenceDates(event.dayOfWeek);

      const moduleId = eventModules.find(
        (eventModule) => eventModule.eventId === eventId,
      )?.moduleId;

      if (!moduleId) {
        continue;
      }

      const enrolledUsers = usersByModule.get(moduleId) ?? [];

      for (const userId of enrolledUsers) {
        const isRandomUser = randomUserIds.has(userId);

        for (const eventDate of dates) {
          const key = `${eventId}:${userId}:${eventDate}`;

          if (isRandomUser) {
            // Random users miss a few occurrences
            if (this.isOccurrenceSkipped(userId, eventId, eventDate)) {
              continue;
            }

            desiredRandomKeys.add(key);
          }

          if (existingKeys.has(key)) {
            continue;
          }

          missingAttendances.push({
            eventID: eventId,
            UserID: userId,
            eventDate,
            state: 'ATTENDING',
          });
        } //END_eventDate
      } //END_user
    } //END_seededEvents

    // Remove stale attendance for random users (not enrolled or skipped occurrences)
    const staleByUser = new Map<string, Map<string, string[]>>();

    for (const attendance of existingAttendances) {
      const key = `${attendance.eventId}:${attendance.userId}:${attendance.eventDate}`;

      if (!randomUserIds.has(attendance.userId) || desiredRandomKeys.has(key)) {
        continue;
      }

      const staleEvents =
        staleByUser.get(attendance.userId) ?? new Map<string, string[]>();

      const staleDates = staleEvents.get(attendance.eventId) ?? [];

      staleDates.push(String(attendance.eventDate));

      staleEvents.set(attendance.eventId, staleDates);

      staleByUser.set(attendance.userId, staleEvents);
    } //END_existingAttendances

    for (const [userId, staleEvents] of staleByUser) {
      for (const [eventId, staleDates] of staleEvents) {
        await db
          .delete(EventAttendance)
          .where(
            and(
              eq(EventAttendance.UserID, userId),
              eq(EventAttendance.eventID, eventId),
              inArray(EventAttendance.eventDate, staleDates),
            ),
          );
      }
    } //END_staleByUser

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

  private isOccurrenceSkipped(
    userId: string,
    eventId: string,
    eventDate: string,
  ): boolean {
    // Deterministic hash so reseeding always gives the same result.
    const key = `${userId}:${eventId}:${eventDate}`;

    let hash = 0;

    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }

    // Roughly 1 in 10 occurrences is skipped.
    return hash % 10 === 0;
  } //END_isOccurrenceSkipped

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

  private getDeterministicModuleSelection(
    userEmail: string,
    seededModules: SeededModule[],
  ): SeededModule[] {
    if (seededModules.length === 0) {
      return [];
    }

    // UserEmails[0] remains enrolled in every module.
    if (userEmail === this.constants.UserEmails[0]) {
      return seededModules;
    }

    // Deterministic seed based on the user's email.
    let seed = 0;

    for (let i = 0; i < userEmail.length; i++) {
      seed = (seed * 31 + userEmail.charCodeAt(i)) >>> 0;
    }

    // Deterministic pseudo-random number generator.
    const random = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };

    // Ensure every user gets between 8 and 12 modules,
    // or all available modules if there are fewer than 8.
    const minModules = Math.min(seededModules.length, 8);
    const maxModules = Math.min(seededModules.length, 12);

    const moduleCount =
      minModules + Math.floor(random() * (maxModules - minModules + 1));

    const shuffled = [...seededModules].sort((a, b) =>
      a.code.localeCompare(b.code),
    );

    // Deterministic Fisher-Yates shuffle.
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));

      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, moduleCount);
  } //END_getDeterministicModuleSelection
} //END_EventsSeedService
