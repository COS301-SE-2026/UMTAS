import { ConfigService } from '@nestjs/config';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import { join } from 'node:path';
import type * as schema from '../db/schema';
import { DatabaseService } from '../db/database.service';
import {
  Course,
  Event,
  EventVenue,
  GroupModules,
  ModuleGrouping,
  ModuleEnrollment,
  PersonalEvent,
  University,
  UniversityRole,
  UniversityEvent,
  Venue,
  modules,
  parseJob,
  usersTable,
} from '../entities';
import { EventImportFingerprintService } from './event-import-fingerprint.service';
import { EventService } from './event.service';
import type { CreateEventDto } from './dto/EventDto.dto';
import { EventSource } from './dto/event.types';
import { SolverInputBuilderService } from '../solver/solver-input-builder.service';
import { SolverJobStoreService } from '../solver/solver-job-store.service';

describe('EventService transactional creation', () => {
  let database: DatabaseService;
  let service: EventService;
  let solverInputBuilder: SolverInputBuilderService;

  beforeEach(async () => {
    database = new DatabaseService(new ConfigService({ DB_MODE: 'PGLITE' }));
    await migratePglite(database.db as PgliteDatabase<typeof schema>, {
      migrationsFolder: join(process.cwd(), 'drizzle'),
    });
    service = new EventService(
      database,
      {} as never,
      new EventImportFingerprintService(),
    );
    solverInputBuilder = new SolverInputBuilderService(
      database,
      new SolverJobStoreService(database),
    );
    await database.db.insert(usersTable).values({
      id: userId,
      name: 'Event Owner',
      email: 'event-owner@example.com',
      emailVerified: true,
      role: 'student',
      banned: false,
      createdAt: new Date('2026-07-13T00:00:00Z'),
      updatedAt: new Date('2026-07-13T00:00:00Z'),
    });
    await database.db.insert(University).values({
      UniversityID: universityId,
      UniversityName: 'UP',
    });
    await database.db.insert(University).values({
      UniversityID: otherUniversityId,
      UniversityName: 'UCT',
    });
    await database.db.insert(ModuleGrouping).values({ GroupID: groupId });
    await database.db.insert(Course).values({
      CourseID: courseId,
      UniversityID: universityId,
      GroupID: groupId,
      CourseName: 'BSc CS',
    });
    await database.db.insert(modules).values({
      moduleID: moduleId,
      moduleCode: 'COS101',
      moduleName: 'Computer Science 101',
    });
    await database.db.insert(GroupModules).values({
      GroupID: groupId,
      ModuleID: moduleId,
    });
    await database.db.insert(Venue).values([
      { VenueID: venueA, VenueName: 'A', UniversityID: universityId },
      { VenueID: venueB, VenueName: 'B', UniversityID: universityId },
      {
        VenueID: otherUniversityVenue,
        VenueName: 'Other university venue',
        UniversityID: otherUniversityId,
      },
    ]);
  });

  afterEach(() => database.onModuleDestroy());

  it('creates a personal event and returns its linked venues', async () => {
    const result = await service.create(userId, eventDto([venueA, venueB]));

    expect(result.event.venues).toEqual([
      { venueId: venueA, venueName: 'A' },
      { venueId: venueB, venueName: 'B' },
    ]);
    await expect(
      database.db.select().from(PersonalEvent),
    ).resolves.toHaveLength(1);
    await expect(database.db.select().from(EventVenue)).resolves.toHaveLength(
      2,
    );
  });

  it('creates a university event and returns its linked venues', async () => {
    await database.db.insert(ModuleEnrollment).values({
      ModuleID: moduleId,
      UserID: userId,
    });
    const dto = eventDto([venueA]);
    dto.eventCriteria.moduleId = moduleId;

    const result = await service.create(userId, dto);

    expect(result.event.venues).toEqual([{ venueId: venueA, venueName: 'A' }]);
    await expect(
      database.db.select().from(UniversityEvent),
    ).resolves.toHaveLength(1);
  });

  it('rejects a student who has no access to the university module', async () => {
    const dto = eventDto([venueA]);
    dto.eventCriteria.moduleId = moduleId;

    await expect(service.create(userId, dto)).rejects.toThrow(
      'cannot create university events for this module',
    );
    await expect(database.db.select().from(Event)).resolves.toHaveLength(0);
  });

  it('creates an event for a course-less module owned through the caller parse job', async () => {
    await database.db.insert(ModuleGrouping).values({ GroupID: parserGroupId });
    await database.db.insert(modules).values({
      moduleID: parserModuleId,
      moduleCode: 'COS102',
      moduleName: 'Computer Science 102',
    });
    await database.db.insert(GroupModules).values({
      GroupID: parserGroupId,
      ModuleID: parserModuleId,
    });
    await database.db.insert(parseJob).values({
      JobID: parserJobId,
      UserID: userId,
      UniversityID: universityId,
      AdapterKey: 'up',
      PdfStreamHash: 'a'.repeat(64),
      FingerprintAlgorithm: 'sha256',
      StreamCount: 1,
      GroupID: parserGroupId,
    });
    const dto = eventDto([venueA]);
    dto.eventCriteria.moduleId = parserModuleId;

    await expect(service.create(userId, dto)).resolves.toMatchObject({
      event: { eventCriteria: { moduleId: parserModuleId } },
    });
  });

  it('allows an approved university administrator to create an event for their university module', async () => {
    await database.db
      .update(usersTable)
      .set({ role: 'uni_admin' })
      .where(eq(usersTable.id, userId));
    await database.db.insert(UniversityRole).values({
      UserID: userId,
      UniversityID: universityId,
      role: 'UNIVERSITY_ADMIN',
    });
    const dto = eventDto([venueA]);
    dto.eventCriteria.moduleId = moduleId;

    await expect(service.create(userId, dto)).resolves.toMatchObject({
      event: { eventCriteria: { moduleId } },
    });
  });

  it('allows a student to create an event for their student-owned university module', async () => {
    await database.db.insert(UniversityRole).values({
      UserID: userId,
      UniversityID: universityId,
      role: 'STUDENT_OWNED',
    });
    const dto = eventDto([venueA]);
    dto.eventCriteria.moduleId = moduleId;

    await expect(service.create(userId, dto)).resolves.toMatchObject({
      event: { eventCriteria: { moduleId } },
    });
  });

  it('rejects a pending university administrator', async () => {
    await database.db
      .update(usersTable)
      .set({ role: 'uni_admin' })
      .where(eq(usersTable.id, userId));
    await database.db.insert(UniversityRole).values({
      UserID: userId,
      UniversityID: universityId,
      role: 'UNIVERSITY_ADMIN_PENDING',
    });
    const dto = eventDto([venueA]);
    dto.eventCriteria.moduleId = moduleId;

    await expect(service.create(userId, dto)).rejects.toThrow(
      'cannot create university events for this module',
    );
  });

  it('rejects a university administrator from another university', async () => {
    await database.db
      .update(usersTable)
      .set({ role: 'uni_admin' })
      .where(eq(usersTable.id, userId));
    await database.db.insert(UniversityRole).values({
      UserID: userId,
      UniversityID: otherUniversityId,
      role: 'UNIVERSITY_ADMIN',
    });
    const dto = eventDto([venueA]);
    dto.eventCriteria.moduleId = moduleId;

    await expect(service.create(userId, dto)).rejects.toThrow(
      'cannot create university events for this module',
    );
  });

  it('allows a system administrator to create an event for any university module', async () => {
    await database.db
      .update(usersTable)
      .set({ role: 'sys_admin' })
      .where(eq(usersTable.id, userId));
    const dto = eventDto([venueA]);
    dto.eventCriteria.moduleId = moduleId;

    await expect(service.create(userId, dto)).resolves.toMatchObject({
      event: { eventCriteria: { moduleId } },
    });
  });

  it('selects the university the caller administers when a module has course and parser ownership links', async () => {
    await database.db.insert(usersTable).values({
      id: parserOwnerId,
      name: 'Parser Owner',
      email: 'parser-owner@example.com',
      emailVerified: true,
      role: 'student',
      banned: false,
      createdAt: new Date('2026-07-13T00:00:00Z'),
      updatedAt: new Date('2026-07-13T00:00:00Z'),
    });
    await database.db.insert(parseJob).values({
      JobID: parserJobId,
      UserID: parserOwnerId,
      UniversityID: otherUniversityId,
      AdapterKey: 'uct',
      PdfStreamHash: 'b'.repeat(64),
      FingerprintAlgorithm: 'sha256',
      StreamCount: 1,
      GroupID: groupId,
    });
    await database.db
      .update(usersTable)
      .set({ role: 'uni_admin' })
      .where(eq(usersTable.id, userId));
    await database.db.insert(UniversityRole).values({
      UserID: userId,
      UniversityID: otherUniversityId,
      role: 'UNIVERSITY_ADMIN',
    });
    const dto = eventDto([otherUniversityVenue]);
    dto.eventCriteria.moduleId = moduleId;

    await expect(service.create(userId, dto)).resolves.toMatchObject({
      event: {
        eventCriteria: { moduleId },
        venues: [{ venueId: otherUniversityVenue }],
      },
    });
  });

  it('creates a university event that can be submitted through the solver contract', async () => {
    await database.db.insert(ModuleEnrollment).values({
      ModuleID: moduleId,
      UserID: userId,
    });
    const dto = eventDto([venueA]);
    dto.eventCriteria.eventSource = EventSource.UNIVERSITY;
    dto.eventCriteria.moduleId = moduleId;

    const created = await service.create(userId, dto);

    await expect(
      solverInputBuilder.buildForSubmission(userId),
    ).resolves.toEqual({
      schedulingProblem: {
        events: [
          {
            eventId: created.event.eventId,
            moduleCode: 'COS101',
            activityType: 'lecture',
            activityCode: 'S1',
            requiredSelections: 1,
            dayOfWeek: 'monday',
            startTime: '08:00',
            endTime: '09:00',
            venues: [{ id: venueA, name: 'A' }],
          },
        ],
      },
      preferences: { heuristics: [] },
    });
  });

  it('rejects a university event without an activity type before persistence', async () => {
    const dto = eventDto([venueA]);
    dto.eventCriteria.moduleId = moduleId;
    delete dto.activityType;

    await expect(service.create(userId, dto)).rejects.toThrow(
      'activityType is required for university events',
    );
    await expect(database.db.select().from(Event)).resolves.toHaveLength(0);
  });

  it('rejects a venue owned by a different university before persistence', async () => {
    await database.db.insert(ModuleEnrollment).values({
      ModuleID: moduleId,
      UserID: userId,
    });
    const dto = eventDto([otherUniversityVenue]);
    dto.eventCriteria.moduleId = moduleId;

    await expect(service.create(userId, dto)).rejects.toThrow(
      'One or more venueIds do not belong to the module university',
    );
    await expect(database.db.select().from(Event)).resolves.toHaveLength(0);
    await expect(database.db.select().from(EventVenue)).resolves.toHaveLength(
      0,
    );
  });

  it('rejects duplicate venue IDs without persisting an event', async () => {
    await expect(
      service.create(userId, eventDto([venueA, venueA])),
    ).rejects.toThrow('Event venues must not contain duplicates');
    await expect(database.db.select().from(Event)).resolves.toHaveLength(0);
  });

  it('rejects nonexistent venue IDs without persisting an event', async () => {
    await expect(
      service.create(userId, eventDto([missingVenue])),
    ).rejects.toThrow('One or more venueIds do not exist');
    await expect(database.db.select().from(Event)).resolves.toHaveLength(0);
  });

  it('rolls back the event when its university relationship insert fails', async () => {
    const dto = eventDto([venueA]);
    dto.eventCriteria.moduleId = missingModule;

    await expect(service.create(userId, dto)).rejects.toThrow();
    await expect(database.db.select().from(Event)).resolves.toHaveLength(0);
    await expect(database.db.select().from(EventVenue)).resolves.toHaveLength(
      0,
    );
  });
});

