import { ConflictException, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { ParsedEventCandidate } from 'shared-types';
import type { AppDatabase } from '../db/database.service';
import type { EventCriteria } from '../Events/dto/event.types';
import { EventType } from '../Events/dto/event.types';
import { EventImportKeyService } from '../Events/event-import-key.service';
import { Event, EventVenue, UniversityEvent, Venue } from '../entities';
import type { ModuleRecord } from './module-resolver.service';
import {
  normalizeModuleCode,
  truncateForColumn,
} from './pdf-parser-import.utils';

interface ImportedEventShape {
  eventName: string;
  eventCode: string;
  eventCriteria: EventCriteria;
  importKey: string;
}

interface EventCriteriaInput {
  moduleId: string;
  parsedEvent: ParsedEventCandidate;
  primaryVenue?: string;
}

@Injectable()
export class EventImporter {
  constructor(private readonly eventImportKeyService: EventImportKeyService) {}

  async createMissingEvents(
    db: AppDatabase,
    universityId: string,
    parsedEvents: ParsedEventCandidate[],
    moduleByCode: Map<string, ModuleRecord>,
  ): Promise<void> {
    for (const parsedEvent of parsedEvents) {
      const module = moduleByCode.get(
        normalizeModuleCode(parsedEvent.moduleCode),
      );
      if (!module) {
        continue;
      }

      const eventShape = this.buildEventShape(module.moduleID, parsedEvent);
      const existing = await this.findExistingEvent(
        db,
        module.moduleID,
        eventShape,
      );
      if (existing) {
        continue;
      }

      const venueIds = await this.resolveVenueIds(
        db,
        universityId,
        parsedEvent.venues,
      );
      const primaryVenueId = venueIds[0];

      const event = await this.createOrFindEvent(
        db,
        eventShape,
        parsedEvent.isRecurring,
      );

      await db
        .insert(UniversityEvent)
        .values({
          moduleID: module.moduleID,
          eventID: event.eventID,
          VenueID: primaryVenueId,
        })
        .onConflictDoNothing({
          target: [UniversityEvent.moduleID, UniversityEvent.eventID],
        });

      if (venueIds.length > 0) {
        for (const venueId of venueIds) {
          await db
            .insert(EventVenue)
            .values({
              EventID: event.eventID,
              VenueID: venueId,
            })
            .onConflictDoNothing({
              target: [EventVenue.EventID, EventVenue.VenueID],
            });
        }
      }
    }
  }

  private async createOrFindEvent(
    db: AppDatabase,
    eventShape: ImportedEventShape,
    isRecurring: boolean,
  ): Promise<typeof Event.$inferSelect> {
    const [inserted] = await db
      .insert(Event)
      .values({
        eventName: eventShape.eventName,
        eventCode: eventShape.eventCode,
        eventCriteria: eventShape.eventCriteria,
        isRecurring,
        validated: false,
        ImportKey: eventShape.importKey,
      })
      .onConflictDoNothing({
        target: Event.ImportKey,
      })
      .returning();

    if (inserted) {
      return inserted;
    }

    const [existing] = await db
      .select()
      .from(Event)
      .where(eq(Event.ImportKey, eventShape.importKey))
      .limit(1);

    if (!existing) {
      throw new ConflictException('PDF parser event could not be resolved');
    }

    return existing;
  }

  private async findExistingEvent(
    db: AppDatabase,
    moduleId: string,
    eventShape: ImportedEventShape,
  ): Promise<typeof Event.$inferSelect | undefined> {
    const rows = await db
      .select({
        event: Event,
      })
      .from(Event)
      .innerJoin(UniversityEvent, eq(UniversityEvent.eventID, Event.eventID))
      .where(eq(UniversityEvent.moduleID, moduleId));

    return rows.find(({ event }) => this.eventMatchesShape(event, eventShape))
      ?.event;
  }

  private async resolveVenueIds(
    db: AppDatabase,
    universityId: string,
    venueNames: string[],
  ): Promise<string[]> {
    const ids: string[] = [];
    const seenNames = new Set<string>();

    for (const rawName of venueNames) {
      const name = truncateForColumn(rawName.trim(), 30);
      if (!name || seenNames.has(name)) {
        continue;
      }
      seenNames.add(name);

      const [existingVenue] = await db
        .select()
        .from(Venue)
        .where(
          and(eq(Venue.UniversityID, universityId), eq(Venue.VenueName, name)),
        )
        .limit(1);

      if (existingVenue) {
        ids.push(existingVenue.VenueID);
        continue;
      }

      const [venue] = await db
        .insert(Venue)
        .values({
          VenueName: name,
          UniversityID: universityId,
        })
        .onConflictDoNothing({
          target: [Venue.UniversityID, Venue.VenueName],
        })
        .returning();

      if (venue) {
        ids.push(venue.VenueID);
        continue;
      }

      const [conflictingVenue] = await db
        .select()
        .from(Venue)
        .where(
          and(eq(Venue.UniversityID, universityId), eq(Venue.VenueName, name)),
        )
        .limit(1);

      if (conflictingVenue) {
        ids.push(conflictingVenue.VenueID);
      }
    }

    return ids;
  }

  private buildEventShape(
    moduleId: string,
    parsedEvent: ParsedEventCandidate,
  ): ImportedEventShape {
    const primaryVenue = parsedEvent.venues[0]?.trim();
    const eventName = truncateForColumn(
      parsedEvent.title.trim() ||
        `${normalizeModuleCode(parsedEvent.moduleCode)} ${parsedEvent.type}`,
      32,
    );
    const eventCode = truncateForColumn(
      parsedEvent.sectionLabel.trim() || parsedEvent.type,
      10,
    );
    const eventCriteria = this.buildEventCriteria({
      moduleId,
      parsedEvent,
      primaryVenue,
    });

    return {
      eventName,
      eventCode,
      eventCriteria,
      importKey: this.eventImportKeyService.buildForModuleEvent({
        moduleId: moduleId,
        eventName: eventName,
        eventCode: eventCode,
        eventCriteria: eventCriteria,
      }),
    };
  }

  private buildEventCriteria(input: EventCriteriaInput): EventCriteria {
    const criteria: EventCriteria = {
      type: EventType.UNIVERSITY,
      date: input.parsedEvent.date ?? input.parsedEvent.day ?? '',
      startTime: input.parsedEvent.startTime,
      endTime: input.parsedEvent.endTime,
      moduleID: input.moduleId,
    };

    if (input.primaryVenue) {
      criteria.venue = truncateForColumn(input.primaryVenue, 30);
    }

    return criteria;
  }

  private eventMatchesShape(
    event: typeof Event.$inferSelect,
    eventShape: ImportedEventShape,
  ): boolean {
    return (
      event.eventName === eventShape.eventName &&
      (event.eventCode ?? '') === eventShape.eventCode &&
      event.eventCriteria.moduleID === eventShape.eventCriteria.moduleID &&
      event.eventCriteria.date === eventShape.eventCriteria.date &&
      event.eventCriteria.startTime === eventShape.eventCriteria.startTime &&
      event.eventCriteria.endTime === eventShape.eventCriteria.endTime &&
      (event.eventCriteria.venue ?? '') ===
        (eventShape.eventCriteria.venue ?? '')
    );
  }
}
