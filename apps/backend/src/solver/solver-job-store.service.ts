import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull, lte } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import type {
  SolverCallbackPayload,
  SolverInput,
  SolverPreferences,
  SolverResult,
  WorkerCallbackError,
} from 'shared-types';
import { DatabaseService, type AppDatabase } from '../db/database.service';
import { solverJob, type SolverJob } from '../entities';

export type SolverJobStatus = 'queued' | 'completed' | 'failed';

export interface SolverJobRecord {
  jobId: string;
  userId: string;
  solveMode: 'feasibility' | 'optimization';
  requestedEngine?: 'auto' | 'cp-sat' | 'ga';
  deduplicationKey: string;
  attemptToken: string;
  input: SolverInput;
  preferences: SolverPreferences;
  status: SolverJobStatus;
  result?: SolverResult;
  error?: WorkerCallbackError;
  createdAt: string;
  updatedAt: string;
  enqueuedAt?: string;
  completedAt?: string;
  failedAt?: string;
}

export interface ReserveSolverJobInput {
  userId: string;
  solveMode: 'feasibility' | 'optimization';
  requestedEngine?: 'auto' | 'cp-sat' | 'ga';
  deduplicationKey: string;
  solverInput: SolverInput;
}

export interface ReserveSolverJobResult {
  kind: 'reserved' | 'reused';
  record: SolverJobRecord;
}

@Injectable()
export class SolverJobStoreService {
  constructor(private readonly databaseService: DatabaseService) {}

  async reserveOrReuse(
    input: ReserveSolverJobInput,
  ): Promise<ReserveSolverJobResult> {
    const result = await this.databaseService.db.transaction(async (tx) => {
      const now = new Date();
      const [inserted] = await tx
        .insert(solverJob)
        .values({
          JobID: randomUUID(),
          UserID: input.userId,
          SolveMode: input.solveMode,
          RequestedEngine: input.requestedEngine,
          DeduplicationKey: input.deduplicationKey,
          AttemptToken: randomUUID(),
          Input: input.solverInput,
          Status: 'queued',
          CreatedAt: now,
          UpdatedAt: now,
        })
        .onConflictDoNothing({
          target: [solverJob.UserID, solverJob.DeduplicationKey],
        })
        .returning();

      if (inserted) {
        return { kind: 'reserved' as const, row: inserted };
      }

      const duplicate = await this.findPersistedDuplicate(tx, input);
      if (!duplicate) {
        throw new ConflictException(
          'Solver job conflict could not be resolved',
        );
      }

      const staleReservation = isStaleReservation(duplicate, now);
      if (duplicate.Status !== 'failed' && !staleReservation) {
        return { kind: 'reused' as const, row: duplicate };
      }

      const reclaimCriteria = staleReservation
        ? and(
            eq(solverJob.JobID, duplicate.JobID),
            eq(solverJob.AttemptToken, duplicate.AttemptToken),
            eq(solverJob.Status, 'queued'),
            isNull(solverJob.EnqueuedAt),
            lte(
              solverJob.UpdatedAt,
              new Date(now.getTime() - SOLVER_RESERVATION_STALE_AFTER_MS),
            ),
          )
        : and(
            eq(solverJob.JobID, duplicate.JobID),
            eq(solverJob.AttemptToken, duplicate.AttemptToken),
            eq(solverJob.Status, 'failed'),
          );

      const [retried] = await tx
        .update(solverJob)
        .set({
          Input: input.solverInput,
          // Preserve ambiguous queue-write identity so BullMQ can deduplicate
          // recovery. Confirmed failed attempts get a fresh execution ID.
          AttemptToken: staleReservation
            ? duplicate.AttemptToken
            : randomUUID(),
          Status: 'queued',
          Result: null,
          ErrorCode: null,
          ErrorMessage: null,
          ErrorDetails: null,
          UpdatedAt: new Date(),
          EnqueuedAt: null,
          CompletedAt: null,
          FailedAt: null,
        })
        .where(reclaimCriteria)
        .returning();

      if (retried) {
        return { kind: 'reserved' as const, row: retried };
      }

      const raced = await this.findPersistedDuplicate(tx, input);
      if (raced && raced.Status !== 'failed') {
        return { kind: 'reused' as const, row: raced };
      }

      throw new ConflictException('Solver job changed while reserving a retry');
    });

    return {
      kind: result.kind,
      record: mapSolverJob(result.row),
    };
  }

