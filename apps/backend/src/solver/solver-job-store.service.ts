import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { isDeepStrictEqual } from 'node:util';
import type {
  SolverCallbackPayload,
  SolverResult,
  WorkerCallbackError,
} from 'shared-types';
import { DatabaseService, type AppDatabase } from '../db/database.service';
import { solverJob, type SolverJob } from '../entities';

export type SolverJobStatus = 'queued' | 'completed' | 'failed';

export interface SolverJobRecord {
  jobId: string;
  solverProfileKey: string;
  solveMode: 'feasibility' | 'optimization';
  requestedEngine?: 'auto' | 'cp-sat' | 'ga';
  status: SolverJobStatus;
  result?: SolverResult;
  error?: WorkerCallbackError;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
}

@Injectable()
export class SolverJobStoreService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createQueuedJob(input: {
    jobId: string;
    solverProfileKey: string;
    solveMode: 'feasibility' | 'optimization';
    requestedEngine?: 'auto' | 'cp-sat' | 'ga';
  }): Promise<SolverJobRecord> {
    const now = new Date();
    const [row] = await this.databaseService.db
      .insert(solverJob)
      .values({
        JobID: input.jobId,
        SolverProfileKey: input.solverProfileKey,
        SolveMode: input.solveMode,
        RequestedEngine: input.requestedEngine,
        Status: 'queued',
        CreatedAt: now,
        UpdatedAt: now,
      })
      .returning();

    if (!row) {
      throw new ConflictException('Solver job could not be created');
    }

    return mapSolverJob(row);
  }

  async retryFailedJob(input: {
    jobId: string;
    solverProfileKey: string;
    solveMode: 'feasibility' | 'optimization';
    requestedEngine?: 'auto' | 'cp-sat' | 'ga';
  }): Promise<SolverJobRecord> {
    const now = new Date();
    const [row] = await this.databaseService.db
      .update(solverJob)
      .set({
        SolverProfileKey: input.solverProfileKey,
        SolveMode: input.solveMode,
        RequestedEngine: input.requestedEngine,
        Status: 'queued',
        Result: null,
        ErrorCode: null,
        ErrorMessage: null,
        ErrorDetails: null,
        UpdatedAt: now,
        CompletedAt: null,
        FailedAt: null,
      })
      .where(
        and(eq(solverJob.JobID, input.jobId), eq(solverJob.Status, 'failed')),
      )
      .returning();

    if (!row) {
      throw new ConflictException(
        `Solver job is not available for retry: ${input.jobId}`,
      );
    }

    return mapSolverJob(row);
  }

  async markInfrastructureFailure(
    jobId: string,
    error: WorkerCallbackError,
  ): Promise<SolverJobRecord> {
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
      .where(and(eq(solverJob.JobID, jobId), eq(solverJob.Status, 'queued')))
      .returning();

    if (!row) {
      throw new NotFoundException(`Queued solver job not found: ${jobId}`);
    }

    return mapSolverJob(row);
  }

  async recordCallback(
    jobId: string,
    callback: SolverCallbackPayload,
  ): Promise<SolverJobRecord> {
    const row = await this.databaseService.db.transaction(async (tx) => {
      const existing = await this.findPersistedJobForUpdate(tx, jobId);
      if (!existing) {
        throw new NotFoundException(`Solver job not found: ${jobId}`);
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

  async findJob(jobId: string): Promise<SolverJobRecord | undefined> {
    const [row] = await this.databaseService.db
      .select()
      .from(solverJob)
      .where(eq(solverJob.JobID, jobId))
      .limit(1);

    return row ? mapSolverJob(row) : undefined;
  }

  private async findPersistedJobForUpdate(
    db: AppDatabase,
    jobId: string,
  ): Promise<SolverJob | undefined> {
    const [row] = await db
      .select()
      .from(solverJob)
      .where(eq(solverJob.JobID, jobId))
      .limit(1)
      .for('update');

    return row;
  }
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
    jobId: row.JobID,
    solverProfileKey: row.SolverProfileKey,
    solveMode: parseSolveMode(row.SolveMode),
    requestedEngine: parseRequestedEngine(row.RequestedEngine),
    status: parseSolverJobStatus(row.Status),
    result: row.Result ?? undefined,
    error,
    createdAt: row.CreatedAt.toISOString(),
    updatedAt: row.UpdatedAt.toISOString(),
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
