import { NotFoundException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import type { SolverJob } from '../entities';
import { createSolverJob } from '../Testing/Factories';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockSequentialResults,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import {
  parsePublicSolverJobId,
  SolverJobStoreService,
  toPublicSolverJobId,
} from './solver-job-store.service';

jest.mock('node:crypto', () => ({
  ...jest.requireActual<typeof import('node:crypto')>('node:crypto'),
  randomUUID: jest.fn(),
}));

const JOB_UUID = '11111111-1111-4111-8111-111111111111';
const ATTEMPT = '22222222-2222-4222-8222-222222222222';
const NEW_ATTEMPT = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-07-29T12:00:00.000Z');
const completedCallback = {
  status: 'completed' as const,
  result: {
    engine: 'cp-sat' as const,
    outcome: 'conflict-free' as const,
    timetableSolution: { selectedEventIds: [] },
    heuristicScores: [],
    metadata: {
      conflictCount: 0,
      conflicts: [],
      solveMode: 'optimization' as const,
    },
  },
};
const failedCallback = {
  status: 'failed' as const,
  error: {
    code: 'SOLVER_FAILED',
    message: 'No solution',
    details: { reason: 'infeasible' },
  },
};

describe('SolverJobStoreService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    jest.mocked(crypto.randomUUID).mockReturnValue(NEW_ATTEMPT);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  function harness() {
    const { mockDb } = createMockDatabase();
    return {
      mockDb,
      service: new SolverJobStoreService({ db: mockDb } as never),
    };
  }

  it('reserves and maps a new job with deterministic IDs and timestamps', async () => {
    const h = harness();
    const inserted = row({ JobID: NEW_ATTEMPT, AttemptToken: NEW_ATTEMPT });
    mockTransaction(h.mockDb, { insert: [[inserted]] });
    const result = await h.service.reserveOrReuse(reservation());
    expect(result).toEqual({
      kind: 'reserved',
      record: expect.objectContaining({
        jobId: `solve-${NEW_ATTEMPT}`,
        attemptToken: NEW_ATTEMPT,
        status: 'queued',
      }),
    });
    const chain = (h.mockDb.insert as jest.Mock).mock.results[0]?.value;
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        JobID: NEW_ATTEMPT,
        AttemptToken: NEW_ATTEMPT,
        UserID: 'user-1',
        DeduplicationKey: 'fingerprint-1',
      }),
    );
  });

  it.each(['queued', 'completed'] as const)(
    'reuses an active %s duplicate',
    async (status) => {
      const h = harness();
      const duplicate = row({ Status: status });
      mockTransaction(h.mockDb, { insert: [[]], select: [[duplicate]] });
      await expect(h.service.reserveOrReuse(reservation())).resolves.toEqual({
        kind: 'reused',
        record: expect.objectContaining({ status }),
      });
      expect(h.mockDb.update).not.toHaveBeenCalled();
    },
  );

  it('retries a confirmed failure with a fresh attempt token', async () => {
    const h = harness();
    const failed = row({
      Status: 'failed',
      ErrorCode: 'WORKER',
      ErrorMessage: 'failed',
      FailedAt: NOW,
    });
    const retried = row({ AttemptToken: NEW_ATTEMPT });
    mockTransaction(h.mockDb, {
      insert: [[]],
      select: [[failed]],
      update: [[retried]],
    });
    const result = await h.service.reserveOrReuse(reservation());
    expect(result.kind).toBe('reserved');
    const chain = (h.mockDb.update as jest.Mock).mock.results[0]?.value;
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        AttemptToken: NEW_ATTEMPT,
        Status: 'queued',
        Result: null,
        ErrorCode: null,
      }),
    );
  });

  it('reclaims a stale unacknowledged reservation while preserving its token', async () => {
    const h = harness();
    const stale = row({
      UpdatedAt: new Date(NOW.getTime() - 60_001),
      EnqueuedAt: null,
    });
    const reclaimed = row({ AttemptToken: ATTEMPT });
    mockTransaction(h.mockDb, {
      insert: [[]],
      select: [[stale]],
      update: [[reclaimed]],
    });
    await expect(h.service.reserveOrReuse(reservation())).resolves.toEqual({
      kind: 'reserved',
      record: expect.objectContaining({ attemptToken: ATTEMPT }),
    });
    const chain = (h.mockDb.update as jest.Mock).mock.results[0]?.value;
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ AttemptToken: ATTEMPT }),
    );
  });

  it('does not reclaim an old acknowledged reservation', async () => {
    const h = harness();
    const acknowledged = row({
      UpdatedAt: new Date(NOW.getTime() - 120_000),
      EnqueuedAt: new Date(NOW.getTime() - 119_000),
    });
    mockTransaction(h.mockDb, {
      insert: [[]],
      select: [[acknowledged]],
    });
    const result = await h.service.reserveOrReuse(reservation());
    expect(result.kind).toBe('reused');
    expect(h.mockDb.update).not.toHaveBeenCalled();
  });

  it('rejects an unresolvable insertion conflict', async () => {
    const h = harness();
    mockTransaction(h.mockDb, { insert: [[]], select: [[]] });
    await expect(h.service.reserveOrReuse(reservation())).rejects.toThrow(
      'Solver job conflict could not be resolved',
    );
  });

  it('returns the raced active duplicate when retry update loses', async () => {
    const h = harness();
    const failed = row({ Status: 'failed' });
    const raced = row({ Status: 'queued', AttemptToken: NEW_ATTEMPT });
    mockTransaction(h.mockDb, {
      insert: [[]],
      select: [[failed], [raced]],
      update: [[]],
    });
    await expect(h.service.reserveOrReuse(reservation())).resolves.toEqual({
      kind: 'reused',
      record: expect.objectContaining({ attemptToken: NEW_ATTEMPT }),
    });
  });

  it('rejects when a retry race remains failed or disappears', async () => {
    const h = harness();
    const failed = row({ Status: 'failed' });
    mockTransaction(h.mockDb, {
      insert: [[]],
      select: [[failed], []],
      update: [[]],
    });
    await expect(h.service.reserveOrReuse(reservation())).rejects.toThrow(
      'Solver job changed while reserving a retry',
    );
  });

  it('marks a queued job enqueued and maps every optional field', async () => {
    const h = harness();
    const full = row({
      Status: 'completed',
      RequestedEngine: 'ga',
      Result: completedCallback.result,
      ErrorCode: 'IGNORED',
      ErrorMessage: 'mapped',
      ErrorDetails: { retryable: false },
      EnqueuedAt: NOW,
      CompletedAt: NOW,
      FailedAt: NOW,
    });
    mockDbResult(h.mockDb.update as jest.Mock, [full]);
    const result = await h.service.markEnqueued(`solve-${JOB_UUID}`, ATTEMPT);
    expect(result).toMatchObject({
      requestedEngine: 'ga',
      result: completedCallback.result,
      error: {
        code: 'IGNORED',
        message: 'mapped',
        details: { retryable: false },
      },
      enqueuedAt: NOW.toISOString(),
      completedAt: NOW.toISOString(),
      failedAt: NOW.toISOString(),
    });
  });

  it('returns current state when markEnqueued is idempotent or token-mismatched', async () => {
    const h = harness();
    mockDbResult(h.mockDb.update as jest.Mock, []);
    mockDbResult(h.mockDb.select as jest.Mock, [row({ EnqueuedAt: NOW })]);
    await expect(
      h.service.markEnqueued(JOB_UUID, 'stale'),
    ).resolves.toMatchObject({
      status: 'queued',
      enqueuedAt: NOW.toISOString(),
    });
  });

  it('rejects markEnqueued for a missing job', async () => {
    const h = harness();
    mockDbResult(h.mockDb.update as jest.Mock, []);
    mockDbResult(h.mockDb.select as jest.Mock, []);
    await expect(h.service.markEnqueued(JOB_UUID, ATTEMPT)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('records infrastructure failure and preserves stale-token current state', async () => {
    const h = harness();
    const failed = row({
      Status: 'failed',
      ErrorCode: 'QUEUE',
      ErrorMessage: 'offline',
      ErrorDetails: { host: 'redis' },
      FailedAt: NOW,
    });
    mockDbResult(h.mockDb.update as jest.Mock, [failed]);
    await expect(
      h.service.markInfrastructureFailure(JOB_UUID, ATTEMPT, {
        code: 'QUEUE',
        message: 'offline',
        details: { host: 'redis' },
      }),
    ).resolves.toMatchObject({ status: 'failed', error: { code: 'QUEUE' } });

    const h2 = harness();
    mockDbResult(h2.mockDb.update as jest.Mock, []);
    mockDbResult(h2.mockDb.select as jest.Mock, [row()]);
    await expect(
      h2.service.markInfrastructureFailure(JOB_UUID, 'stale', {
        code: 'QUEUE',
        message: 'offline',
      }),
    ).resolves.toMatchObject({ status: 'queued' });
  });

  it('rejects infrastructure failure for a missing job', async () => {
    const h = harness();
    mockDbResult(h.mockDb.update as jest.Mock, []);
    mockDbResult(h.mockDb.select as jest.Mock, []);
    await expect(
      h.service.markInfrastructureFailure(JOB_UUID, ATTEMPT, {
        code: 'QUEUE',
        message: 'offline',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it.each([
    ['completed', completedCallback],
    ['failed', failedCallback],
  ] as const)('records a %s callback', async (_status, callback) => {
    const h = harness();
    const updated =
      callback.status === 'completed'
        ? row({
            Status: 'completed',
            Result: callback.result,
            CompletedAt: NOW,
          })
        : row({
            Status: 'failed',
            ErrorCode: callback.error.code,
            ErrorMessage: callback.error.message,
            ErrorDetails: callback.error.details,
            FailedAt: NOW,
          });
    mockTransaction(h.mockDb, { select: [[row()]], update: [[updated]] });
    await expect(
      h.service.recordCallback(JOB_UUID, ATTEMPT, callback),
    ).resolves.toMatchObject({ status: callback.status });
  });

  it.each([
    row({ Status: 'completed', Result: completedCallback.result }),
    row({
      Status: 'failed',
      ErrorCode: failedCallback.error.code,
      ErrorMessage: failedCallback.error.message,
      ErrorDetails: failedCallback.error.details,
    }),
  ])('accepts an equivalent repeated callback %#', async (existing) => {
    const h = harness();
    const callback =
      existing.Status === 'completed' ? completedCallback : failedCallback;
    mockTransaction(h.mockDb, { select: [[existing]] });
    await expect(
      h.service.recordCallback(JOB_UUID, ATTEMPT, callback),
    ).resolves.toMatchObject({ status: callback.status });
    expect(h.mockDb.update).not.toHaveBeenCalled();
  });

  it('rejects missing jobs, token mismatch, different repeats, terminal conflicts, and update races', async () => {
    const cases = [
      {
        existing: undefined,
        callback: completedCallback,
        message: 'not found',
      },
      {
        existing: row({ AttemptToken: NEW_ATTEMPT }),
        callback: completedCallback,
        message: 'active attempt',
      },
      {
        existing: row({
          Status: 'completed',
          Result: {
            ...completedCallback.result,
            outcome: 'best-effort',
          },
        }),
        callback: completedCallback,
        message: 'different completed callback',
      },
      {
        existing: row({ Status: 'failed' }),
        callback: completedCallback,
        message: 'already failed',
      },
    ];
    for (const testCase of cases) {
      const h = harness();
      mockTransaction(h.mockDb, {
        select: [testCase.existing ? [testCase.existing] : []],
      });
      await expect(
        h.service.recordCallback(JOB_UUID, ATTEMPT, testCase.callback as never),
      ).rejects.toThrow(testCase.message);
    }

    const raced = harness();
    mockTransaction(raced.mockDb, { select: [[row()]], update: [[]] });
    await expect(
      raced.service.recordCallback(JOB_UUID, ATTEMPT, completedCallback),
    ).rejects.toThrow('changed while recording callback');
  });

  it('supports scoped and unscoped lookup and missing results', async () => {
    const h = harness();
    mockSequentialResults(h.mockDb.select as jest.Mock, [[row()], [row()], []]);
    await expect(h.service.findJob(JOB_UUID)).resolves.toMatchObject({
      jobId: `solve-${JOB_UUID}`,
    });
    await expect(
      h.service.findJob(` solve-${JOB_UUID} `, { userId: 'user-1' }),
    ).resolves.toMatchObject({ userId: 'user-1' });
    await expect(h.service.findJob(JOB_UUID)).resolves.toBeUndefined();
  });

  it.each([
    [{ SolveMode: 'invalid' }, 'solve mode'],
    [{ RequestedEngine: 'invalid' }, 'engine'],
    [{ Status: 'invalid' }, 'status'],
  ])('rejects invalid persisted values %#', async (overrides, message) => {
    const h = harness();
    mockDbResult(h.mockDb.select as jest.Mock, [row(overrides)]);
    await expect(h.service.findJob(JOB_UUID)).rejects.toThrow(message);
  });

  it('parses and formats public IDs and rejects malformed IDs', () => {
    expect(parsePublicSolverJobId(` solve-${JOB_UUID} `)).toBe(JOB_UUID);
    expect(parsePublicSolverJobId(JOB_UUID)).toBe(JOB_UUID);
    expect(toPublicSolverJobId(JOB_UUID)).toBe(`solve-${JOB_UUID}`);
    expect(toPublicSolverJobId(`solve-${JOB_UUID}`)).toBe(`solve-${JOB_UUID}`);
    expect(() => parsePublicSolverJobId('bad')).toThrow(NotFoundException);
  });
});

function reservation() {
  return {
    userId: 'user-1',
    solveMode: 'optimization' as const,
    requestedEngine: 'auto' as const,
    deduplicationKey: 'fingerprint-1',
    solverInput: createSolverJob().Input,
  };
}

function row(overrides: Partial<SolverJob> = {}): SolverJob {
  return createSolverJob({
    JobID: JOB_UUID,
    UserID: 'user-1',
    AttemptToken: ATTEMPT,
    DeduplicationKey: 'fingerprint-1',
    SolveMode: 'optimization',
    RequestedEngine: null,
    CreatedAt: NOW,
    UpdatedAt: NOW,
    ...overrides,
  });
}
