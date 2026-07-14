import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { join } from 'node:path';
import type * as schema from '../db/schema';
import { DatabaseService } from '../db/database.service';
import { EventSource } from '../Events/dto/event.types';
import {
  Event,
  EventVenue,
  GroupModules,
  ModuleGrouping,
  University,
  UniversityEvent,
  Venue,
  modules,
} from '../entities';
import { SolverInputBuilderService } from './solver-input-builder.service';
import { SolverJobStoreService } from './solver-job-store.service';

describe('Solver input builder (PGLite)', () => {
  let databaseService: DatabaseService;
  let builder: SolverInputBuilderService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DatabaseService,
        SolverJobStoreService,
        SolverInputBuilderService,
        {
          provide: ConfigService,
          useValue: new ConfigService({ DB_MODE: 'PGLITE' }),
        },
      ],
    }).compile();

    databaseService = moduleRef.get(DatabaseService);
    builder = moduleRef.get(SolverInputBuilderService);
    await migratePglite(toPgliteDatabase(databaseService), {
      migrationsFolder: join(process.cwd(), 'drizzle'),
    });
  });

  afterAll(async () => {
    await databaseService?.onModuleDestroy();
  });

  it('builds shared-contract input from imported events in a module grouping', async () => {
    const universityId = '00000000-0000-4000-8000-000000000001';
    const moduleId = '00000000-0000-4000-8000-000000000002';
    const groupId = '00000000-0000-4000-8000-000000000003';
    const eventId = '00000000-0000-4000-8000-000000000004';
    const venueId = '00000000-0000-4000-8000-000000000005';

    await databaseService.db.insert(University).values({
      UniversityID: universityId,
      UniversityName: 'Solver Test University',
    });
    await databaseService.db.insert(modules).values({
      moduleID: moduleId,
      moduleCode: 'CS101',
      moduleName: 'Computer Science 101',
    });
    await databaseService.db
      .insert(ModuleGrouping)
      .values({ GroupID: groupId });
    await databaseService.db.insert(GroupModules).values({
      GroupID: groupId,
      ModuleID: moduleId,
    });
    await databaseService.db.insert(Event).values({
      eventID: eventId,
      eventName: 'CS101 Lecture',
      activityType: 'lecture',
      activityCode: 'L1',
      eventCriteria: {
        eventSource: EventSource.UNIVERSITY,
        moduleId,
        dayOfWeek: 'monday',
        startTime: '08:00',
        endTime: '09:30',
      },
      isRecurring: true,
    });
    await databaseService.db.insert(UniversityEvent).values({
      moduleID: moduleId,
      eventID: eventId,
    });
    await databaseService.db.insert(Venue).values({
      VenueID: venueId,
      VenueName: 'IT 4-1',
      UniversityID: universityId,
    });
    await databaseService.db.insert(EventVenue).values({
      EventID: eventId,
      VenueID: venueId,
    });
    await expect(builder.buildForProfile(groupId)).resolves.toEqual({
      schedulingProblem: {
        events: [
          {
            eventId,
            moduleCode: 'CS101',
            activityType: 'lecture',
            activityCode: 'L1',
            requiredSelections: 1,
            dayOfWeek: 'monday',
            startTime: '08:00',
            endTime: '09:30',
            venues: [{ id: venueId, name: 'IT 4-1' }],
          },
        ],
      },
      preferences: { heuristics: [] },
    });
  });

  it('rejects unknown jobs and unsupported profile keys', async () => {
    await expect(builder.build('missing-job')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    await expect(
      builder.buildForProfile('not-a-profile'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

function toPgliteDatabase(
  databaseService: DatabaseService,
): PgliteDatabase<typeof schema> {
  if (!databaseService.pglite) {
    throw new Error('Expected PGLite database service for solver input test');
  }

  return databaseService.db;
}
