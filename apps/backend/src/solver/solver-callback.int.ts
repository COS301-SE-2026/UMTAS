import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { join } from 'node:path';
import type { TimetableSolveJobData } from 'shared-types';
import request from 'supertest';
import type * as schema from '../db/schema';
import { DatabaseService } from '../db/database.service';
import { solverJob, usersTable } from '../entities';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import { QueueProducerService } from '../jobs/queue-producer.service';
import { SolverController } from './solver.controller';
import { SolverInputBuilderService } from './solver-input-builder.service';
import {
  SOLVER_RESERVATION_STALE_AFTER_MS,
  SolverJobStoreService,
  parsePublicSolverJobId,
} from './solver-job-store.service';
import { SolverFingerprintService } from './solver-fingerprint.service';
import { SolverSubmissionService } from './solver-submission.service';

describe('Solver callback endpoint (PGLite)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let jobStore: SolverJobStoreService;
  let enqueueError: Error | undefined;
  let enqueueCalls: TimetableSolveJobData[] = [];
  const attemptTokens = new Map<string, string>();
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
        SolverFingerprintService,
        SolverSubmissionService,
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
    await databaseService.db.insert(usersTable).values({
      id: userId,
      name: 'Solver User',
      email: 'solver-user@example.com',
      emailVerified: true,
      role: 'student',
      banned: false,
      createdAt: new Date('2026-07-13T00:00:00Z'),
      updatedAt: new Date('2026-07-13T00:00:00Z'),
    });

    app = moduleRef.createNestApplication();
    app.use(
      (
        request: { session?: unknown },
        _response: unknown,
        next: () => void,
      ) => {
        request.session = { user: { id: userId } };
        next();
      },
    );
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

  it('rejects invalid explicit selections before persisting or enqueueing', async () => {
    await request(app.getHttpServer())
      .post('/solver/jobs')
      .send({
        eventIds: [],
        solveMode: 'optimization',
        engine: 'auto',
      })
      .expect(400);

    expect(enqueueCalls).toEqual([]);
  });

  it('uses enrollment selection while stripping removed request fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/solver/jobs')
      .send({
        jobId: 'removed-client-id',
        solverProfileKey: 'removed-profile',
        solveMode: 'feasibility',
      })
      .expect(202);

    expect(enqueueCalls).toHaveLength(1);
    expect(enqueueCalls[0]).toEqual({
      jobId: response.body.jobId,
      attemptToken: expect.any(String),
      solveMode: 'feasibility',
      engine: 'auto',
    });
    await request(app.getHttpServer())
      .get(`/solver/jobs/${response.body.jobId}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).not.toHaveProperty('solverProfileKey');
      });
  });

  it('retries an ambiguous enqueue with the same queue identity after lease expiry', async () => {
    enqueueError = new Error('Redis unavailable');
    const payload = {
      solveMode: 'optimization',
      engine: 'auto',
    };

    await request(app.getHttpServer())
      .post('/solver/jobs')
      .send(payload)
      .expect(500);

    const firstAttempt = enqueueCalls[0];
    await databaseService.db
      .update(solverJob)
      .set({
        UpdatedAt: new Date(Date.now() - SOLVER_RESERVATION_STALE_AFTER_MS - 1),
      })
      .where(eq(solverJob.JobID, parsePublicSolverJobId(firstAttempt.jobId)));

    const response = await request(app.getHttpServer())
      .post('/solver/jobs')
      .send(payload)
      .expect(202);

    expect(response.body).toMatchObject({
      accepted: true,
      status: 'queued',
    });
    expect(response.body.jobId).toMatch(/^solve-/);
    expect(enqueueCalls).toHaveLength(2);
    expect(enqueueCalls[1]).toMatchObject({
      jobId: enqueueCalls[0]?.jobId,
      solveMode: 'optimization',
      engine: 'auto',
    });
    expect(enqueueCalls[1]?.attemptToken).toBe(firstAttempt.attemptToken);

    await request(app.getHttpServer())
      .post(`/solver/jobs/${response.body.jobId}/callback`)
      .query({ attemptToken: firstAttempt.attemptToken })
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        status: 'failed',
        error: { code: 'SOLVER_FAILED', message: 'delayed callback' },
      })
      .expect(202);
    await request(app.getHttpServer())
      .get(`/solver/jobs/${response.body.jobId}`)
      .expect(200)
      .expect(({ body }) => expect(body.status).toBe('failed'));
  });

  it('persists successful callbacks and accepts equivalent retries idempotently', async () => {
    const jobId = await createQueuedJob('a');

    await callback(jobId, {
      status: 'completed',
      result: completedResult,
    }).expect(202, { accepted: true, jobId });

    await callback(jobId, {
      status: 'completed',
      result: {
        metadata: completedResult.metadata,
        heuristicScores: [],
        timetableSolution: { selectedEventIds: [] },
        engine: 'cp-sat',
        outcome: 'conflict-free',
      },
    }).expect(202, { accepted: true, jobId });

    await expect(
      jobStore.recordCallback(jobId, attemptTokens.get(jobId)!, {
        status: 'completed',
        result: {
          engine: 'cp-sat',
          outcome: 'conflict-free',
          timetableSolution: { selectedEventIds: ['different'] },
          heuristicScores: [],
          metadata: completedResult.metadata,
        },
      }),
    ).rejects.toThrow('different completed callback');
  });

  it('persists failed callbacks with structured worker error details', async () => {
    const jobId = await createQueuedJob('b');

    await callback(jobId, {
      status: 'failed',
      error: {
        code: 'SOLVER_FAILED',
        message: 'solver exited 1',
        details: { exitCode: 1, stderr: 'infeasible input' },
      },
    }).expect(202, { accepted: true, jobId });

    await expect(
      jobStore.recordCallback(jobId, attemptTokens.get(jobId)!, {
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

    const jobId = await createQueuedJob('c');
    await callback(jobId, {
      status: 'failed',
      error: { code: 'SOLVER_FAILED', message: 'first failure' },
    }).expect(202);
    await callback(jobId, {
      status: 'completed',
      result: completedResult,
    }).expect(409);
  });

  it('rejects invalid worker tokens before recording callbacks', async () => {
    const jobId = await createQueuedJob('d');

    await request(app.getHttpServer())
      .post(`/solver/jobs/${jobId}/callback`)
      .set('Authorization', 'Bearer wrong-token')
      .send({ status: 'completed', result: completedResult })
      .expect(401);
  });

  it('serves worker input and exposes persisted status and results', async () => {
    const jobId = await createQueuedJob('e');

    await request(app.getHttpServer())
      .get(`/solver/jobs/${jobId}/input`)
      .set('Authorization', `Bearer ${workerToken}`)
      .expect(200, {
        schedulingProblem: { events: [] },
        preferences: { heuristics: [] },
      });

    await request(app.getHttpServer())
      .get(`/solver/jobs/${jobId}/input`)
      .set('Authorization', 'Bearer wrong-token')
      .expect(401);

    await callback(jobId, {
      status: 'completed',
      result: completedResult,
    }).expect(202);

    await request(app.getHttpServer())
      .get(`/solver/jobs/${jobId}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          jobId,
          status: 'completed',
          result: completedResult,
        });
      });

    await request(app.getHttpServer())
      .get(`/solver/jobs/${jobId}/result`)
      .expect(200, completedResult);
  });

  function callback(jobId: string, payload: object) {
    const attemptToken = attemptTokens.get(jobId) ?? unknownAttemptToken;
    return request(app.getHttpServer())
      .post(`/solver/jobs/${jobId}/callback`)
      .query({ attemptToken })
      .set('Authorization', `Bearer ${workerToken}`)
      .send(payload);
  }

  async function createQueuedJob(keySeed: string): Promise<string> {
    const reservation = await jobStore.reserveOrReuse({
      userId,
      solveMode: 'optimization',
      requestedEngine: 'auto',
      deduplicationKey: `solver-semantic-sha256-v2:${keySeed.repeat(64)}`,
      solverInput: {
        schedulingProblem: { events: [] },
        preferences: { heuristics: [] },
      },
    });
    attemptTokens.set(
      reservation.record.jobId,
      reservation.record.attemptToken,
    );
    return reservation.record.jobId;
  }
});

const workerToken = 'test-worker-callback-token';
const unknownAttemptToken = '99999999-9999-4999-8999-999999999999';
const userId = '11111111-1111-4111-8111-111111111111';
const completedResult = {
  engine: 'cp-sat',
  outcome: 'conflict-free',
  timetableSolution: { selectedEventIds: [] },
  heuristicScores: [],
  metadata: {
    conflictCount: 0,
    conflicts: [],
    solveMode: 'optimization' as const,
  },
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
