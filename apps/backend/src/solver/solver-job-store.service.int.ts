import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { join } from 'node:path';
import type * as schema from '../db/schema';
import { DatabaseService } from '../db/database.service';
import { solverJob, usersTable } from '../entities';
import {
  SOLVER_RESERVATION_STALE_AFTER_MS,
  SolverJobStoreService,
  parsePublicSolverJobId,
} from './solver-job-store.service';

describe('SolverJobStoreService', () => {
  let databaseService: DatabaseService;
  let service: SolverJobStoreService;

  beforeEach(async () => {
    databaseService = new DatabaseService(
      new ConfigService({ DB_MODE: 'PGLITE' }),
    );
    await migratePglite(toPgliteDatabase(databaseService), {
      migrationsFolder: join(process.cwd(), 'drizzle'),
    });
    await databaseService.db.insert(usersTable).values({
      id: userId,
      name: 'Solver User',
      email: 'solver-store@example.com',
      emailVerified: true,
      role: 'student',
      banned: false,
      createdAt: new Date('2026-07-13T00:00:00.000Z'),
      updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    });
    service = new SolverJobStoreService(databaseService);
  });

  afterEach(async () => {
    await databaseService.onModuleDestroy();
  });

  it('reserves one database job for concurrent equivalent requests', async () => {
    const first = service.reserveOrReuse(reservation);
    const second = service.reserveOrReuse(reservation);
    const results = await Promise.all([first, second]);
    const reserved = results.filter((result) => result.kind === 'reserved');
    const reused = results.filter((result) => result.kind === 'reused');

    expect(reserved).toHaveLength(1);
    expect(reused).toHaveLength(1);
    expect(results[0]?.record.jobId).toBe(results[1]?.record.jobId);
    expect(results[0]?.record.jobId).toMatch(/^solve-[0-9a-f-]{36}$/);
  });

  it('atomically requeues a failed duplicate using the same public job ID', async () => {
    const initial = await service.reserveOrReuse(reservation);
    await service.markInfrastructureFailure(
      initial.record.jobId,
      initial.record.attemptToken,
      {
        code: 'SOLVER_ENQUEUE_FAILED',
        message: 'Redis unavailable',
      },
    );

    const retry = await service.reserveOrReuse(reservation);

    expect(retry.kind).toBe('reserved');
    expect(retry.record.jobId).toBe(initial.record.jobId);
    expect(retry.record.attemptToken).not.toBe(initial.record.attemptToken);
    expect(retry.record.status).toBe('queued');
    expect(retry.record.error).toBeUndefined();
    await expect(service.findJob(initial.record.jobId)).resolves.toEqual(
      retry.record,
    );
  });

  it('reclaims a stale reservation that was never acknowledged by the queue', async () => {
    const initial = await service.reserveOrReuse(reservation);
    await ageReservation(initial.record.jobId);

    const reclaimed = await service.reserveOrReuse(reservation);

    expect(reclaimed.kind).toBe('reserved');
    expect(reclaimed.record.jobId).toBe(initial.record.jobId);
    expect(reclaimed.record.attemptToken).toBe(initial.record.attemptToken);
  });

  it('does not reclaim acknowledged queued work when it becomes old', async () => {
    const initial = await service.reserveOrReuse(reservation);
    await service.markEnqueued(
      initial.record.jobId,
      initial.record.attemptToken,
    );
    await ageReservation(initial.record.jobId);

    const duplicate = await service.reserveOrReuse(reservation);

    expect(duplicate.kind).toBe('reused');
    expect(duplicate.record.attemptToken).toBe(initial.record.attemptToken);
  });

  it('rejects a delayed callback from the previous attempt', async () => {
    const initial = await service.reserveOrReuse(reservation);
    await service.markInfrastructureFailure(
      initial.record.jobId,
      initial.record.attemptToken,
      {
        code: 'SOLVER_ENQUEUE_FAILED',
        message: 'Redis unavailable',
      },
    );
    const retry = await service.reserveOrReuse(reservation);

    await expect(
      service.recordCallback(
        initial.record.jobId,
        initial.record.attemptToken,
        failedCallback,
      ),
    ).rejects.toThrow('does not match the active attempt');
    await expect(service.findJob(initial.record.jobId)).resolves.toMatchObject({
      status: 'queued',
      attemptToken: retry.record.attemptToken,
    });
    await expect(
      service.recordCallback(
        retry.record.jobId,
        retry.record.attemptToken,
        failedCallback,
      ),
    ).resolves.toMatchObject({ status: 'failed' });
  });

  it('ignores a delayed infrastructure failure from the previous attempt', async () => {
    const initial = await service.reserveOrReuse(reservation);
    await service.markInfrastructureFailure(
      initial.record.jobId,
      initial.record.attemptToken,
      infrastructureFailure,
    );
    const retry = await service.reserveOrReuse(reservation);

    await expect(
      service.markInfrastructureFailure(
        initial.record.jobId,
        initial.record.attemptToken,
        infrastructureFailure,
      ),
    ).resolves.toMatchObject({
      status: 'queued',
      attemptToken: retry.record.attemptToken,
    });
    await expect(service.findJob(retry.record.jobId)).resolves.toMatchObject({
      status: 'queued',
      attemptToken: retry.record.attemptToken,
    });
  });

  async function ageReservation(jobId: string): Promise<void> {
    await databaseService.db
      .update(solverJob)
      .set({
        UpdatedAt: new Date(Date.now() - SOLVER_RESERVATION_STALE_AFTER_MS - 1),
      })
      .where(eq(solverJob.JobID, parsePublicSolverJobId(jobId)));
  }
});

function toPgliteDatabase(
  databaseService: DatabaseService,
): PgliteDatabase<typeof schema> {
  return databaseService.db;
}

const userId = '11111111-1111-4111-8111-111111111111';
const reservation = {
  userId,
  solverProfileKey: 'default',
  solveMode: 'optimization' as const,
  requestedEngine: 'auto' as const,
  deduplicationKey: `solver-semantic-sha256-v1:${'a'.repeat(64)}`,
  solverInput: {
    schedulingProblem: { events: [] },
    preferences: { heuristics: [] },
  },
};

const failedCallback = {
  status: 'failed' as const,
  error: { code: 'SOLVER_FAILED', message: 'solver exited 1' },
};

const infrastructureFailure = {
  code: 'SOLVER_ENQUEUE_FAILED',
  message: 'Redis unavailable',
};
