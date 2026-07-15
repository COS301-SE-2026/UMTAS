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
  Course,
  Event,
  EventVenue,
  GroupModules,
  ModuleEnrollment,
  ModuleGrouping,
  parseJob,
  University,
  UniversityRole,
  UniversityEvent,
  Venue,
  modules,
  usersTable,
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

  it('builds shared-contract input from a manual module grouping owned through enrollment', async () => {
    const userId = '00000000-0000-4000-8000-000000000010';
    const otherUserId = '00000000-0000-4000-8000-000000000011';
    const universityId = '00000000-0000-4000-8000-000000000001';
    const moduleId = '00000000-0000-4000-8000-000000000002';
    const groupId = '00000000-0000-4000-8000-000000000003';
    const eventId = '00000000-0000-4000-8000-000000000004';
    const venueId = '00000000-0000-4000-8000-000000000005';

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
    await databaseService.db.insert(ModuleEnrollment).values({
      UserID: userId,
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
    const expectedInput = {
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
    };

    await expect(builder.buildForProfile(userId, groupId)).resolves.toEqual(
      expectedInput,
    );
    await expect(builder.buildForProfile(userId, 'default')).resolves.toEqual(
      expectedInput,
    );
    await expect(
      builder.buildForProfile(otherUserId, 'default'),
    ).resolves.toEqual({
      schedulingProblem: { events: [] },
      preferences: { heuristics: [] },
    });
    await expect(
      builder.buildForProfile(otherUserId, groupId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects unknown jobs and unsupported profile keys', async () => {
    await expect(builder.build('missing-job')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    await expect(
      builder.buildForProfile(
        '00000000-0000-4000-8000-000000000011',
        'not-a-profile',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a manual grouping when the user is enrolled in only some modules', async () => {
    const userId = '10000000-0000-4000-8000-000000000001';
    const groupId = '10000000-0000-4000-8000-000000000002';
    const enrolledModuleId = '10000000-0000-4000-8000-000000000003';
    const otherModuleId = '10000000-0000-4000-8000-000000000004';

    await databaseService.db.insert(usersTable).values({
      id: userId,
      name: 'Partial Enrollment User',
      email: 'solver-partial-enrollment@example.com',
    });
    await databaseService.db
      .insert(ModuleGrouping)
      .values({ GroupID: groupId });
    await databaseService.db.insert(modules).values([
      {
        moduleID: enrolledModuleId,
        moduleCode: 'PART1',
        moduleName: 'Enrolled module',
      },
      {
        moduleID: otherModuleId,
        moduleCode: 'PART2',
        moduleName: 'Unenrolled module',
      },
    ]);
    await databaseService.db.insert(GroupModules).values([
      { GroupID: groupId, ModuleID: enrolledModuleId },
      { GroupID: groupId, ModuleID: otherModuleId },
    ]);
    await databaseService.db.insert(ModuleEnrollment).values({
      UserID: userId,
      ModuleID: enrolledModuleId,
    });

    await expect(
      builder.buildForProfile(userId, groupId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('authorizes university ownership through course and parser university links', async () => {
    const courseUserId = '20000000-0000-4000-8000-000000000001';
    const parserUserId = '20000000-0000-4000-8000-000000000002';
    const parseJobOwnerId = '20000000-0000-4000-8000-000000000003';
    const universityId = '20000000-0000-4000-8000-000000000004';
    const courseGroupId = '20000000-0000-4000-8000-000000000005';
    const parserGroupId = '20000000-0000-4000-8000-000000000006';
    const courseModuleId = '20000000-0000-4000-8000-000000000007';
    const parserModuleId = '20000000-0000-4000-8000-000000000008';

    await databaseService.db.insert(usersTable).values([
      {
        id: courseUserId,
        name: 'Course University User',
        email: 'solver-course-university@example.com',
      },
      {
        id: parserUserId,
        name: 'Parser University User',
        email: 'solver-parser-university@example.com',
      },
      {
        id: parseJobOwnerId,
        name: 'Parse Job Owner',
        email: 'solver-parse-job-owner@example.com',
      },
    ]);
    await databaseService.db.insert(University).values({
      UniversityID: universityId,
      UniversityName: 'Ownership Test University',
    });
    await databaseService.db.insert(UniversityRole).values([
      {
        UserID: courseUserId,
        UniversityID: universityId,
        role: 'UNIVERSITY_ADMIN',
      },
      {
        UserID: parserUserId,
        UniversityID: universityId,
        role: 'STUDENT',
      },
    ]);
    await databaseService.db
      .insert(ModuleGrouping)
      .values([{ GroupID: courseGroupId }, { GroupID: parserGroupId }]);
    await databaseService.db.insert(modules).values([
      {
        moduleID: courseModuleId,
        moduleCode: 'OWN1',
        moduleName: 'Course-owned module',
      },
      {
        moduleID: parserModuleId,
        moduleCode: 'OWN2',
        moduleName: 'Parser-owned module',
      },
    ]);
    await databaseService.db.insert(GroupModules).values([
      { GroupID: courseGroupId, ModuleID: courseModuleId },
      { GroupID: parserGroupId, ModuleID: parserModuleId },
    ]);
    await databaseService.db.insert(Course).values({
      CourseID: '20000000-0000-4000-8000-000000000009',
      UniversityID: universityId,
      GroupID: courseGroupId,
      CourseName: 'Ownership Course',
    });
    await databaseService.db.insert(parseJob).values({
      JobID: '20000000-0000-4000-8000-000000000010',
      UserID: parseJobOwnerId,
      UniversityID: universityId,
      AdapterKey: 'up',
      PdfStreamHash: 'b'.repeat(64),
      FingerprintAlgorithm: 'pdf-stream-sha256-v1',
      StreamCount: 1,
      GroupID: parserGroupId,
      Status: 'completed',
    });

    const emptyInput = {
      schedulingProblem: { events: [] },
      preferences: { heuristics: [] },
    };
    await expect(
      builder.buildForProfile(courseUserId, courseGroupId),
    ).resolves.toEqual(emptyInput);
    await expect(
      builder.buildForProfile(parserUserId, parserGroupId),
    ).resolves.toEqual(emptyInput);
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
