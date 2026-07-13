import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { join } from 'node:path';
import type { TimetableSolveJobData } from 'shared-types';
import request from 'supertest';
import type * as schema from '../db/schema';
import { DatabaseService } from '../db/database.service';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import { QueueProducerService } from '../jobs/queue-producer.service';
import { SolverController } from './solver.controller';
import { SolverInputBuilderService } from './solver-input-builder.service';
import { SolverJobStoreService } from './solver-job-store.service';

describe('Solver callback endpoint (PGLite)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let jobStore: SolverJobStoreService;
  let enqueueError: Error | undefined;
  let enqueueCalls: TimetableSolveJobData[] = [];
  const queueProducer = {
    enqueueTimetableSolveJob: async (job: TimetableSolveJobData) => {
      enqueueCalls.push(job);
      if (enqueueError) {
        const error = enqueueError;
        enqueueError = undefined;
        throw error;
      }
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SolverController],
      providers: [
        SolverJobStoreService,
        SolverInputBuilderService,
        {
          provide: QueueProducerService,
          useValue: queueProducer,
        },
        WorkerCallbackAuthGuard,
        DatabaseService,
        {
          provide: ConfigService,
          useValue: new ConfigService({
            DB_MODE: 'PGLITE',
            WORKER_CALLBACK_TOKEN: workerToken,
          }),
        },
      ],
    }).compile();

    databaseService = moduleRef.get(DatabaseService);
    jobStore = moduleRef.get(SolverJobStoreService);
    await migratePglite(toPgliteDatabase(databaseService), {
      migrationsFolder: join(process.cwd(), 'drizzle'),
    });

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    enqueueError = undefined;
    enqueueCalls = [];
  });

  it('rejects whitespace-only identifiers before persisting or enqueueing', async () => {
    await request(app.getHttpServer())
      .post('/solver/jobs')
      .send({
        jobId: '   ',
        solverProfileKey: '\t',
        solveMode: 'optimization',
        engine: 'auto',
      })
      .expect(400);

    expect(enqueueCalls).toEqual([]);
  });

  it('allows the same job ID to be resubmitted after enqueue failure', async () => {
    enqueueError = new Error('Redis unavailable');
    const payload = {
      jobId: 'solve-enqueue-retry',
      solverProfileKey: ' default ',
      solveMode: 'optimization',
      engine: 'auto',
    };

    await request(app.getHttpServer())
      .post('/solver/jobs')
      .send(payload)
      .expect(500);

    await request(app.getHttpServer())
      .post('/solver/jobs')
      .send(payload)
      .expect(202, { accepted: true, jobId: 'solve-enqueue-retry' });

    expect(enqueueCalls.at(-1)).toEqual({
      ...payload,
      solverProfileKey: 'default',
    });
  });

  it('persists successful callbacks and accepts equivalent retries idempotently', async () => {
    await createQueuedJob('solve-completed');

    await callback('solve-completed', {
      status: 'completed',
      result: completedResult,
    }).expect(202, { accepted: true, jobId: 'solve-completed' });

    await callback('solve-completed', {
      status: 'completed',
      result: {
        metadata: {},
        heuristicScores: [],
        timetableSolution: { selectedEventIds: [] },
        engine: 'cp-sat',
      },
    }).expect(202, { accepted: true, jobId: 'solve-completed' });

    await expect(
      jobStore.recordCallback('solve-completed', {
        status: 'completed',
        result: {
          engine: 'cp-sat',
          timetableSolution: { selectedEventIds: ['different'] },
          heuristicScores: [],
          metadata: {},
        },
      }),
    ).rejects.toThrow('different completed callback');
  });

  it('persists failed callbacks with structured worker error details', async () => {
    await createQueuedJob('solve-failed');

    await callback('solve-failed', {
      status: 'failed',
      error: {
        code: 'SOLVER_FAILED',
        message: 'solver exited 1',
        details: { exitCode: 1, stderr: 'infeasible input' },
      },
    }).expect(202, { accepted: true, jobId: 'solve-failed' });

    await expect(
      jobStore.recordCallback('solve-failed', {
        status: 'failed',
        error: {
          code: 'SOLVER_FAILED',
          message: 'solver exited 1',
          details: { stderr: 'infeasible input', exitCode: 1 },
        },
      }),
    ).resolves.toMatchObject({
      status: 'failed',
      error: {
        code: 'SOLVER_FAILED',
        message: 'solver exited 1',
        details: { exitCode: 1, stderr: 'infeasible input' },
      },
      failedAt: expect.any(String),
    });
  });

  it('returns parser-matching errors for unknown jobs and invalid state transitions', async () => {
    await callback('unknown-job', {
      status: 'failed',
      error: { code: 'SOLVER_FAILED', message: 'missing' },
    }).expect(404);

    await createQueuedJob('solve-invalid-transition');
    await callback('solve-invalid-transition', {
      status: 'failed',
      error: { code: 'SOLVER_FAILED', message: 'first failure' },
    }).expect(202);
    await callback('solve-invalid-transition', {
      status: 'completed',
      result: completedResult,
    }).expect(409);
  });

  it('rejects invalid worker tokens before recording callbacks', async () => {
    await createQueuedJob('solve-invalid-token');

    await request(app.getHttpServer())
      .post('/solver/jobs/solve-invalid-token/callback')
      .set('Authorization', 'Bearer wrong-token')
      .send({ status: 'completed', result: completedResult })
      .expect(401);
  });

  it('serves worker input and exposes persisted status and results', async () => {
    await createQueuedJob('solve-readable');

    await request(app.getHttpServer())
      .get('/solver/jobs/solve-readable/input')
      .set('Authorization', `Bearer ${workerToken}`)
      .expect(200, {
        schedulingProblem: { events: [] },
        preferences: { heuristics: [] },
      });

    await request(app.getHttpServer())
      .get('/solver/jobs/solve-readable/input')
      .set('Authorization', 'Bearer wrong-token')
      .expect(401);

    await callback('solve-readable', {
      status: 'completed',
      result: completedResult,
    }).expect(202);

    await request(app.getHttpServer())
      .get('/solver/jobs/solve-readable')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          jobId: 'solve-readable',
          status: 'completed',
          result: completedResult,
        });
      });

    await request(app.getHttpServer())
      .get('/solver/jobs/solve-readable/result')
      .expect(200, completedResult);
  });

  function callback(jobId: string, payload: object) {
    return request(app.getHttpServer())
      .post(`/solver/jobs/${jobId}/callback`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send(payload);
  }

  function createQueuedJob(jobId: string) {
    return jobStore.createQueuedJob({
      jobId,
      solverProfileKey: 'default',
      solveMode: 'optimization',
      requestedEngine: 'auto',
    });
  }
});

const workerToken = 'test-worker-callback-token';
const completedResult = {
  engine: 'cp-sat',
  timetableSolution: { selectedEventIds: [] },
  heuristicScores: [],
  metadata: {},
};

function toPgliteDatabase(
  databaseService: DatabaseService,
): PgliteDatabase<typeof schema> {
  if (!databaseService.pglite) {
    throw new Error(
      'Expected PGLite database service for solver integration test',
    );
  }

  return databaseService.db;
}
