import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { isDeepStrictEqual } from 'node:util';
import type {
  PdfParserCallbackPayload,
  PdfParserResult,
  WorkerCallbackError,
} from 'shared-types';
import { DatabaseService } from '../db/database.service';
import { parseJob, type ParseJob } from '../entities';
import { ParserResultImporter } from './parser-result-importer.service';

export type PdfParserJobStatus = 'queued' | 'completed' | 'failed';

export interface PdfParserJobRecord {
  jobId: string;
  fileKey: string | null;
  adapterKey: string | null;
  status: PdfParserJobStatus;
  result?: PdfParserResult;
  error?: WorkerCallbackError;
  moduleGroupingId?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PdfParserJobStoreService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly parserResultImporter: ParserResultImporter,
  ) {}

  async findDuplicate(input: {
    userId: string;
    universityId: string;
    adapterKey: string;
    fingerprintAlgorithm: string;
    pdfStreamHash: string;
    statuses?: PdfParserJobStatus[];
  }): Promise<PdfParserJobRecord | undefined> {
    const filters = [
      eq(parseJob.UserID, input.userId),
      eq(parseJob.UniversityID, input.universityId),
      eq(parseJob.AdapterKey, input.adapterKey),
      eq(parseJob.FingerprintAlgorithm, input.fingerprintAlgorithm),
      eq(parseJob.PdfStreamHash, input.pdfStreamHash),
    ];

    if (input.statuses && input.statuses.length > 0) {
      filters.push(inArray(parseJob.Status, input.statuses));
    }

    const [row] = await this.databaseService.db
      .select()
      .from(parseJob)
      .where(and(...filters))
      .limit(1);

    return row ? mapParseJob(row) : undefined;
  }

  async createQueuedJob(input: {
    jobId: string;
    userId: string;
    universityId: string;
    fileKey: string;
    adapterKey: string;
    clientPdfStreamHash?: string;
    pdfStreamHash: string;
    fingerprintAlgorithm: string;
    streamCount: number;
  }): Promise<PdfParserJobRecord> {
    const jobUuid = parsePublicJobId(input.jobId);
    const now = new Date();
    const [row] = await this.databaseService.db
      .insert(parseJob)
      .values({
        JobID: jobUuid,
        UserID: input.userId,
        UniversityID: input.universityId,
        AdapterKey: input.adapterKey,
        FileKey: input.fileKey,
        ClientPdfStreamHash: input.clientPdfStreamHash,
        PdfStreamHash: input.pdfStreamHash,
        FingerprintAlgorithm: input.fingerprintAlgorithm,
        StreamCount: input.streamCount,
        Status: 'queued',
        CreatedAt: now,
        UpdatedAt: now,
      })
      .returning();

    if (!row) {
      throw new ConflictException('PDF parser job could not be created');
    }

    return mapParseJob(row);
  }

  async markInfrastructureFailure(
    jobId: string,
    error: WorkerCallbackError,
  ): Promise<PdfParserJobRecord> {
    const jobUuid = parsePublicJobId(jobId);
    const now = new Date();
    const [row] = await this.databaseService.db
      .update(parseJob)
      .set({
        Status: 'failed',
        ErrorCode: error.code,
        ErrorMessage: error.message,
        ErrorDetails: error.details,
        UpdatedAt: now,
        FailedAt: now,
      })
      .where(eq(parseJob.JobID, jobUuid))
      .returning();

    if (!row) {
      throw new NotFoundException(`PDF parser job not found: ${jobId}`);
    }

    return mapParseJob(row);
  }

  async retryFailedDuplicate(input: {
    jobId: string;
    fileKey: string;
    adapterKey: string;
    clientPdfStreamHash?: string;
    pdfStreamHash: string;
    fingerprintAlgorithm: string;
    streamCount: number;
  }): Promise<PdfParserJobRecord> {
    const jobUuid = parsePublicJobId(input.jobId);
    const now = new Date();
    const [row] = await this.databaseService.db
      .update(parseJob)
      .set({
        FileKey: input.fileKey,
        AdapterKey: input.adapterKey,
        ClientPdfStreamHash: input.clientPdfStreamHash,
        PdfStreamHash: input.pdfStreamHash,
        FingerprintAlgorithm: input.fingerprintAlgorithm,
        StreamCount: input.streamCount,
        Status: 'queued',
        Result: null,
        ErrorCode: null,
        ErrorMessage: null,
        ErrorDetails: null,
        GroupID: null,
        UpdatedAt: now,
        CompletedAt: null,
        FailedAt: null,
      })
      .where(and(eq(parseJob.JobID, jobUuid), eq(parseJob.Status, 'failed')))
      .returning();

    if (!row) {
      throw new ConflictException(
        `PDF parser job is not available for retry: ${input.jobId}`,
      );
    }

    return mapParseJob(row);
  }

  async recordCallback(
    jobId: string,
    callback: PdfParserCallbackPayload,
  ): Promise<PdfParserJobRecord> {
    const existing = await this.findPersistedJob(jobId);
    if (!existing) {
      throw new NotFoundException(`PDF parser job not found: ${jobId}`);
    }

    if (existing.Status === callback.status) {
      const existingRecord = mapParseJob(existing);
      if (callbackMatchesExisting(existingRecord, callback)) {
        if (
          callback.status === 'completed' &&
          callback.result &&
          !existing.GroupID
        ) {
          const updated = await this.linkCompletedJobToDomainRecords(
            existing,
            callback.result,
          );
          return mapParseJob(updated);
        }

        return existingRecord;
      }

      throw new ConflictException(
        `PDF parser job already has a different ${callback.status} callback`,
      );
    }

    if (existing.Status === 'completed' || existing.Status === 'failed') {
      throw new ConflictException(
        `PDF parser job is already ${existing.Status}`,
      );
    }

    const row = await this.databaseService.db.transaction(async (tx) => {
      const now = new Date();
      const moduleGroupingId =
        callback.status === 'completed' && callback.result
          ? await this.parserResultImporter.importResult(
              tx,
              existing,
              callback.result,
            )
          : null;

      const [updated] = await tx
        .update(parseJob)
        .set({
          Status: callback.status,
          Result: callback.result ?? null,
          ErrorCode: callback.error?.code ?? null,
          ErrorMessage: callback.error?.message ?? null,
          ErrorDetails: callback.error?.details ?? null,
          GroupID: moduleGroupingId ?? existing.GroupID ?? null,
          UpdatedAt: now,
          CompletedAt: callback.status === 'completed' ? now : null,
          FailedAt: callback.status === 'failed' ? now : null,
        })
        .where(eq(parseJob.JobID, existing.JobID))
        .returning();

      return updated;
    });

    if (!row) {
      throw new NotFoundException(`PDF parser job not found: ${jobId}`);
    }

    return mapParseJob(row);
  }

  async findJob(
    jobId: string,
    userContext?: { userId: string },
  ): Promise<PdfParserJobRecord | undefined> {
    const jobUuid = parsePublicJobId(jobId);

    if (userContext) {
      const [row] = await this.databaseService.db
        .select()
        .from(parseJob)
        .where(
          and(
            eq(parseJob.JobID, jobUuid),
            eq(parseJob.UserID, userContext.userId),
          ),
        )
        .limit(1);

      return row ? mapParseJob(row) : undefined;
    }

    const [row] = await this.databaseService.db
      .select()
      .from(parseJob)
      .where(eq(parseJob.JobID, jobUuid))
      .limit(1);

    return row ? mapParseJob(row) : undefined;
  }

  private async findPersistedJob(jobId: string): Promise<ParseJob | undefined> {
    const jobUuid = parsePublicJobId(jobId);
    const [row] = await this.databaseService.db
      .select()
      .from(parseJob)
      .where(eq(parseJob.JobID, jobUuid))
      .limit(1);

    return row;
  }

  private async linkCompletedJobToDomainRecords(
    existing: ParseJob,
    result: PdfParserResult,
  ): Promise<ParseJob> {
    const row = await this.databaseService.db.transaction(async (tx) => {
      const moduleGroupingId = await this.parserResultImporter.importResult(
        tx,
        existing,
        result,
      );
      const [updated] = await tx
        .update(parseJob)
        .set({
          GroupID: moduleGroupingId,
          UpdatedAt: new Date(),
        })
        .where(eq(parseJob.JobID, existing.JobID))
        .returning();

      return updated;
    });

    if (!row) {
      throw new NotFoundException(
        `PDF parser job not found: ${toPublicJobId(existing.JobID)}`,
      );
    }

    return row;
  }
}

