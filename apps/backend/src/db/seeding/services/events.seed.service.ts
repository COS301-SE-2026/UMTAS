import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import {
  Event,
  ModuleTeaches,
  NfcTag,
  UniversityEvent,
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
import { SeedQueryService } from './seed-query.service';
import { getDeterministicPatterns } from '../Constants';
import {
  DEFAULT_ATTENDANCE_TIME_ZONE,
  localDateAt,
} from '../../../Attendance/attendance-occurrence';

@Injectable()
export class EventsSeedService extends BaseSeedService {
  constructor(
    private readonly persistence: SeedPersistenceService,
    private readonly query: SeedQueryService,
  ) {
    super();
  }

  async seed(db: AppDatabase): Promise<void> {
    const university = await this.query.getUniversityIDByName(db, 'Pretoria');

    if (!university) {
      this.logger.warn(
        'University of Pretoria is missing; skipping module events',
      );
      return;
    }

    const codes = this.constants.ALL_SEED_MODULES.map((module) => module.Code);

    const modulesByCode = await this.getSeededModulesByCode(db, codes);

    let eventsCreated = 0;
    let relationshipsCreated = 0;

    for (const code of codes) {
      const module = modulesByCode.get(code);

      if (!module) {
        this.logger.warn(`Module [${code}] missing; skipping events`);
        continue;
      }

      const result = await this.seedModuleEvents(db, code, module.id);

      eventsCreated += result.eventsCreated;
      relationshipsCreated += result.relationshipsCreated;
    }

    await this.seedAttendanceConflictDemo(db, modulesByCode, codes, university);

    this.logResult('Hatfield recurring module events', eventsCreated);
    this.logResult('module event relationships', relationshipsCreated);
    this.logger.debug(`Module events scoped to university ${university}`);
  } //END_seed

  private async seedAttendanceConflictDemo(
    db: AppDatabase,
    modulesByCode: Map<string, { id: string; code: string }>,
    codes: string[],
    universityId: string,
  ): Promise<void> {
    const lecturerEmail = this.constants.UserEmails[1];
    const [lecturer] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, lecturerEmail))
      .limit(1);
    const demoModules = codes
      .map((code) => modulesByCode.get(code))
      .filter(
        (module): module is { id: string; code: string } =>
          module !== undefined,
      )
      .slice(0, 2);

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

    await db
      .insert(NfcTag)
      .values({
        tagId: '00000000-0000-4000-8000-0000000000a1',
        ownerUserId: lecturer.id,
        universityId,
        tokenHash: createHash('sha256')
          .update('attendance-conflict-demo-token')
          .digest('hex'),
      })
      .onConflictDoNothing();

    const date = localDateAt(
      new Date(),
      process.env.ATTENDANCE_TIME_ZONE ?? DEFAULT_ATTENDANCE_TIME_ZONE,
    );

    for (const [index, module] of demoModules.entries()) {
      const importFingerprint = EventsSeedService.fingerprint(
        'attendance-conflict-demo',
        String(index + 1),
      );
      const eventName = `Attendance demo ${index + 1}`;
      const criteria: UniversityEventCriteria = {
        eventSource: EventSource.UNIVERSITY,
        moduleId: module.id,
        activityType: 'lecture',
        date,
        startTime: '00:00',
        endTime: '23:59',
      };

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
                isRecurring: false,
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
            isRecurring: false,
            validated: true,
          })
          .where(eq(Event.eventID, eventId));
      }
      await this.ensureModuleEventRelationship(db, eventId, module.id);
    }

    this.logger.log(
      `Seeded attendance conflict demo for ${lecturerEmail} on ${date}`,
    );
  }

  private async seedModuleEvents(
    db: AppDatabase,
    code: string,
    moduleId: string,
  ): Promise<{
    eventsCreated: number;
    relationshipsCreated: number;
  }> {
    let eventsCreated = 0;
    let relationshipsCreated = 0;

    for (const pattern of getDeterministicPatterns(code)) {
      const result = await this.getOrCreateModuleEvent(
        db,
        code,
        moduleId,
        pattern,
      );

      if (!result.eventId) {
        continue;
      }

      if (result.created) {
        eventsCreated++;
      }

      const relationshipCreated = await this.ensureModuleEventRelationship(
        db,
        result.eventId,
        moduleId,
      );

      if (relationshipCreated) {
        relationshipsCreated++;
      }
    }

    return {
      eventsCreated,
      relationshipsCreated,
    };
  }

  private async getSeededModulesByCode(
    db: AppDatabase,
    codes: string[],
  ): Promise<Map<string, { id: string; code: string }>> {
    const seededModules = await db
      .select({
        id: modules.moduleID,
        code: modules.moduleCode,
      })
      .from(modules)
      .where(inArray(modules.moduleCode, codes));

    return new Map(seededModules.map((module) => [module.code, module]));
  }

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
  }

  private async getOrCreateModuleEvent(
    db: AppDatabase,
    code: string,
    moduleId: string,
    pattern: ReturnType<typeof getDeterministicPatterns>[number],
  ): Promise<{
    eventId: string;
    created: boolean;
  }> {
    const eventName = `${code} ${pattern.label}`;

    const criteria: UniversityEventCriteria = {
      eventSource: EventSource.UNIVERSITY,
      moduleId,
      activityType: pattern.activityType,
      dayOfWeek: pattern.dayOfWeek,
      startTime: pattern.startTime,
      endTime: pattern.endTime,
    };

    const fingerprint = this.fingerprint(
      moduleId,
      pattern.activityType,
      pattern.dayOfWeek,
      pattern.startTime,
      pattern.endTime,
      eventName,
    );

    const [existing] = await db
      .select({ id: Event.eventID })
      .from(Event)
      .where(eq(Event.importFingerprint, fingerprint))
      .limit(1);

    if (existing) {
      return {
        eventId: existing.id,
        created: false,
      };
    }

    const [created] = await this.persistence.insertEvents(db, [
      {
        eventName,
        activityCode: code,
        activityType: pattern.activityType,
        eventCriteria: criteria,
        isRecurring: true,
        importFingerprint: fingerprint,
      },
    ]);

    if (!created) {
      return {
        eventId: '',
        created: false,
      };
    }

    return {
      eventId: created.eventID,
      created: true,
    };
  }

  static fingerprint(...parts: string[]): string {
    const hash = createHash('sha256');
    for (const part of parts) {
      hash.update(`${part.length}:`);
      hash.update(part);
    }
    return hash.digest('hex');
  }

  private fingerprint(...parts: string[]): string {
    return EventsSeedService.fingerprint(...parts);
  }
} //END_EventsSeedService
