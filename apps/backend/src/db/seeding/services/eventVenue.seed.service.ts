import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { Event, EventVenue, Venue, modules } from '../../../entities';
import type { AppDatabase } from '../../database.service';
import { BaseSeedService } from '../base.seed.service';
import { SeedPersistenceService } from '../seed-persistence.service';
import { getDeterministicPatterns } from '../Constants';
import { EventsSeedService } from './events.seed.service';
import { SeedQueryService } from './seed-query.service';

@Injectable()
export class EventVenuesSeedService extends BaseSeedService {
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
        'University of Pretoria is missing; skipping EventVenue seeding',
      );
      return;
    }

    const codes = this.constants.ALL_SEED_MODULES.map((module) => module.Code);
    const moduleRows = await db
      .select({ id: modules.moduleID, code: modules.moduleCode })
      .from(modules)
      .where(inArray(modules.moduleCode, codes));
    const modulesByCode = new Map(
      moduleRows.map((module) => [module.code, module]),
    );
    const venueRows = await db
      .select({ id: Venue.VenueID, name: Venue.VenueName })
      .from(Venue)
      .where(eq(Venue.UniversityID, university));
    const venuesByName = new Map(
      venueRows.map((venue) => [venue.name, venue.id]),
    );

    let linked = 0;
    for (const code of codes) {
      //Get moduleCode
      const module = modulesByCode.get(code);
      if (!module) {
        this.logger.warn(`Module [${code}] missing; skipping EventVenue links`);
        continue;
      }

      //pattern maps event to venue
      for (const pattern of getDeterministicPatterns(code)) {
        //Get venueId
        const venueId = venuesByName.get(pattern.venueName);
        if (!venueId) {
          this.logger.warn(
            `Venue [${pattern.venueName}] missing; cannot link [${code} ${pattern.label}]`,
          );
          continue;
        }

        const eventName = `${code} ${pattern.label}`;
        const fingerprint = EventsSeedService.fingerprint(
          module.id,
          pattern.activityType,
          pattern.dayOfWeek,
          pattern.startTime,
          pattern.endTime,
          eventName,
        );

        //Fetch event
        const [event] = await db
          .select({ id: Event.eventID })
          .from(Event)
          .where(eq(Event.importFingerprint, fingerprint))
          .limit(1);

        if (!event) {
          this.logger.warn(
            `Event [${eventName}] is missing; cannot link venue`,
          );
          continue;
        }

        //Check if already linked
        const [existing] = await db
          .select({ eventId: EventVenue.EventID })
          .from(EventVenue)
          .where(
            and(
              eq(EventVenue.EventID, event.id),
              eq(EventVenue.VenueID, venueId),
            ),
          )
          .limit(1);

        if (!existing) {
          await this.persistence.insertEventVenues(db, [
            { EventID: event.id, VenueID: venueId },
          ]);
          linked += 1;
        }
      } //END_pattern
    } //END_code

    this.logResult('EventVenue links', linked);
  } //END_seed
} //END_EventVenuesSeedService
