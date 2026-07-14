import { ConfigService } from '@nestjs/config';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { join } from 'node:path';
import type * as schema from '../db/schema';
import { DatabaseService } from '../db/database.service';
import {
  Event,
  EventVenue,
  PersonalEvent,
  University,
  UniversityEvent,
  Venue,
  modules,
  usersTable,
} from '../entities';
import { EventImportFingerprintService } from './event-import-fingerprint.service';
import { EventService } from './event.service';
import type { CreateEventDto } from './dto/EventDto.dto';
import { EventSource } from './dto/event.types';

describe('EventService transactional creation', () => {
  let database: DatabaseService;
  let service: EventService;

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
    await database.db.insert(modules).values({
      moduleID: moduleId,
      moduleCode: 'COS101',
      moduleName: 'Computer Science 101',
    });
    await database.db.insert(Venue).values([
      { VenueID: venueA, VenueName: 'A', UniversityID: universityId },
      { VenueID: venueB, VenueName: 'B', UniversityID: universityId },
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
    const dto = eventDto([venueA]);
    dto.eventCriteria.moduleId = moduleId;

    const result = await service.create(userId, dto);

    expect(result.event.venues).toEqual([{ venueId: venueA, venueName: 'A' }]);
    await expect(
      database.db.select().from(UniversityEvent),
    ).resolves.toHaveLength(1);
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
const moduleId = '33333333-3333-4333-8333-333333333333';
const venueA = '44444444-4444-4444-8444-444444444444';
const venueB = '55555555-5555-4555-8555-555555555555';
const missingVenue = '66666666-6666-4666-8666-666666666666';
const missingModule = '77777777-7777-4777-8777-777777777777';
