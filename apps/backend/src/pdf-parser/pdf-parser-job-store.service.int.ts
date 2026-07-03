import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import { join } from 'node:path';
import { DatabaseService } from '../db/database.service';
import {
  Event,
  EventVenue,
  GroupModules,
  University,
  UniversityEvent,
  Venue,
  modules,
  parseJob,
  usersTable,
} from '../entities';
import { EventImporter } from './event-importer.service';
import { ModuleResolver } from './module-resolver.service';
import { ParserResultImporter } from './parser-result-importer.service';
import { PdfParserJobStoreService } from './pdf-parser-job-store.service';

describe('PdfParserJobStoreService', () => {
  let databaseService: DatabaseService;
  let service: PdfParserJobStoreService;

  beforeEach(async () => {
    databaseService = new DatabaseService({
      get: (key: string) => (key === 'DB_MODE' ? 'PGLITE' : undefined),
    } as never);

    await migratePglite(databaseService.db as never, {
      migrationsFolder: join(process.cwd(), 'drizzle'),
    });

    service = new PdfParserJobStoreService(
      databaseService,
      new ParserResultImporter(new ModuleResolver(), new EventImporter()),
    );

    await databaseService.db.insert(usersTable).values({
      id: userId,
      name: 'Parser User',
      email: 'parser-user@example.com',
      emailVerified: true,
      role: 'student',
      banned: false,
      createdAt: new Date('2026-07-03T00:00:00.000Z'),
      updatedAt: new Date('2026-07-03T00:00:00.000Z'),
    });

    await databaseService.db.insert(University).values({
      UniversityID: universityId,
      UniversityName: 'UP',
    });
  });

  afterEach(async () => {
    await databaseService.onModuleDestroy();
  });

  it('links completed parser jobs to a module grouping and creates unvalidated domain records', async () => {
    await service.createQueuedJob({
      jobId,
      userId,
      universityId,
      fileKey: 'uploads/pdf-parser/input.pdf',
      adapterKey: 'up',
      pdfStreamHash: 'a'.repeat(64),
      fingerprintAlgorithm: 'pdf-stream-payload-sha256-v1',
      streamCount: 1,
    });

    const record = await service.recordCallback(jobId, {
      status: 'completed',
      result: {
        modules: [
          {
            code: 'cos101',
            name: 'Computer Science 101',
            metadata: { source: 'pdf' },
            warnings: [],
          },
        ],
        events: [
          {
            moduleCode: 'cos101',
            type: 'lecture',
            sectionLabel: 'L1',
            title: 'COS101 Lecture',
            day: 'Monday',
            date: null,
            startTime: '08:30',
            endTime: '09:20',
            venues: ['IT 2-26'],
            isRecurring: true,
            metadata: {},
            warnings: [],
          },
        ],
        warnings: [],
      },
    });

    expect(record.status).toBe('completed');
    expect(record.moduleGroupingId).toEqual(expect.any(String));

    const [storedJob] = await databaseService.db
      .select()
      .from(parseJob)
      .where(eq(parseJob.JobID, publicJobUuid));
    expect(storedJob.GroupID).toBe(record.moduleGroupingId);

    const [storedModule] = await databaseService.db
      .select()
      .from(modules)
      .where(eq(modules.moduleCode, 'COS101'));
    expect(storedModule).toMatchObject({
      moduleCode: 'COS101',
      moduleName: 'Computer Science 101',
      validated: false,
    });

    const [groupModule] = await databaseService.db
      .select()
      .from(GroupModules)
      .where(eq(GroupModules.GroupID, record.moduleGroupingId!));
    expect(groupModule.ModuleID).toBe(storedModule.moduleID);

    const [storedEvent] = await databaseService.db.select().from(Event);
    expect(storedEvent).toMatchObject({
      eventName: 'COS101 Lecture',
      eventCode: 'L1',
      isRecurring: true,
      validated: false,
    });
    expect(storedEvent.eventCriteria).toMatchObject({
      moduleID: storedModule.moduleID,
      date: 'Monday',
      startTime: '08:30',
      endTime: '09:20',
      venue: 'IT 2-26',
    });

    const [universityEvent] = await databaseService.db
      .select()
      .from(UniversityEvent)
      .where(eq(UniversityEvent.eventID, storedEvent.eventID));
    expect(universityEvent.moduleID).toBe(storedModule.moduleID);

    const [venue] = await databaseService.db.select().from(Venue);
    expect(venue).toMatchObject({
      VenueName: 'IT 2-26',
      UniversityID: universityId,
    });

    const [eventVenue] = await databaseService.db
      .select()
      .from(EventVenue)
      .where(eq(EventVenue.EventID, storedEvent.eventID));
    expect(eventVenue.VenueID).toBe(venue.VenueID);
  });

  it('does not return failed jobs when duplicate lookup is scoped to active statuses', async () => {
    await service.createQueuedJob({
      jobId,
      userId,
      universityId,
      fileKey: 'uploads/pdf-parser/input.pdf',
      adapterKey: 'up',
      pdfStreamHash: 'b'.repeat(64),
      fingerprintAlgorithm: 'pdf-stream-payload-sha256-v1',
      streamCount: 1,
    });

    await service.markInfrastructureFailure(jobId, {
      code: 'PARSER_FAILED',
      message: 'Parser failed',
      details: {},
    });

    await expect(
      service.findDuplicate({
        userId,
        universityId,
        adapterKey: 'up',
        pdfStreamHash: 'b'.repeat(64),
        fingerprintAlgorithm: 'pdf-stream-payload-sha256-v1',
        statuses: ['queued', 'completed'],
      }),
    ).resolves.toBeUndefined();

    await expect(
      service.findDuplicate({
        userId,
        universityId,
        adapterKey: 'up',
        pdfStreamHash: 'b'.repeat(64),
        fingerprintAlgorithm: 'pdf-stream-payload-sha256-v1',
      }),
    ).resolves.toMatchObject({ status: 'failed' });
  });

  it('accepts equivalent completed callbacks with different JSON key order', async () => {
    await service.createQueuedJob({
      jobId,
      userId,
      universityId,
      fileKey: 'uploads/pdf-parser/input.pdf',
      adapterKey: 'up',
      pdfStreamHash: 'c'.repeat(64),
      fingerprintAlgorithm: 'pdf-stream-payload-sha256-v1',
      streamCount: 1,
    });

    const firstResult = {
      modules: [
        {
          code: 'cos102',
          name: 'Computer Science 102',
          metadata: { source: 'pdf', page: 1 },
          warnings: [],
        },
      ],
      events: [],
      warnings: [],
    };
    const equivalentResult = {
      modules: [
        {
          warnings: [],
          metadata: { page: 1, source: 'pdf' },
          name: 'Computer Science 102',
          code: 'cos102',
        },
      ],
      events: [],
      warnings: [],
    };

    await service.recordCallback(jobId, {
      status: 'completed',
      result: firstResult,
    });

    await expect(
      service.recordCallback(jobId, {
        status: 'completed',
        result: equivalentResult,
      }),
    ).resolves.toMatchObject({ status: 'completed' });
  });
});

const userId = '11111111-1111-4111-8111-111111111111';
const universityId = '22222222-2222-4222-8222-222222222222';
const publicJobUuid = '33333333-3333-4333-8333-333333333333';
const jobId = `pdf-parse-${publicJobUuid}`;
