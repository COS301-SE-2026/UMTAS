import { Injectable } from '@nestjs/common';
import type {
  PdfParserCallbackPayload,
  PdfParserResult,
  WorkerCallbackError,
} from 'shared-types';

export type PdfParserJobStatus = 'queued' | 'completed' | 'failed';

export interface PdfParserJobRecord {
  jobId: string;
  fileKey: string | null;
  adapterKey: string | null;
  status: PdfParserJobStatus;
  result?: PdfParserResult;
  error?: WorkerCallbackError;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PdfParserJobStoreService {
  private readonly jobs = new Map<string, PdfParserJobRecord>();

  createQueuedJob(input: {
    jobId: string;
    fileKey: string;
    adapterKey: string;
  }): PdfParserJobRecord {
    const existing = this.jobs.get(input.jobId);
    const now = new Date().toISOString();
    const record: PdfParserJobRecord = {
      jobId: input.jobId,
      fileKey: input.fileKey,
      adapterKey: input.adapterKey,
      status: existing?.status ?? 'queued',
      result: existing?.result,
      error: existing?.error,
      createdAt: existing?.createdAt ?? now,
      updatedAt: existing?.updatedAt ?? now,
    };

    this.jobs.set(input.jobId, record);
    return record;
  }

  recordCallback(
    jobId: string,
    callback: PdfParserCallbackPayload,
  ): PdfParserJobRecord {
    const existing = this.jobs.get(jobId);
    const now = new Date().toISOString();
    const record: PdfParserJobRecord = {
      jobId,
      fileKey: existing?.fileKey ?? null,
      adapterKey: existing?.adapterKey ?? null,
      status: callback.status,
      result: callback.result,
      error: callback.error,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.jobs.set(jobId, record);
    return record;
  }

  findJob(jobId: string): PdfParserJobRecord | undefined {
    return this.jobs.get(jobId);
  }
}
