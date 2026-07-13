import { InternalServerErrorException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../auth/auth.guard';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import { QueueProducerService } from '../jobs/queue-producer.service';
import { SolverController } from './solver.controller';
import { SolverInputBuilderService } from './solver-input-builder.service';
import { SolverJobStoreService } from './solver-job-store.service';

describe('SolverController auth metadata', () => {
  it('keeps worker callbacks public for bearer-token guard access', () => {
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_KEY,
        SolverController.prototype.receiveCallback,
      ),
    ).toBe(true);
  });
});

describe('SolverController', () => {
  let jobStore: {
    createQueuedJob: jest.Mock;
    markInfrastructureFailure: jest.Mock;
    recordCallback: jest.Mock;
    retryFailedJob: jest.Mock;
    findJob: jest.Mock;
  };
  let queueProducer: { enqueueTimetableSolveJob: jest.Mock };
  let controller: SolverController;

  beforeEach(async () => {
    jobStore = {
      createQueuedJob: jest.fn(),
      markInfrastructureFailure: jest.fn(),
      recordCallback: jest.fn(),
      retryFailedJob: jest.fn(),
      findJob: jest.fn(),
    };
    queueProducer = { enqueueTimetableSolveJob: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [SolverController],
      providers: [
        { provide: SolverJobStoreService, useValue: jobStore },
        { provide: QueueProducerService, useValue: queueProducer },
        {
          provide: SolverInputBuilderService,
          useValue: { build: jest.fn() },
        },
        {
          provide: WorkerCallbackAuthGuard,
          useValue: { canActivate: jest.fn() },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(SolverController);
  });

  it('persists the solver job before enqueueing it for a worker callback', async () => {
    const calls: string[] = [];
    jobStore.createQueuedJob.mockImplementation(async () => {
      calls.push('persist');
    });
    queueProducer.enqueueTimetableSolveJob.mockImplementation(async () => {
      calls.push('enqueue');
    });

    await expect(
      controller.submitAndEnqueue({
        jobId: 'solve-1',
        solverProfileKey: 'default',
        solveMode: 'optimization',
        engine: 'auto',
      }),
    ).resolves.toEqual({ accepted: true, jobId: 'solve-1' });

    expect(jobStore.createQueuedJob).toHaveBeenCalledWith({
      jobId: 'solve-1',
      solverProfileKey: 'default',
      solveMode: 'optimization',
      requestedEngine: 'auto',
    });
    expect(queueProducer.enqueueTimetableSolveJob).toHaveBeenCalledWith({
      jobId: 'solve-1',
      solverProfileKey: 'default',
      solveMode: 'optimization',
      engine: 'auto',
    });
    expect(calls).toEqual(['persist', 'enqueue']);
  });

  it('rejects whitespace-only job identifiers using the shared queue contract', async () => {
    await expect(
      controller.submitAndEnqueue({
        jobId: '   ',
        solverProfileKey: '\t',
        solveMode: 'optimization',
        engine: 'auto',
      }),
    ).rejects.toThrow(
      'Timetable solve job did not match the shared queue contract',
    );

    expect(jobStore.createQueuedJob).not.toHaveBeenCalled();
    expect(queueProducer.enqueueTimetableSolveJob).not.toHaveBeenCalled();
  });

  it('marks a persisted job failed when enqueueing fails', async () => {
    queueProducer.enqueueTimetableSolveJob.mockRejectedValue(
      new Error('Redis unavailable'),
    );

    await expect(
      controller.submitAndEnqueue({
        jobId: 'solve-retryable',
        solverProfileKey: 'default',
        solveMode: 'optimization',
        engine: 'auto',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(jobStore.markInfrastructureFailure).toHaveBeenCalledWith(
      'solve-retryable',
      {
        code: 'SOLVER_ENQUEUE_FAILED',
        message: 'Solver job could not be enqueued',
        details: { cause: 'Redis unavailable' },
      },
    );
  });

  it('validates and persists completed worker callbacks through the store', async () => {
    await expect(
      controller.receiveCallback('solve-1', {
        status: 'completed',
        result: completedResult,
      }),
    ).resolves.toEqual({ accepted: true, jobId: 'solve-1' });

    expect(jobStore.recordCallback).toHaveBeenCalledWith('solve-1', {
      status: 'completed',
      result: completedResult,
    });
  });

  it('returns persisted job status and completed results', async () => {
    const job = {
      jobId: 'solve-1',
      solverProfileKey: 'default',
      solveMode: 'optimization',
      status: 'completed',
      result: completedResult,
      createdAt: '2026-07-13T10:00:00.000Z',
      updatedAt: '2026-07-13T10:01:00.000Z',
    };
    jobStore.findJob.mockResolvedValue(job);

    await expect(controller.getJob('solve-1')).resolves.toEqual(job);
    await expect(controller.getJobResult('solve-1')).resolves.toEqual(
      completedResult,
    );
  });

  it('validates and persists failed worker callbacks through the store', async () => {
    const error = { code: 'SOLVER_FAILED', message: 'solver exited 1' };

    await expect(
      controller.receiveCallback('solve-1', { status: 'failed', error }),
    ).resolves.toEqual({ accepted: true, jobId: 'solve-1' });

    expect(jobStore.recordCallback).toHaveBeenCalledWith('solve-1', {
      status: 'failed',
      error,
    });
  });

  it('rejects callback payloads that do not match the shared solver contract', async () => {
    await expect(
      controller.receiveCallback('solve-1', {
        status: 'completed',
      }),
    ).rejects.toThrow(
      'Solver callback did not match the shared solver contract',
    );

    expect(jobStore.recordCallback).not.toHaveBeenCalled();
  });
});

const completedResult = {
  engine: 'cp-sat' as const,
  timetableSolution: { selectedEventIds: [] },
  heuristicScores: [],
  metadata: {},
};
