import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  SolverInputSchema,
  type ActivityType,
  type DayOfWeek,
  type SolverInput,
} from 'shared-types';
import { DatabaseService } from '../db/database.service';
import type { UniversityEventCriteria } from '../Events/dto/event.types';
import {
  Event,
  EventVenue,
  GroupModules,
  ModuleGrouping,
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

    const rows = await this.loadProfileEvents(job.solverProfileKey);
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

    const result = SolverInputSchema.safeParse({
      schedulingProblem: { events: [...eventsById.values()] },
      preferences: { heuristics: [] },
    });
    if (!result.success) {
      throw new ConflictException({
        message: `Solver profile contains invalid scheduling data: ${job.solverProfileKey}`,
        issues: result.error.issues,
      });
    }

    return result.data;
  }

  private async loadProfileEvents(profileKey: string) {
    if (profileKey === 'default') {
      return this.baseEventQuery();
    }

    if (!UUID_PATTERN.test(profileKey)) {
      throw new ConflictException(
        `Unsupported solver profile key: ${profileKey}`,
      );
    }

    const [group] = await this.databaseService.db
      .select({ id: ModuleGrouping.GroupID })
      .from(ModuleGrouping)
      .where(eq(ModuleGrouping.GroupID, profileKey))
      .limit(1);
    if (!group) {
      throw new NotFoundException(`Solver profile not found: ${profileKey}`);
    }

    return this.baseEventQuery()
      .innerJoin(GroupModules, eq(GroupModules.ModuleID, modules.moduleID))
      .where(eq(GroupModules.GroupID, profileKey));
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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
