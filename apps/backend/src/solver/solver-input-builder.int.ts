import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { join } from 'node:path';
import type * as schema from '../db/schema';
import { DatabaseService } from '../db/database.service';
import { EventSource } from '../Events/dto/event.types';
import {
  Event,
  ModuleEnrollment,
  UniversityEvent,
  modules,
  usersTable,
} from '../entities';
import { SolverInputBuilderService } from './solver-input-builder.service';
import { SolverJobStoreService } from './solver-job-store.service';

const userId = '00000000-0000-4000-8000-000000000010';
const otherUserId = '00000000-0000-4000-8000-000000000011';
const enrolledModuleId = '00000000-0000-4000-8000-000000000002';
const otherModuleId = '00000000-0000-4000-8000-000000000003';
const firstEventId = '00000000-0000-4000-8000-000000000004';
const secondEventId = '00000000-0000-4000-8000-000000000005';
const inaccessibleEventId = '00000000-0000-4000-8000-000000000006';
const invalidEventId = '00000000-0000-4000-8000-000000000008';

describe('Solver input builder (PGLite)', () => {
  let databaseService: DatabaseService;
  let builder: SolverInputBuilderService;
  let jobStore: SolverJobStoreService;

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
    jobStore = moduleRef.get(SolverJobStoreService);
    await migratePglite(toPgliteDatabase(databaseService), {
      migrationsFolder: join(process.cwd(), 'drizzle'),
    });
    await seedSchedulingData();
  });

  afterAll(async () => {
    await databaseService?.onModuleDestroy();
  });

  it('loads exactly an explicit enrolled selection in canonical order', async () => {
    const reverse = await builder.buildForSubmission(userId, [
      secondEventId,
      firstEventId,
    ]);
    const forward = await builder.buildForSubmission(userId, [
      firstEventId,
      secondEventId,
    ]);

    expect(reverse).toEqual(forward);
    expect(
      reverse.schedulingProblem.events.map(({ eventId }) => eventId),
    ).toEqual([firstEventId, secondEventId]);
  });

  it.each([[[]], [[firstEventId, firstEventId]], [['not-a-uuid']]])(
    'rejects invalid explicit arrays before querying',
    async (eventIds) => {
      await expect(
        builder.buildForSubmission(userId, eventIds),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('reports invalid persisted scheduling data for the selected event set', async () => {
    await databaseService.db.insert(Event).values({
      eventID: invalidEventId,
      eventName: 'Invalid event',
      activityType: 'lecture',
      activityCode: 'BAD',
      eventCriteria: {
        eventSource: EventSource.UNIVERSITY,
        moduleId: enrolledModuleId,
        startTime: '10:00',
        endTime: '09:00',
      },
      isRecurring: false,
    });
    await databaseService.db.insert(UniversityEvent).values({
      moduleID: enrolledModuleId,
      eventID: invalidEventId,
    });

    await expect(
      builder.buildForSubmission(userId, [invalidEventId]),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns the immutable input stored with a worker job', async () => {
    const input = await builder.buildForSubmission(userId, [firstEventId]);
    const reservation = await jobStore.reserveOrReuse({
      userId,
      solveMode: 'feasibility',
      requestedEngine: 'auto',
      deduplicationKey: `solver-semantic-sha256-v2:${'f'.repeat(64)}`,
      solverInput: input,
    });

    await expect(builder.build(reservation.record.jobId)).resolves.toEqual(
      input,
    );
    await expect(builder.build('missing-job')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  async function seedSchedulingData(): Promise<void> {
    await databaseService.db.insert(usersTable).values([
      {
        id: userId,
        name: 'Solver User',
        email: 'solver-input-owner@example.com',
      },
      {
        id: otherUserId,
        name: 'Other Solver User',
        email: 'solver-input-other@example.com',
      },
    ]);
    await databaseService.db.insert(modules).values([
      {
        moduleID: enrolledModuleId,
        moduleCode: 'CS101',
        moduleName: 'Computer Science 101',
      },
      {
        moduleID: otherModuleId,
        moduleCode: 'CS999',
        moduleName: 'Other module',
      },
    ]);
    await databaseService.db.insert(ModuleEnrollment).values([
      { UserID: userId, ModuleID: enrolledModuleId },
      { UserID: otherUserId, ModuleID: otherModuleId },
    ]);
    await databaseService.db
      .insert(Event)
      .values([
        event(firstEventId, enrolledModuleId, 'L1', 'monday'),
        event(secondEventId, enrolledModuleId, 'L2', 'tuesday'),
        event(inaccessibleEventId, otherModuleId, 'L3', 'wednesday'),
      ]);
    await databaseService.db.insert(UniversityEvent).values([
      { moduleID: enrolledModuleId, eventID: firstEventId },
      { moduleID: enrolledModuleId, eventID: secondEventId },
      { moduleID: otherModuleId, eventID: inaccessibleEventId },
    ]);
  }
});

function event(
  eventID: string,
  moduleId: string,
  activityCode: string,
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday',
) {
  return {
    eventID,
    eventName: `${activityCode} lecture`,
    activityType: 'lecture' as const,
    activityCode,
    eventCriteria: {
      eventSource: EventSource.UNIVERSITY,
      moduleId,
      dayOfWeek,
      startTime: '08:00',
      endTime: '09:30',
    },
    isRecurring: true,
  };
}

function toPgliteDatabase(
  databaseService: DatabaseService,
): PgliteDatabase<typeof schema> {
  if (!databaseService.pglite) {
    throw new Error('Expected PGLite database service for solver input test');
  }
  return databaseService.db;
}
