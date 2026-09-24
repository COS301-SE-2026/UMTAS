import { ConflictException } from '@nestjs/common';

import { EventImportFingerprintService } from '../Events/event-import-fingerprint.service';

import {
  createEvent,
  createModule,
  createParsedEventCandidate,
} from '../Testing/Factories';

import { createMockDatabase } from '../Testing/Mocks/database.mock';

import { createDbChain, mockDbResult } from '../Testing/Mocks/database.helpers';

import { EventImporter } from './event-importer.service';
import { VenueResolver } from './venue-resolver.service';

describe('EventImporter', () => {
  const module = createModule({
    moduleID: 'module-1',
    moduleCode: 'COS101',
  });

  function harness() {
    const fingerprint = {
      buildForModuleEvent: jest.fn().mockReturnValue('fingerprint-1'),
    };

    const venueResolver = {
      resolveForUniversity: jest.fn().mockResolvedValue([]),
    };

    return {
      fingerprint,
      venueResolver,
      service: new EventImporter(
        fingerprint as unknown as EventImportFingerprintService,
        venueResolver as unknown as VenueResolver,
      ),
    };
  }

  it('skips events whose normalized module code cannot be resolved', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();

    await h.service.createMissingEvents(
      mockDb,
      'uni-1',
      [createParsedEventCandidate({ moduleCode: 'unknown' })],
      new Map([['COS101', module]]),
    );

    expect(mockDb.select).not.toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();

    expect(h.fingerprint.buildForModuleEvent).not.toHaveBeenCalled();
    expect(h.venueResolver.resolveForUniversity).not.toHaveBeenCalled();
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
        createParsedEventCandidate({
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

    expect(h.venueResolver.resolveForUniversity).toHaveBeenCalledWith(
      mockDb,
      'uni-1',
      [],
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
      eventCriteria: expect.objectContaining({
        date: '2026-08-03',
      }),
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
      [
        createParsedEventCandidate({
          day: ` ${day.toUpperCase()} `,
        }),
      ],
      new Map([['COS101', module]]),
    );

    expect(eventInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCriteria: expect.objectContaining({
          dayOfWeek: expected,
        }),
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
          [createParsedEventCandidate({ day })],
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
      createEvent(undefined, {
        eventID: 'existing-event',
      }),
    ]);

    (mockDb.insert as jest.Mock)
      .mockReturnValueOnce(createDbChain([]))
      .mockReturnValueOnce(createDbChain([]));

    await h.service.createMissingEvents(
      mockDb,
      'uni-1',
      [createParsedEventCandidate({ venues: [] })],
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
        [createParsedEventCandidate({ venues: [] })],
        new Map([['COS101', module]]),
      ),
    ).rejects.toThrow('PDF parser event could not be resolved');
  });

  it('resolves existing venues and creates event venue links', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();

    h.venueResolver.resolveForUniversity.mockResolvedValue([
      'venue-1',
      'venue-2',
    ]);

    const eventInsert = createDbChain([
      createEvent(undefined, {
        eventID: 'event-1',
      }),
    ]);

    const universityLink = createDbChain([]);
    const venueLinkOne = createDbChain([]);
    const venueLinkTwo = createDbChain([]);

    (mockDb.insert as jest.Mock)
      .mockReturnValueOnce(eventInsert)
      .mockReturnValueOnce(universityLink)
      .mockReturnValueOnce(venueLinkOne)
      .mockReturnValueOnce(venueLinkTwo);

    await h.service.createMissingEvents(
      mockDb,
      'uni-1',
      [
        createParsedEventCandidate({
          venues: ['IT 4-1', 'Centenary 6'],
        }),
      ],
      new Map([['COS101', module]]),
    );

    expect(h.venueResolver.resolveForUniversity).toHaveBeenCalledTimes(1);

    expect(h.venueResolver.resolveForUniversity).toHaveBeenCalledWith(
      mockDb,
      'uni-1',
      ['IT 4-1', 'Centenary 6'],
    );

    expect(venueLinkOne.values).toHaveBeenCalledWith({
      EventID: 'event-1',
      VenueID: 'venue-1',
    });

    expect(venueLinkTwo.values).toHaveBeenCalledWith({
      EventID: 'event-1',
      VenueID: 'venue-2',
    });

    expect(mockDb.insert).toHaveBeenCalledTimes(4);
  });

  it('does not create venue links when venue resolver cannot resolve the parsed venues', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();

    h.venueResolver.resolveForUniversity.mockResolvedValue([]);

    const eventInsert = createDbChain([
      createEvent(undefined, {
        eventID: 'event-1',
      }),
    ]);

    const universityLink = createDbChain([]);

    (mockDb.insert as jest.Mock)
      .mockReturnValueOnce(eventInsert)
      .mockReturnValueOnce(universityLink);

    await h.service.createMissingEvents(
      mockDb,
      'uni-1',
      [
        createParsedEventCandidate({
          venues: ['Unknown Venue'],
        }),
      ],
      new Map([['COS101', module]]),
    );

    expect(h.venueResolver.resolveForUniversity).toHaveBeenCalledWith(
      mockDb,
      'uni-1',
      ['Unknown Venue'],
    );

    expect(mockDb.insert).toHaveBeenCalledTimes(2);
  });

  it('deduplicates venue links returned by the resolver', async () => {
    const h = harness();
    const { mockDb } = createMockDatabase();

    h.venueResolver.resolveForUniversity.mockResolvedValue([
      'venue-1',
      'venue-2',
    ]);

    const eventInsert = createDbChain([
      createEvent(undefined, {
        eventID: 'event-1',
      }),
    ]);

    const universityLink = createDbChain([]);
    const venueLinkOne = createDbChain([]);
    const venueLinkTwo = createDbChain([]);

    (mockDb.insert as jest.Mock)
      .mockReturnValueOnce(eventInsert)
      .mockReturnValueOnce(universityLink)
      .mockReturnValueOnce(venueLinkOne)
      .mockReturnValueOnce(venueLinkTwo);

    await h.service.createMissingEvents(
      mockDb,
      'uni-1',
      [
        createParsedEventCandidate({
          venues: ['IT 4-1', 'IT4-1'],
        }),
      ],
      new Map([['COS101', module]]),
    );

    expect(venueLinkOne.values).toHaveBeenCalledWith({
      EventID: 'event-1',
      VenueID: 'venue-1',
    });

    expect(venueLinkTwo.values).toHaveBeenCalledWith({
      EventID: 'event-1',
      VenueID: 'venue-2',
    });
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
        createParsedEventCandidate({
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