function eventDto(venueIds: string[]): CreateEventDto {
  return {
    eventName: 'Study',
    activityCode: 'S1',
    activityType: 'lecture',
    isRecurring: true,
    eventCriteria: {
      eventSource: EventSource.PERSONAL,
      dayOfWeek: 'monday',
      startTime: '08:00',
      endTime: '09:00',
    },
    venues: venueIds.map((venueId) => ({ venueId, venueName: 'ignored' })),
  };
}

const userId = '11111111-1111-4111-8111-111111111111';
const universityId = '22222222-2222-4222-8222-222222222222';
const otherUniversityId = '22222222-2222-4222-8222-222222222223';
const moduleId = '33333333-3333-4333-8333-333333333333';
const groupId = '33333333-3333-4333-8333-333333333334';
const courseId = '33333333-3333-4333-8333-333333333335';
const venueA = '44444444-4444-4444-8444-444444444444';
const venueB = '55555555-5555-4555-8555-555555555555';
const otherUniversityVenue = '55555555-5555-4555-8555-555555555556';
const missingVenue = '66666666-6666-4666-8666-666666666666';
const missingModule = '77777777-7777-4777-8777-777777777777';
const parserGroupId = '88888888-8888-4888-8888-888888888881';
const parserModuleId = '88888888-8888-4888-8888-888888888882';
const parserJobId = '88888888-8888-4888-8888-888888888883';
const parserOwnerId = '88888888-8888-4888-8888-888888888884';
