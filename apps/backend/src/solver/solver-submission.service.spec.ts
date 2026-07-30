import {
  createSolverInput,
  createSolverJobRecord,
  createSolverSubmissionInput,
} from '../Testing/Factories';
import { SolverSubmissionService } from './solver-submission.service';

describe('SolverSubmissionService semantic deduplication', () => {
  it.each(['queued', 'completed'] as const)(
    'returns a reused %s job without enqueueing',
    async (status) => {
      const harness = createHarness();
      const existing = createRecord(status);
      harness.store.reserveOrReuse.mockResolvedValue({
        kind: 'reused',
        record: existing,
      });

      await expect(harness.service.submit(submissionInput)).resolves.toBe(
        existing,
      );
      expect(harness.queue.enqueueTimetableSolveJob).not.toHaveBeenCalled();
    },
  );

  it('enqueues a newly reserved job using only the worker contract', async () => {
    const harness = createHarness();
    const queued = createRecord('queued');
    harness.store.reserveOrReuse.mockResolvedValue({
      kind: 'reserved',
      record: queued,
    });
    harness.store.markEnqueued.mockResolvedValue(queued);

    await expect(harness.service.submit(submissionInput)).resolves.toBe(queued);
    expect(harness.inputBuilder.buildForSubmission).toHaveBeenCalledWith(
      submissionInput.userId,
      submissionInput.eventIds,
      { heuristics: [] },
    );
    expect(harness.store.reserveOrReuse).toHaveBeenCalledWith({
      userId: submissionInput.userId,
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
    const queued = createRecord('queued');
    harness.store.reserveOrReuse.mockResolvedValue({
      kind: 'reserved',
      record: queued,
    });
    harness.queue.enqueueTimetableSolveJob.mockRejectedValue(
      new Error('Redis unavailable'),
    );

    await expect(harness.service.submit(submissionInput)).rejects.toThrow(
      'Solver job could not be enqueued',
    );
    expect(harness.store.markInfrastructureFailure).not.toHaveBeenCalled();
    expect(harness.store.markEnqueued).not.toHaveBeenCalled();
  });

  it('uses auto when a reserved legacy record has no requested engine', async () => {
    const harness = createHarness();
    const queued = {
      ...createRecord('queued'),
      requestedEngine: undefined,
    };
    harness.store.reserveOrReuse.mockResolvedValue({
      kind: 'reserved',
      record: queued,
    });
    harness.store.markEnqueued.mockResolvedValue(queued);
    await harness.service.submit(submissionInput);
    expect(harness.queue.enqueueTimetableSolveJob).toHaveBeenCalledWith(
      expect.objectContaining({ engine: 'auto' }),
    );
  });

  it.each([
    ['input builder', 'inputBuilder', 'buildForSubmission'],
    ['fingerprint', 'fingerprintService', 'compute'],
    ['reservation', 'store', 'reserveOrReuse'],
  ] as const)(
    'propagates %s failure and makes no unintended later calls',
    async (_label, collaborator, method) => {
      const harness = createHarness();
      const failure = new Error(`${collaborator} failed`);
      const target = harness[collaborator] as unknown as Record<
        string,
        jest.Mock
      >;
      target[method].mockImplementationOnce(() => {
        throw failure;
      });

      await expect(harness.service.submit(submissionInput)).rejects.toBe(
        failure,
      );
      if (collaborator === 'inputBuilder') {
        expect(harness.fingerprintService.compute).not.toHaveBeenCalled();
        expect(harness.store.reserveOrReuse).not.toHaveBeenCalled();
      }
      if (collaborator !== 'store') {
        expect(harness.queue.enqueueTimetableSolveJob).not.toHaveBeenCalled();
      }
      expect(harness.store.markEnqueued).not.toHaveBeenCalled();
    },
  );

  function createHarness() {
    const store = {
      reserveOrReuse: jest.fn(),
      markEnqueued: jest.fn(),
      markInfrastructureFailure: jest.fn(),
    };
    const queue = { enqueueTimetableSolveJob: jest.fn() };
    const inputBuilder = {
      buildForSubmission: jest.fn().mockResolvedValue(solverInput),
    };
    const fingerprintService = {
      compute: jest.fn().mockReturnValue(deduplicationKey),
    };
    return {
      store,
      queue,
      inputBuilder,
      fingerprintService,
      service: new SolverSubmissionService(
        store as never,
        queue as never,
        inputBuilder as never,
        fingerprintService,
      ),
    };
  }
});

const solverInput = createSolverInput();
const deduplicationKey = `solver-semantic-sha256-v2:${'a'.repeat(64)}`;

const submissionInput = createSolverSubmissionInput({
  userId: '11111111-1111-4111-8111-111111111111',
  eventIds: ['22222222-2222-4222-8222-222222222222'],
});

function createRecord(status: 'queued' | 'completed' | 'failed') {
  return createSolverJobRecord({
    jobId: 'solve-22222222-2222-4222-8222-222222222222',
    userId: submissionInput.userId,
    deduplicationKey,
    attemptToken: '33333333-3333-4333-8333-333333333333',
    input: solverInput,
    status,
    createdAt: '2026-07-13T00:00:00.000Z',
    updatedAt: '2026-07-13T00:00:00.000Z',
  });
}
