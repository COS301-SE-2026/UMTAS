import { SolverSubmissionService } from './solver-submission.service';

describe('SolverSubmissionService semantic deduplication', () => {
  it.each(['queued', 'completed'] as const)(
    'returns a reused %s job without enqueueing',
    async (status) => {
      const harness = createHarness();
      const existing = record(status);
      harness.store.reserveOrReuse.mockResolvedValue({
        kind: 'reused',
        record: existing,
      });

      await expect(harness.service.submit(request())).resolves.toBe(existing);
      expect(harness.queue.enqueueTimetableSolveJob).not.toHaveBeenCalled();
    },
  );

  it('enqueues a newly reserved job using only the worker contract', async () => {
    const harness = createHarness();
    const queued = record('queued');
    harness.store.reserveOrReuse.mockResolvedValue({
      kind: 'reserved',
      record: queued,
    });
    harness.store.markEnqueued.mockResolvedValue(queued);

    await expect(harness.service.submit(request())).resolves.toBe(queued);
    expect(harness.store.reserveOrReuse).toHaveBeenCalledWith({
      userId: request().userId,
      solverProfileKey: 'default',
      solveMode: 'optimization',
      requestedEngine: 'auto',
      deduplicationKey,
      solverInput,
    });
    expect(harness.queue.enqueueTimetableSolveJob).toHaveBeenCalledWith({
      jobId: queued.jobId,
      attemptToken: queued.attemptToken,
      solveMode: 'optimization',
      engine: 'auto',
    });
    expect(harness.store.markEnqueued).toHaveBeenCalledWith(
      queued.jobId,
      queued.attemptToken,
    );
  });

  it('leaves ambiguous enqueue failures unacknowledged for recovery', async () => {
    const harness = createHarness();
    const queued = record('queued');
    harness.store.reserveOrReuse.mockResolvedValue({
      kind: 'reserved',
      record: queued,
    });
    harness.queue.enqueueTimetableSolveJob.mockRejectedValue(
      new Error('Redis unavailable'),
    );

    await expect(harness.service.submit(request())).rejects.toThrow(
      'Solver job could not be enqueued',
    );
    expect(harness.store.markInfrastructureFailure).not.toHaveBeenCalled();
    expect(harness.store.markEnqueued).not.toHaveBeenCalled();
  });

  function createHarness() {
    const store = {
      reserveOrReuse: jest.fn(),
      markEnqueued: jest.fn(),
      markInfrastructureFailure: jest.fn(),
    };
    const queue = { enqueueTimetableSolveJob: jest.fn() };
    const inputBuilder = {
      buildForProfile: jest.fn().mockResolvedValue(solverInput),
    };
    const fingerprintService = {
      compute: jest.fn().mockReturnValue(deduplicationKey),
    };
    return {
      store,
      queue,
      service: new SolverSubmissionService(
        store as never,
        queue as never,
        inputBuilder as never,
        fingerprintService,
      ),
    };
  }
});

const solverInput = {
  schedulingProblem: { events: [] },
  preferences: { heuristics: [] },
};
const deduplicationKey = `solver-semantic-sha256-v1:${'a'.repeat(64)}`;

function request() {
  return {
    userId: '11111111-1111-4111-8111-111111111111',
    solverProfileKey: 'default',
    solveMode: 'optimization' as const,
    engine: 'auto' as const,
    preferences: { heuristics: [] },
  };
}

function record(status: 'queued' | 'completed' | 'failed') {
  return {
    jobId: 'solve-22222222-2222-4222-8222-222222222222',
    userId: request().userId,
    solverProfileKey: 'default',
    solveMode: 'optimization' as const,
    requestedEngine: 'auto' as const,
    deduplicationKey,
    attemptToken: '33333333-3333-4333-8333-333333333333',
    input: solverInput,
    preferences: solverInput.preferences,
    status,
    createdAt: '2026-07-13T00:00:00.000Z',
    updatedAt: '2026-07-13T00:00:00.000Z',
  };
}