export function parsePublicJobId(jobId: string): string {
  const trimmed = jobId.trim();
  const uuid = trimmed.startsWith('pdf-parse-')
    ? trimmed.slice('pdf-parse-'.length)
    : trimmed;

  if (!UUID_PATTERN.test(uuid)) {
    throw new NotFoundException(`PDF parser job not found: ${jobId}`);
  }

  return uuid;
}

export function toPublicJobId(jobId: string): string {
  return jobId.startsWith('pdf-parse-') ? jobId : `pdf-parse-${jobId}`;
}

function mapParseJob(row: ParseJob): PdfParserJobRecord {
  const error =
    row.ErrorCode && row.ErrorMessage
      ? {
          code: row.ErrorCode,
          message: row.ErrorMessage,
          details: row.ErrorDetails ?? undefined,
        }
      : undefined;

  return {
    jobId: toPublicJobId(row.JobID),
    fileKey: row.FileKey,
    adapterKey: row.AdapterKey,
    status: parseJobStatus(row.Status),
    result: row.Result ?? undefined,
    error,
    moduleGroupingId: row.GroupID,
    createdAt: row.CreatedAt.toISOString(),
    updatedAt: row.UpdatedAt.toISOString(),
  };
}

function callbackMatchesExisting(
  existing: PdfParserJobRecord,
  callback: PdfParserCallbackPayload,
): boolean {
  if (callback.status === 'completed') {
    return isDeepStrictEqual(existing.result, callback.result);
  }

  return (
    existing.error?.code === callback.error?.code &&
    existing.error?.message === callback.error?.message &&
    isDeepStrictEqual(existing.error?.details, callback.error?.details)
  );
}

function parseJobStatus(status: string): PdfParserJobStatus {
  if (status === 'queued' || status === 'completed' || status === 'failed') {
    return status;
  }

  throw new ConflictException(`Unsupported PDF parser job status: ${status}`);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
