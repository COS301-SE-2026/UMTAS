import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SolverInputSchema, SolverPreferences } from 'shared-types';
import { createSolverJob } from '../Testing/Factories';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { mockDbResult } from '../Testing/Mocks/database.helpers';
import { SolverInputBuilderService } from './solver-input-builder.service';
import { SolverJobStoreService } from './solver-job-store.service';

const EVENT_A = '11111111-1111-4111-8111-111111111111';
const EVENT_B = '22222222-2222-4222-8222-222222222222';

describe('SolverInputBuilderService', () => {
  const safeParse = jest.fn((data) => ({ success: true as const, data }));

  beforeEach(() => {
    safeParse.mockReset();
    safeParse.mockImplementation((data) => ({ success: true as const, data }));
    (
      SolverInputSchema as unknown as { safeParse: typeof safeParse }
    ).safeParse = safeParse;
  });

  function harness() {
    const { mockDb } = createMockDatabase();
    const jobStore = { findJob: jest.fn() };
    return {
      mockDb,
      jobStore,
      service: new SolverInputBuilderService(
        { db: mockDb } as never,
        jobStore as unknown as SolverJobStoreService,
      ),
    };
  }

  it('loads immutable input from the stored worker job', async () => {
    const h = harness();
    const input = createSolverJob().Input;
    h.jobStore.findJob.mockResolvedValue({ input });
    await expect(h.service.build('solve-id')).resolves.toBe(input);
    expect(h.jobStore.findJob).toHaveBeenCalledWith('solve-id');
  });

  it('rejects a missing stored job', async () => {
    const h = harness();
    h.jobStore.findJob.mockResolvedValue(undefined);
    await expect(h.service.build('missing')).rejects.toThrow(NotFoundException);
  });

  it('canonicalizes events and venues and applies explicit preferences', async () => {
    const h = harness();
    mockDbResult(h.mockDb.select as jest.Mock, [
      createQueryRow(EVENT_B, {
        moduleCode: 'MAT101',
        activityCode: 'P1',
        dayOfWeek: 'monday',
        venueId: 'venue-z',
        venueName: 'Zulu',
        requiredSelections: 2,
      }),
      createQueryRow(EVENT_A, {
        venueId: 'venue-b',
        venueName: 'Beta',
      }),
      createQueryRow(EVENT_A, {
        venueId: 'venue-a',
        venueName: 'Alpha',
      }),
    ]);
    const preferences: SolverPreferences = {
      heuristics: [{ key: 'small-gaps' }],
    };

    const result = await h.service.buildForSubmission(
      'user-1',
      [EVENT_B, EVENT_A],
      preferences,
    );

    expect(result.preferences).toEqual(preferences);
    expect(
      result.schedulingProblem.events.map(({ eventId }) => eventId),
    ).toEqual([EVENT_A, EVENT_B]);
    expect(result.schedulingProblem.events[0]?.venues).toEqual([
      { id: 'venue-a', name: 'Alpha' },
      { id: 'venue-b', name: 'Beta' },
    ]);
    expect(result.schedulingProblem.events[1]).toMatchObject({
      dayOfWeek: 'monday',
      requiredSelections: 2,
    });
  });

  it('uses default preferences and supports enrollment-derived selection', async () => {
    const h = harness();
    mockDbResult(h.mockDb.select as jest.Mock, [createQueryRow(EVENT_A)]);
    const result = await h.service.buildForSubmission('user-1');
    expect(result.preferences).toEqual({ heuristics: [] });
    expect(result.schedulingProblem.events).toHaveLength(1);
  });

  it('supports non-recurring events without venues', async () => {
    const h = harness();
    mockDbResult(h.mockDb.select as jest.Mock, [
      createQueryRow(EVENT_A, {
        date: '2026-07-29',
        dayOfWeek: undefined,
        venueId: null,
        venueName: null,
      }),
    ]);
    const result = await h.service.buildForSubmission('user-1', [EVENT_A]);
    expect(result.schedulingProblem.events[0]).toMatchObject({
      date: '2026-07-29',
      venues: [],
    });
    expect(result.schedulingProblem.events[0]).not.toHaveProperty('dayOfWeek');
  });

  it('rejects selected events missing from the scoped query', async () => {
    const h = harness();
    mockDbResult(h.mockDb.select as jest.Mock, [createQueryRow(EVENT_A)]);
    await expect(
      h.service.buildForSubmission('user-1', [EVENT_A, EVENT_B]),
    ).rejects.toThrow('One or more selected events were not found');
  });

  it.each([[[]], [[EVENT_A, EVENT_A]], [['not-a-uuid']]])(
    'rejects invalid explicit selection %#',
    async (eventIds) => {
      const h = harness();
      await expect(
        h.service.buildForSubmission('user-1', eventIds),
      ).rejects.toThrow(BadRequestException);
      expect(h.mockDb.select).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      activityCode: null,
    },
    {
      startTime: '11:00',
      endTime: '10:00',
    },
    {
      date: '2026-07-29',
      dayOfWeek: 'monday',
    },
  ])('rejects invalid persisted event criteria %#', async (overrides) => {
    const h = harness();
    mockDbResult(h.mockDb.select as jest.Mock, [
      createQueryRow(EVENT_A, overrides),
    ]);
    safeParse.mockReturnValueOnce({
      success: false,
      error: { issues: [{ message: 'invalid persisted criteria' }] },
    } as never);
    await expect(
      h.service.buildForSubmission('user-1', [EVENT_A]),
    ).rejects.toThrow(ConflictException);
  });
});

function createQueryRow(
  eventId: string,
  overrides: RowOverrides = {},
): {
  eventId: string;
  moduleCode: string;
  activityType: string;
  activityCode: string | null;
  eventCriteria: Record<string, unknown>;
  venueId: string | null;
  venueName: string | null;
} {
  const {
    requiredSelections,
    date = undefined,
    dayOfWeek = date ? undefined : 'tuesday',
    startTime = '08:00',
    endTime = '09:00',
    ...fields
  } = overrides;
  const activityCode =
    fields.activityCode === undefined ? 'L1' : fields.activityCode;
  return {
    eventId,
    moduleCode: 'COS101',
    activityType: 'lecture',
    activityCode,
    eventCriteria: {
      eventSource: 'UNIVERSITY',
      moduleId: 'module-1',
      startTime,
      endTime,
      ...(date ? { date } : {}),
      ...(dayOfWeek ? { dayOfWeek } : {}),
      ...(requiredSelections === undefined
        ? {}
        : {
            activityRequirements: {
              [activityCode ?? '']: { requiredSelections },
            },
          }),
      ...(fields.eventCriteria ?? {}),
    },
    venueId: 'venue-1',
    venueName: 'Room 1',
    ...fields,
  };
}

interface RowOverrides {
  moduleCode?: string;
  activityType?: string;
  activityCode?: string | null;
  eventCriteria?: Record<string, unknown>;
  venueId?: string | null;
  venueName?: string | null;
  requiredSelections?: number;
  date?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
}
