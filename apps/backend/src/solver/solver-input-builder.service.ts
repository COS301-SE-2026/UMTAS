import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
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
  Course,
  GroupModules,
  ModuleEnrollment,
  ModuleGrouping,
  UniversityRole,
  UniversityEvent,
  Venue,
  modules,
  parseJob,
  usersTable,
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

  async buildForProfile(
    userId: string,
    solverProfileKey: string,
    preferences: SolverPreferences = { heuristics: [] },
  ): Promise<SolverInput> {
    const rows = await this.loadProfileEvents(userId, solverProfileKey);
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
      preferences,
    });
    if (!result.success) {
      throw new ConflictException({
        message: `Solver profile contains invalid scheduling data: ${solverProfileKey}`,
        issues: result.error.issues,
      });
    }

    return result.data;
  }

  private async loadProfileEvents(userId: string, profileKey: string) {
    if (profileKey === 'default') {
      return this.baseEventQuery()
        .innerJoin(
          ModuleEnrollment,
          eq(ModuleEnrollment.ModuleID, modules.moduleID),
        )
        .where(eq(ModuleEnrollment.UserID, userId));
    }

    if (!UUID_PATTERN.test(profileKey)) {
      throw new ConflictException(
        `Unsupported solver profile key: ${profileKey}`,
      );
    }

    await this.assertProfileAccess(userId, profileKey);

    return this.baseEventQuery()
      .innerJoin(GroupModules, eq(GroupModules.ModuleID, modules.moduleID))
      .where(eq(GroupModules.GroupID, profileKey));
  }

  private async assertProfileAccess(
    userId: string,
    profileKey: string,
  ): Promise<void> {
    const [profile] = await this.databaseService.db
      .select({ id: ModuleGrouping.GroupID })
      .from(ModuleGrouping)
      .where(eq(ModuleGrouping.GroupID, profileKey))
      .limit(1);
    if (!profile) {
      throw new NotFoundException(`Solver profile not found: ${profileKey}`);
    }

    const [systemAdmin] = await this.databaseService.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(and(eq(usersTable.id, userId), eq(usersTable.role, 'sys_admin')))
      .limit(1);
    if (systemAdmin) {
      return;
    }

    const groupedModules = await this.databaseService.db
      .select({ moduleId: GroupModules.ModuleID })
      .from(GroupModules)
      .where(eq(GroupModules.GroupID, profileKey));
    if (groupedModules.length > 0) {
      const enrolledModules = await this.databaseService.db
        .select({ moduleId: ModuleEnrollment.ModuleID })
        .from(GroupModules)
        .innerJoin(
          ModuleEnrollment,
          eq(ModuleEnrollment.ModuleID, GroupModules.ModuleID),
        )
        .where(
          and(
            eq(GroupModules.GroupID, profileKey),
            eq(ModuleEnrollment.UserID, userId),
          ),
        );
      if (enrolledModules.length === groupedModules.length) {
        return;
      }
    }

    const [courseUniversities, parserUniversities] = await Promise.all([
      this.databaseService.db
        .select({ universityId: Course.UniversityID })
        .from(Course)
        .where(eq(Course.GroupID, profileKey)),
      this.databaseService.db
        .select({ universityId: parseJob.UniversityID })
        .from(parseJob)
        .where(eq(parseJob.GroupID, profileKey)),
    ]);
    const universityIds = Array.from(
      new Set(
        [...courseUniversities, ...parserUniversities].map(
          ({ universityId }) => universityId,
        ),
      ),
    );
    if (universityIds.length > 0) {
      const [universityRole] = await this.databaseService.db
        .select({ universityId: UniversityRole.UniversityID })
        .from(UniversityRole)
        .where(
          and(
            eq(UniversityRole.UserID, userId),
            inArray(UniversityRole.UniversityID, universityIds),
            inArray(UniversityRole.role, AUTHORIZED_UNIVERSITY_ROLES),
          ),
        )
        .limit(1);
      if (universityRole) {
        return;
      }
    }

    throw new NotFoundException(`Solver profile not found: ${profileKey}`);
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

const AUTHORIZED_UNIVERSITY_ROLES = [
  'STUDENT',
  'STUDENT_OWNED',
  'UNIVERSITY_ADMIN',
  'LECTURER',
  'SYSTEM_ADMIN',
] as const;
