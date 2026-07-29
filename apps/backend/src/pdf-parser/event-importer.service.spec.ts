import { ConflictException } from '@nestjs/common';
import { EventImportFingerprintService } from '../Events/event-import-fingerprint.service';
import { createEvent, createModule, createVenue } from '../Testing/Factories';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  createDbChain,
  mockDbResult,
  mockSequentialResults,
} from '../Testing/Mocks/database.helpers';
import { EventImporter } from './event-importer.service';

describe('EventImporter', () => {
  const module = createModule({
    moduleID: 'module-1',
    moduleCode: 'COS101',
  });

  function harness() {
    const fingerprint = {
      buildForModuleEvent: jest.fn().mockReturnValue('fingerprint-1'),
    };
    return {
      fingerprint,
      service: new EventImporter(
        fingerprint as unknown as EventImportFingerprintService,
      ),
    };
  }

  it('skips events whose normalized module code cannot be resolved', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();
    await h.service.createMissingEvents(
      mockDb,
      'uni-1',
      [candidate({ moduleCode: 'unknown' })],
      new Map([['COS101', module]]),
    );
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(h.fingerprint.buildForModuleEvent).not.toHaveBeenCalled();
  });

  it('creates a non-recurring event and university link without venue links', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();
    const event = createEvent(undefined, {
      eventID: 'event-1',
      importFingerprint: 'fingerprint-1',
    });
    const eventInsert = createDbChain([event]);
    const universityLink = createDbChain([]);
    (mockDb.insert as jest.Mock)
      .mockReturnValueOnce(eventInsert)
      .mockReturnValueOnce(universityLink);

    await h.service.createMissingEvents(
      mockDb,
      'uni-1',
      [
        candidate({
          title: '',
          activityCode: '',
          activityType: 'tutorial',
          isRecurring: false,
          day: null,
          date: '2026-08-03',
          venues: [],
        }),
      ],
      new Map([['COS101', module]]),
    );

    expect(eventInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'COS101 tutorial',
        activityCode: 'tutorial',
        isRecurring: false,
        validated: false,
        eventCriteria: expect.objectContaining({
          date: '2026-08-03',
          moduleId: 'module-1',
        }),
      }),
    );
    expect(universityLink.values).toHaveBeenCalledWith({
      moduleID: 'module-1',
      eventID: 'event-1',
    });
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
    expect(h.fingerprint.buildForModuleEvent).toHaveBeenCalledWith({
      moduleId: 'module-1',
      activityType: 'tutorial',
      activityCode: 'tutorial',
      eventCriteria: expect.objectContaining({ date: '2026-08-03' }),
      venueNames: [],
    });
  });

  it.each([
    ['mon', 'monday'],
    ['monday', 'monday'],
    ['tue', 'tuesday'],
    ['tues', 'tuesday'],
    ['tuesday', 'tuesday'],
    ['wed', 'wednesday'],
    ['wednesday', 'wednesday'],
    ['thu', 'thursday'],
    ['thur', 'thursday'],
    ['thurs', 'thursday'],
    ['thursday', 'thursday'],
    ['fri', 'friday'],
    ['friday', 'friday'],
    ['sat', 'saturday'],
    ['saturday', 'saturday'],
    ['sun', 'sunday'],
    ['sunday', 'sunday'],
  ])('normalizes weekday alias %s to %s', async (day, expected) => {
    const h = harness();
    const { mockDb } = createMockDatabase();
    const eventInsert = createDbChain([createEvent()]);
    (mockDb.insert as jest.Mock)
      .mockReturnValueOnce(eventInsert)
      .mockReturnValueOnce(createDbChain([]));

    await h.service.createMissingEvents(
      mockDb,
      'uni-1',
      [candidate({ day: ` ${day.toUpperCase()} ` })],
      new Map([['COS101', module]]),
    );
    expect(eventInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCriteria: expect.objectContaining({ dayOfWeek: expected }),
      }),
    );
  });

  it.each([null, '', 'funday'])(
    'rejects invalid recurring weekday %p',
    async (day) => {
      const h = harness();
      const { mockDb } = createMockDatabase();
      await expect(
        h.service.createMissingEvents(
          mockDb,
          'uni-1',
          [candidate({ day })],
          new Map([['COS101', module]]),
        ),
      ).rejects.toThrow(ConflictException);
      expect(mockDb.insert).not.toHaveBeenCalled();
    },
  );

  it('falls back to an existing event after an insertion conflict', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();
    mockDbResult(mockDb.select as jest.Mock, [
      createEvent(undefined, { eventID: 'existing-event' }),
    ]);
    (mockDb.insert as jest.Mock)
      .mockReturnValueOnce(createDbChain([]))
      .mockReturnValueOnce(createDbChain([]));

    await h.service.createMissingEvents(
      mockDb,
      'uni-1',
      [candidate({ venues: [] })],
      new Map([['COS101', module]]),
    );
    expect(
      (mockDb.insert as jest.Mock).mock.results[1]?.value.values,
    ).toHaveBeenCalledWith({
      moduleID: 'module-1',
      eventID: 'existing-event',
    });
  });

  it('rejects an unresolvable event insertion conflict', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();
    mockDbResult(mockDb.select as jest.Mock, []);
    mockDbResult(mockDb.insert as jest.Mock, []);
    await expect(
      h.service.createMissingEvents(
        mockDb,
        'uni-1',
        [candidate({ venues: [] })],
        new Map([['COS101', module]]),
      ),
    ).rejects.toThrow('PDF parser event could not be resolved');
  });

  it('reuses, creates, deduplicates, truncates, and race-resolves venues', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();
    const existing = createVenue({ VenueID: 'venue-existing' });
    const created = createVenue({ VenueID: 'venue-created' });
    const truncated = createVenue({
      VenueID: 'venue-truncated',
      VenueName: 'L'.repeat(30),
    });
    const raced = createVenue({ VenueID: 'venue-raced' });
    mockSequentialResults(mockDb.select as jest.Mock, [
      [existing],
      [],
      [],
      [],
      [raced],
    ]);
    const venueCreate = createDbChain([created]);
    const longVenueCreate = createDbChain([truncated]);
    const racedVenueCreate = createDbChain([]);
    const eventInsert = createDbChain([
      createEvent(undefined, { eventID: 'event-1' }),
    ]);
    const universityLink = createDbChain([]);
    const venueLinks = [0, 1, 2, 3].map(() => createDbChain([]));
    (mockDb.insert as jest.Mock)
      .mockReturnValueOnce(venueCreate)
      .mockReturnValueOnce(longVenueCreate)
      .mockReturnValueOnce(racedVenueCreate)
      .mockReturnValueOnce(eventInsert)
      .mockReturnValueOnce(universityLink);
    for (const link of venueLinks) {
      (mockDb.insert as jest.Mock).mockReturnValueOnce(link);
    }

    await h.service.createMissingEvents(
      mockDb,
      'uni-1',
      [
        candidate({
          venues: [' Existing ', 'New', 'New', ' ', 'L'.repeat(40), 'Race'],
        }),
      ],
      new Map([['COS101', module]]),
    );

    expect(venueCreate.values).toHaveBeenCalledWith({
      VenueName: 'New',
      UniversityID: 'uni-1',
    });
    expect(longVenueCreate.values).toHaveBeenCalledWith({
      VenueName: 'L'.repeat(30),
      UniversityID: 'uni-1',
    });
    expect(venueLinks.map((link) => link.values.mock.calls[0]?.[0])).toEqual([
      { EventID: 'event-1', VenueID: 'venue-existing' },
      { EventID: 'event-1', VenueID: 'venue-created' },
      { EventID: 'event-1', VenueID: 'venue-truncated' },
      { EventID: 'event-1', VenueID: 'venue-raced' },
    ]);
  });

  it('truncates explicit event names and activity codes', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();
    const eventInsert = createDbChain([createEvent()]);
    (mockDb.insert as jest.Mock)
      .mockReturnValueOnce(eventInsert)
      .mockReturnValueOnce(createDbChain([]));
    await h.service.createMissingEvents(
      mockDb,
      'uni-1',
      [
        candidate({
          title: 'T'.repeat(40),
          activityCode: 'A'.repeat(20),
          venues: [],
        }),
      ],
      new Map([['COS101', module]]),
    );
    expect(eventInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'T'.repeat(32),
        activityCode: 'A'.repeat(10),
      }),
    );
  });
});

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    moduleCode: ' cos101 ',
    title: 'Lecture',
    activityType: 'lecture',
    activityCode: 'L1',
    isRecurring: true,
    day: 'monday',
    date: null,
    startTime: '08:00',
    endTime: '09:00',
    venues: [],
    metadata: {},
    warnings: [],
    ...overrides,
  } as never;
}
