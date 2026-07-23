import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../auth/auth.guard';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import { SolverController } from './solver.controller';
import { SolverInputBuilderService } from './solver-input-builder.service';
import { SolverJobStoreService } from './solver-job-store.service';
import { SolverSubmissionService } from './solver-submission.service';

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
    recordCallback: jest.Mock;
    findJob: jest.Mock;
  };
  let submission: { submit: jest.Mock };
  let controller: SolverController;

  beforeEach(async () => {
    jobStore = {
      recordCallback: jest.fn(),
      findJob: jest.fn(),
    };
    submission = { submit: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [SolverController],
      providers: [
        { provide: SolverJobStoreService, useValue: jobStore },
        { provide: SolverSubmissionService, useValue: submission },
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

  it('submits an authenticated semantic request and returns the backend job ID', async () => {
    submission.submit.mockResolvedValue({
      jobId: 'solve-backend-id',
      status: 'queued',
    });

    await expect(
      controller.submitAndEnqueue(session, {
        solveMode: 'optimization',
        engine: 'auto',
      }),
    ).resolves.toEqual({
      accepted: true,
      jobId: 'solve-backend-id',
      status: 'queued',
      result: undefined,
    });

    expect(submission.submit).toHaveBeenCalledWith({
      userId: 'user-1',
      solveMode: 'optimization',
      engine: 'auto',
      preferences: { heuristics: [] },
    });
  });

  it('forwards an explicit event selection unchanged', async () => {
    submission.submit.mockResolvedValue({
      jobId: 'solve-backend-id',
      status: 'queued',
    });
    const eventIds = [
      '00000000-0000-4000-8000-000000000004',
      '00000000-0000-4000-8000-000000000005',
    ];

    await controller.submitAndEnqueue(session, {
      eventIds,
      solveMode: 'feasibility',
    });

    expect(submission.submit).toHaveBeenCalledWith({
      userId: 'user-1',
      eventIds,
      solveMode: 'feasibility',
      engine: 'auto',
      preferences: { heuristics: [] },
    });
  });

  it.each([
    [[]],
    [['not-a-uuid']],
    [
      [
        '00000000-0000-4000-8000-000000000004',
        '00000000-0000-4000-8000-000000000004',
      ],
    ],
  ])(
    'rejects malformed explicit event IDs before submission',
    async (eventIds) => {
      await expect(
        controller.submitAndEnqueue(session, {
          eventIds,
          solveMode: 'optimization',
          engine: 'auto',
        }),
      ).rejects.toThrow(
        'Timetable solve job did not match the shared queue contract',
      );

      expect(submission.submit).not.toHaveBeenCalled();
    },
  );

  it('validates and persists completed worker callbacks through the store', async () => {
    await expect(
      controller.receiveCallback('solve-1', attemptToken, {
        status: 'completed',
        result: completedResult,
      }),
    ).resolves.toEqual({ accepted: true, jobId: 'solve-1' });

    expect(jobStore.recordCallback).toHaveBeenCalledWith(
      'solve-1',
      attemptToken,
      {
        status: 'completed',
        result: completedResult,
      },
    );
  });

  it('returns persisted job status and completed results', async () => {
    const job = {
      jobId: 'solve-1',
      solveMode: 'optimization',
      status: 'completed',
      result: completedResult,
      createdAt: '2026-07-13T10:00:00.000Z',
      updatedAt: '2026-07-13T10:01:00.000Z',
    };
    jobStore.findJob.mockResolvedValue(job);

    await expect(controller.getJob(session, 'solve-1')).resolves.toEqual(job);
    await expect(controller.getJobResult(session, 'solve-1')).resolves.toEqual(
      completedResult,
    );
    expect(jobStore.findJob).toHaveBeenCalledWith('solve-1', {
      userId: 'user-1',
    });
  });

  it("does not expose another user's job status or result", async () => {
    jobStore.findJob.mockResolvedValue(undefined);
    await expect(controller.getJob(session, 'guessed-id')).rejects.toThrow(
      'Solver job not found',
    );
    await expect(
      controller.getJobResult(session, 'guessed-id'),
    ).rejects.toThrow('Solver result not found');
    expect(jobStore.findJob).toHaveBeenCalledWith('guessed-id', {
      userId: 'user-1',
    });
  });

  it('validates and persists failed worker callbacks through the store', async () => {
    const error = { code: 'SOLVER_FAILED', message: 'solver exited 1' };

    await expect(
      controller.receiveCallback('solve-1', attemptToken, {
        status: 'failed',
        error,
      }),
    ).resolves.toEqual({ accepted: true, jobId: 'solve-1' });

    expect(jobStore.recordCallback).toHaveBeenCalledWith(
      'solve-1',
      attemptToken,
      {
        status: 'failed',
        error,
      },
    );
  });

  it('rejects callback payloads that do not match the shared solver contract', async () => {
    await expect(
      controller.receiveCallback('solve-1', attemptToken, {
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
  outcome: 'conflict-free' as const,
  timetableSolution: { selectedEventIds: [] },
  heuristicScores: [],
  metadata: {
    conflictCount: 0,
    conflicts: [],
    solveMode: 'optimization' as const,
  },
};

const session = { user: { id: 'user-1' } } as never;
const attemptToken = '11111111-1111-4111-8111-111111111111';