  async markEnqueued(
    jobId: string,
    attemptToken: string,
  ): Promise<SolverJobRecord> {
    const jobUuid = parsePublicSolverJobId(jobId);
    const now = new Date();
    const [row] = await this.databaseService.db
      .update(solverJob)
      .set({ EnqueuedAt: now, UpdatedAt: now })
      .where(
        and(
          eq(solverJob.JobID, jobUuid),
          eq(solverJob.AttemptToken, attemptToken),
          eq(solverJob.Status, 'queued'),
          isNull(solverJob.EnqueuedAt),
        ),
      )
      .returning();

    if (row) return mapSolverJob(row);

    const current = await this.findJob(jobId);
    if (current) return current;

    throw new NotFoundException(`Solver job not found: ${jobId}`);
  }

  async markInfrastructureFailure(
    jobId: string,
    attemptToken: string,
    error: WorkerCallbackError,
  ): Promise<SolverJobRecord> {
    const jobUuid = parsePublicSolverJobId(jobId);
    const now = new Date();
    const [row] = await this.databaseService.db
      .update(solverJob)
      .set({
        Status: 'failed',
        ErrorCode: error.code,
        ErrorMessage: error.message,
        ErrorDetails: error.details,
        UpdatedAt: now,
        FailedAt: now,
      })
      .where(
        and(
          eq(solverJob.JobID, jobUuid),
          eq(solverJob.AttemptToken, attemptToken),
          eq(solverJob.Status, 'queued'),
        ),
      )
      .returning();

    if (!row) {
      const current = await this.findJob(jobId);
      if (current) return current;

      throw new NotFoundException(`Solver job not found: ${jobId}`);
    }

    return mapSolverJob(row);
  }

  async recordCallback(
    jobId: string,
    attemptToken: string,
    callback: SolverCallbackPayload,
  ): Promise<SolverJobRecord> {
    const jobUuid = parsePublicSolverJobId(jobId);
    const row = await this.databaseService.db.transaction(async (tx) => {
      const existing = await this.findPersistedJobForUpdate(tx, jobUuid);
      if (!existing) {
        throw new NotFoundException(`Solver job not found: ${jobId}`);
      }

      if (existing.AttemptToken !== attemptToken) {
        throw new ConflictException(
          `Solver callback does not match the active attempt: ${jobId}`,
        );
      }

      if (existing.Status === callback.status) {
        if (callbackMatchesExisting(mapSolverJob(existing), callback)) {
          return existing;
        }

        throw new ConflictException(
          `Solver job already has a different ${callback.status} callback`,
        );
      }

      if (existing.Status === 'completed' || existing.Status === 'failed') {
        throw new ConflictException(`Solver job is already ${existing.Status}`);
      }

      const now = new Date();
      const [updated] = await tx
        .update(solverJob)
        .set({
          Status: callback.status,
          Result: callback.status === 'completed' ? callback.result : null,
          ErrorCode: callback.status === 'failed' ? callback.error.code : null,
          ErrorMessage:
            callback.status === 'failed' ? callback.error.message : null,
          ErrorDetails:
            callback.status === 'failed' ? callback.error.details : null,
          UpdatedAt: now,
          CompletedAt: callback.status === 'completed' ? now : null,
          FailedAt: callback.status === 'failed' ? now : null,
        })
        .where(
          and(
            eq(solverJob.JobID, existing.JobID),
            eq(solverJob.AttemptToken, attemptToken),
            eq(solverJob.Status, existing.Status),
          ),
        )
        .returning();

      if (!updated) {
        throw new ConflictException(
          `Solver job changed while recording callback: ${jobId}`,
        );
      }

      return updated;
    });

    return mapSolverJob(row);
  }

  async findJob(
    jobId: string,
    scope?: { userId: string },
  ): Promise<SolverJobRecord | undefined> {
    const jobUuid = parsePublicSolverJobId(jobId);
    const criteria = scope
      ? and(eq(solverJob.JobID, jobUuid), eq(solverJob.UserID, scope.userId))
      : eq(solverJob.JobID, jobUuid);
    const [row] = await this.databaseService.db
      .select()
      .from(solverJob)
      .where(criteria)
      .limit(1);

    return row ? mapSolverJob(row) : undefined;
  }

