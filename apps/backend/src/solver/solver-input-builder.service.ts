import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import {
  SolverInputSchema,
  type ActivityType,
  type DayOfWeek,
  type SolverInput,
  type SolverPreferences,
} from 'shared-types';
import { DatabaseService } from '../db/database.service';
import type { UniversityEventCriteria } from '../Events/dto/event.types';
import {
  Event,
  EventVenue,
  UniversityEvent,
  Venue,
  modules,
} from '../entities';
import { SolverJobStoreService } from './solver-job-store.service';

@Injectable()
export class SolverInputBuilderService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jobStore: SolverJobStoreService,
  ) {}

  async build(jobId: string): Promise<SolverInput> {
    const job = await this.jobStore.findJob(jobId);
    if (!job) {
      throw new NotFoundException(`Solver job not found: ${jobId}`);
    }

    return job.input;
  }

  async buildForSubmission(
    userId: string,
    eventIds?: string[],
    preferences: SolverPreferences = { heuristics: [] },
  ): Promise<SolverInput> {
    validateExplicitEventIds(eventIds);
    const rows = await this.loadSubmissionEvents(userId, eventIds);
    if (eventIds !== undefined) {
      const loadedEventIds = new Set(rows.map(({ eventId }) => eventId));
      if (
        loadedEventIds.size !== eventIds.length ||
        eventIds.some((eventId) => !loadedEventIds.has(eventId))
      ) {
        throw new NotFoundException(
          'One or more selected events were not found',
        );
      }
    }

    const eventsById = new Map<string, SolverEventInput>();

    for (const row of rows) {
      const criteria = row.eventCriteria as UniversityEventCriteria;
      let event = eventsById.get(row.eventId);
      if (!event) {
        event = {
          eventId: row.eventId,
          moduleCode: row.moduleCode,
          activityType: row.activityType as ActivityType,
          activityCode: row.activityCode ?? '',
          requiredSelections:
            criteria.activityRequirements?.[row.activityCode ?? '']
              ?.requiredSelections ?? 1,
          startTime: criteria.startTime,
          endTime: criteria.endTime,
          venues: [],
        };
        if (criteria.date) event.date = criteria.date;
        if (criteria.dayOfWeek) event.dayOfWeek = criteria.dayOfWeek;
        eventsById.set(row.eventId, event);
      }

      if (row.venueId && row.venueName) {
        event.venues.push({ id: row.venueId, name: row.venueName });
      }
    }

    const events = [...eventsById.values()]
      .map((event) => ({
        ...event,
        venues: event.venues.sort((first, second) =>
          first.id.localeCompare(second.id),
        ),
      }))
      .sort((first, second) => first.eventId.localeCompare(second.eventId));
    const result = SolverInputSchema.safeParse({
      schedulingProblem: { events },
      preferences,
    });
    if (!result.success) {
      throw new ConflictException({
        message:
          eventIds === undefined
            ? 'Enrollment contains invalid scheduling data'
            : 'Selected events contain invalid scheduling data',
        issues: result.error.issues,
      });
    }

    return result.data;
  }
  //Moving away from forced enrollment checks for now. We just use the ids given
  private loadSubmissionEvents(userId: string, eventIds?: string[]) {
    return this.baseEventQuery().where(
      eventIds ? inArray(Event.eventID, eventIds) : undefined,
    );
  }

  private baseEventQuery() {
    return this.databaseService.db
      .select({
        eventId: Event.eventID,
        moduleCode: modules.moduleCode,
        activityType: Event.activityType,
        activityCode: Event.activityCode,
        eventCriteria: Event.eventCriteria,
        venueId: Venue.VenueID,
        venueName: Venue.VenueName,
      })
      .from(UniversityEvent)
      .innerJoin(Event, eq(Event.eventID, UniversityEvent.eventID))
      .innerJoin(modules, eq(modules.moduleID, UniversityEvent.moduleID))
      .leftJoin(EventVenue, eq(EventVenue.EventID, Event.eventID))
      .leftJoin(Venue, eq(Venue.VenueID, EventVenue.VenueID));
  }
}

interface SolverEventInput {
  eventId: string;
  moduleCode: string;
  activityType: ActivityType;
  activityCode: string;
  requiredSelections: number;
  date?: string;
  dayOfWeek?: DayOfWeek;
  startTime: string;
  endTime: string;
  venues: Array<{ id: string; name: string }>;
}

function validateExplicitEventIds(eventIds?: string[]): void {
  if (eventIds === undefined) return;
  if (
    !Array.isArray(eventIds) ||
    eventIds.length === 0 ||
    new Set(eventIds).size !== eventIds.length ||
    eventIds.some((eventId) => !UUID_PATTERN.test(eventId))
  ) {
    throw new BadRequestException(
      'Explicit event selection must contain unique UUIDs',
    );
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
