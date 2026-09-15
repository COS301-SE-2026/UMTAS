import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { Event, UniversityEvent, modules } from '../../../entities';
import type { AppDatabase } from '../../database.service';
import { BaseSeedService } from '../base.seed.service';
import { SeedPersistenceService } from '../seed-persistence.service';
import {
  EventSource,
  type UniversityEventCriteria,
} from '../../../Events/dto/event.types';
import { SeedQueryService } from './seed-query.service';
import { getDeterministicPatterns } from '../Constants';

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

    //get module codes from constants
    const codes = this.constants.ALL_SEED_MODULES.map((module) => module.Code);

    //Fetch seeded modules
    const seededModules = await db
      .select({ id: modules.moduleID, code: modules.moduleCode })
      .from(modules)
      .where(inArray(modules.moduleCode, codes));

    //Map code to module id
    const modulesByCode = new Map(
      seededModules.map((module) => [module.code, module]),
    );

    let eventsCreated = 0;
    let relationshipsCreated = 0;

    for (const code of codes) {
      const module = modulesByCode.get(code);
      if (!module) {
        this.logger.warn(`Module [${code}] missing; skipping events`);
        continue;
      }

      // hash-based deterministic patterns
      const patterns = getDeterministicPatterns(code);

      for (const pattern of patterns) {
        const eventName = `${code} ${pattern.label}`;
        const criteria: UniversityEventCriteria = {
          eventSource: EventSource.UNIVERSITY,
          moduleId: module.id,
          activityType: pattern.activityType,
          dayOfWeek: pattern.dayOfWeek,
          startTime: pattern.startTime,
          endTime: pattern.endTime,
        };

        const fingerprint = this.fingerprint(
          module.id,
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

        const event =
          existing ??
          (
            await this.persistence.insertEvents(db, [
              {
                eventName,
                activityCode: code,
                activityType: pattern.activityType,
                eventCriteria: criteria,
                isRecurring: true,
                importFingerprint: fingerprint,
              },
            ])
          )[0];

        if (!event) continue;
        if (!existing) eventsCreated++;

        //Link event to relevant module
        const [relationship] = await db
          .select({ id: UniversityEvent.UniversityEventID })
          .from(UniversityEvent)
          .where(
            and(
              eq(UniversityEvent.eventID, event.id),
              eq(UniversityEvent.moduleID, module.id),
            ),
          )
          .limit(1);

        if (!relationship) {
          await this.persistence.insertUniversityEvents(db, [
            { eventID: event.id, moduleID: module.id },
          ]);
          relationshipsCreated++;
        }
      } //END_pattern
    } //END_code

    this.logResult('Hatfield recurring module events', eventsCreated);
    this.logResult('module event relationships', relationshipsCreated);
    this.logger.debug(`Module events scoped to university ${university}`);
  } //END_seed

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