  private async findPersistedDuplicate(
    db: AppDatabase,
    input: Pick<ReserveSolverJobInput, 'userId' | 'deduplicationKey'>,
  ): Promise<SolverJob | undefined> {
    const [row] = await db
      .select()
      .from(solverJob)
      .where(
        and(
          eq(solverJob.UserID, input.userId),
          eq(solverJob.DeduplicationKey, input.deduplicationKey),
        ),
      )
      .limit(1);

    return row;
  }

  private async findPersistedJobForUpdate(
    db: AppDatabase,
    jobUuid: string,
  ): Promise<SolverJob | undefined> {
    const [row] = await db
      .select()
      .from(solverJob)
      .where(eq(solverJob.JobID, jobUuid))
      .limit(1)
      .for('update');

    return row;
  }
}

export function parsePublicSolverJobId(jobId: string): string {
  const trimmed = jobId.trim();
  const uuid = trimmed.startsWith(SOLVER_JOB_PREFIX)
    ? trimmed.slice(SOLVER_JOB_PREFIX.length)
    : trimmed;

  if (!UUID_PATTERN.test(uuid)) {
    throw new NotFoundException(`Solver job not found: ${jobId}`);
  }

  return uuid;
}

export function toPublicSolverJobId(jobId: string): string {
  return jobId.startsWith(SOLVER_JOB_PREFIX)
    ? jobId
    : `${SOLVER_JOB_PREFIX}${jobId}`;
}

function mapSolverJob(row: SolverJob): SolverJobRecord {
  const error =
    row.ErrorCode && row.ErrorMessage
      ? {
          code: row.ErrorCode,
          message: row.ErrorMessage,
          details: row.ErrorDetails ?? undefined,
        }
      : undefined;

  return {
    jobId: toPublicSolverJobId(row.JobID),
    userId: row.UserID,
    solveMode: parseSolveMode(row.SolveMode),
    requestedEngine: parseRequestedEngine(row.RequestedEngine),
    deduplicationKey: row.DeduplicationKey,
    attemptToken: row.AttemptToken,
    input: row.Input,
    preferences: row.Input.preferences,
    status: parseSolverJobStatus(row.Status),
    result: row.Result ?? undefined,
    error,
    createdAt: row.CreatedAt.toISOString(),
    updatedAt: row.UpdatedAt.toISOString(),
    enqueuedAt: row.EnqueuedAt?.toISOString(),
    completedAt: row.CompletedAt?.toISOString(),
    failedAt: row.FailedAt?.toISOString(),
  };
}

function callbackMatchesExisting(
  existing: SolverJobRecord,
  callback: SolverCallbackPayload,
): boolean {
  if (callback.status === 'completed') {
    return isDeepStrictEqual(existing.result, callback.result);
  }

  return (
    existing.error?.code === callback.error.code &&
    existing.error?.message === callback.error.message &&
    isDeepStrictEqual(existing.error?.details, callback.error.details)
  );
}

function parseSolverJobStatus(status: string): SolverJobStatus {
  if (status === 'queued' || status === 'completed' || status === 'failed') {
    return status;
  }

  throw new ConflictException(`Unsupported solver job status: ${status}`);
}

function parseSolveMode(value: string): 'feasibility' | 'optimization' {
  if (value === 'feasibility' || value === 'optimization') {
    return value;
  }

  throw new ConflictException(`Unsupported solver job solve mode: ${value}`);
}

function parseRequestedEngine(
  value: string | null,
): 'auto' | 'cp-sat' | 'ga' | undefined {
  if (value === null) return undefined;
  if (value === 'auto' || value === 'cp-sat' || value === 'ga') return value;

  throw new ConflictException(`Unsupported solver job engine: ${value}`);
}

const SOLVER_JOB_PREFIX = 'solve-';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const SOLVER_RESERVATION_STALE_AFTER_MS = 60_000;

function isStaleReservation(row: SolverJob, now: Date): boolean {
  return (
    row.Status === 'queued' &&
    row.EnqueuedAt === null &&
    row.UpdatedAt.getTime() <= now.getTime() - SOLVER_RESERVATION_STALE_AFTER_MS
  );
}
