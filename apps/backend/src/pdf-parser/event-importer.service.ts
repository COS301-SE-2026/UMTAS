import { ConflictException, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { ParsedEventCandidate } from 'shared-types';
import type { AppDatabase } from '../db/database.service';
import type { EventCriteria } from '../Events/dto/event.types';
import { EventType } from '../Events/dto/event.types';
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
}

interface EventCriteriaInput {
  moduleId: string;
  parsedEvent: ParsedEventCandidate;
  primaryVenue?: string;
}

@Injectable()
export class EventImporter {
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

      const [event] = await db
        .insert(Event)
        .values({
          eventName: eventShape.eventName,
          eventCode: eventShape.eventCode,
          eventCriteria: eventShape.eventCriteria,
          isRecurring: parsedEvent.isRecurring,
          validated: false,
        })
        .returning();

      if (!event) {
        throw new ConflictException('PDF parser event could not be created');
      }

      await db.insert(UniversityEvent).values({
        moduleID: module.moduleID,
        eventID: event.eventID,
        VenueID: primaryVenueId,
      });

      if (venueIds.length > 0) {
        await db.insert(EventVenue).values(
          venueIds.map((venueId) => ({
            EventID: event.eventID,
            VenueID: venueId,
          })),
        );
      }
    }
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
        .returning();

      if (venue) {
        ids.push(venue.VenueID);
      }
    }

    return ids;
  }

  private buildEventShape(
    moduleId: string,
    parsedEvent: ParsedEventCandidate,
  ): ImportedEventShape {
    const primaryVenue = parsedEvent.venues[0]?.trim();

    return {
      eventName: truncateForColumn(
        parsedEvent.title.trim() ||
          `${normalizeModuleCode(parsedEvent.moduleCode)} ${parsedEvent.type}`,
        32,
      ),
      eventCode: truncateForColumn(
        parsedEvent.sectionLabel.trim() || parsedEvent.type,
        10,
      ),
      eventCriteria: this.buildEventCriteria({
        moduleId,
        parsedEvent,
        primaryVenue,
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
