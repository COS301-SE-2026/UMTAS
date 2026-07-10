import { ConflictException, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { ParsedEventCandidate } from 'shared-types';
import type { AppDatabase } from '../db/database.service';
import type { EventCriteria } from '../Events/dto/event.types';
import { EventSource } from '../Events/dto/event.types';
import { EventImportFingerprintService } from '../Events/event-import-fingerprint.service';
import { Event, EventVenue, UniversityEvent, Venue } from '../entities';
import type { ModuleRecord } from './module-resolver.service';
import {
  normalizeModuleCode,
  truncateForColumn,
} from './pdf-parser-import.utils';

interface ImportedEventShape {
  eventName: string;
  activityType: string;
  activityCode: string;
  eventCriteria: EventCriteria;
  importFingerprint: string;
}

interface EventCriteriaInput {
  moduleId: string;
  parsedEvent: ParsedEventCandidate;
}

@Injectable()
export class EventImporter {
  constructor(
    private readonly eventImportFingerprintService: EventImportFingerprintService,
  ) {}

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
      const venueIds = await this.resolveVenueIds(
        db,
        universityId,
        parsedEvent.venues,
      );
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
        activityType: eventShape.activityType,
        activityCode: eventShape.activityCode,
        eventCriteria: eventShape.eventCriteria,
        isRecurring,
        validated: false,
        importFingerprint: eventShape.importFingerprint,
      })
      .onConflictDoNothing({
        target: Event.importFingerprint,
      })
      .returning();

    if (inserted) {
      return inserted;
    }

    const [existing] = await db
      .select()
      .from(Event)
      .where(eq(Event.importFingerprint, eventShape.importFingerprint))
      .limit(1);

    if (!existing) {
      throw new ConflictException('PDF parser event could not be resolved');
    }

    return existing;
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
    const eventName = truncateForColumn(
      parsedEvent.title.trim() ||
        `${normalizeModuleCode(parsedEvent.moduleCode)} ${parsedEvent.activityType}`,
      32,
    );
    const activityCode = truncateForColumn(
      parsedEvent.activityCode.trim() || parsedEvent.activityType,
      10,
    );
    const eventCriteria = this.buildEventCriteria({
      moduleId,
      parsedEvent,
    });

    return {
      eventName,
      activityType: parsedEvent.activityType,
      activityCode,
      eventCriteria,
      importFingerprint: this.eventImportFingerprintService.buildForModuleEvent(
        {
          moduleId: moduleId,
          activityType: parsedEvent.activityType,
          activityCode,
          eventCriteria: eventCriteria,
          venueNames: parsedEvent.venues,
        },
      ),
    };
  }

  private buildEventCriteria(input: EventCriteriaInput): EventCriteria {
    const criteria: EventCriteria = {
      eventSource: EventSource.UNIVERSITY,
      startTime: input.parsedEvent.startTime,
      endTime: input.parsedEvent.endTime,
      moduleId: input.moduleId,
    };

    if (input.parsedEvent.isRecurring)
      criteria.dayOfWeek = normalizeDayOfWeek(input.parsedEvent.day);
    else criteria.date = input.parsedEvent.date ?? undefined;

    return criteria;
  }
}

function normalizeDayOfWeek(
  day: string | null,
): import('../Events/dto/event.types').DayOfWeek {
  const value = day?.trim().toLowerCase();
  const aliases: Record<string, import('../Events/dto/event.types').DayOfWeek> =
    {
      mon: 'monday',
      monday: 'monday',
      tue: 'tuesday',
      tues: 'tuesday',
      tuesday: 'tuesday',
      wed: 'wednesday',
      wednesday: 'wednesday',
      thu: 'thursday',
      thur: 'thursday',
      thurs: 'thursday',
      thursday: 'thursday',
      fri: 'friday',
      friday: 'friday',
      sat: 'saturday',
      saturday: 'saturday',
      sun: 'sunday',
      sunday: 'sunday',
    };
  if (!value || !aliases[value])
    throw new ConflictException(
      `Parser emitted an invalid weekday: ${day ?? ''}`,
    );
  return aliases[value];
}
