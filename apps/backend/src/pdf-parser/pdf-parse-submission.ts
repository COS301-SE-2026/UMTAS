import { InternalServerErrorException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { QueueProducerService } from '../jobs/queue-producer.service';
import { ObjectStorageService } from '../storage/object-storage.service';
import { PdfParserUploadResponseDto } from './dto/pdf-parser-job-response.dto';
import { PdfParserFingerprintService } from './pdf-parser-fingerprint.service';
import {
  PdfParserJobStoreService,
  type PdfParserJobRecord,
} from './pdf-parser-job-store.service';

export interface PdfParseSubmissionInput {
  userId: string;
  universityId: string;
  adapterKey: string;
  clientPdfStreamHash?: string;
  file: PdfParseSubmissionFile;
}

export interface PdfParseSubmissionFile {
  originalName: string;
  mimetype: string;
  buffer: Buffer;
}

@Injectable()
export class PdfParseSubmission {
  constructor(
    private readonly queueProducer: QueueProducerService,
    private readonly storage: ObjectStorageService,
    private readonly jobStore: PdfParserJobStoreService,
    private readonly fingerprintService: PdfParserFingerprintService,
  ) {}

  async submit(
    input: PdfParseSubmissionInput,
  ): Promise<PdfParserUploadResponseDto> {
    const fingerprint = this.fingerprintService.computeOrThrow(
      input.file.buffer,
    );

    const duplicate = await this.jobStore.findDuplicate({
      userId: input.userId,
      universityId: input.universityId,
      adapterKey: input.adapterKey,
      fingerprintAlgorithm: fingerprint.algorithmVersion,
      pdfStreamHash: fingerprint.hash,
      statuses: ['queued', 'completed'],
    });

    if (duplicate) {
      return toUploadResponse(duplicate);
    }

    const jobId = `pdf-parse-${randomUUID()}`;
    const fileKey = buildFileKey(jobId, input.file.originalName);
    const preparedJob = await this.prepareUploadJob({
      jobId,
      userId: input.userId,
      universityId: input.universityId,
      fileKey,
      adapterKey: input.adapterKey,
      clientPdfStreamHash: input.clientPdfStreamHash,
      pdfStreamHash: fingerprint.hash,
      fingerprintAlgorithm: fingerprint.algorithmVersion,
      streamCount: fingerprint.streamCount,
    });

    if (preparedJob.kind === 'existing') {
      return toUploadResponse(preparedJob.record);
    }

    const record = preparedJob.record;
    const storageFileKey = record.fileKey ?? fileKey;

    await this.storeUploadedPdf(record.jobId, storageFileKey, input.file);
    await this.enqueueJob(record.jobId, storageFileKey, input.adapterKey);

    return toUploadResponse(record);
  }

  private async prepareUploadJob(
    input: PrepareUploadJobInput,
  ): Promise<PreparedUploadJob> {
    try {
      const record = await this.jobStore.createQueuedJob(input);

      return { kind: 'pending', record };
    } catch (error) {
      const duplicate = await this.jobStore.findDuplicate({
        userId: input.userId,
        universityId: input.universityId,
        adapterKey: input.adapterKey,
        fingerprintAlgorithm: input.fingerprintAlgorithm,
        pdfStreamHash: input.pdfStreamHash,
      });

      if (!duplicate) {
        throw error;
      }

      if (duplicate.status !== 'failed') {
        return { kind: 'existing', record: duplicate };
      }

      const retriedRecord = await this.jobStore.retryFailedDuplicate({
        jobId: duplicate.jobId,
        fileKey: input.fileKey,
        adapterKey: input.adapterKey,
        clientPdfStreamHash: input.clientPdfStreamHash,
        pdfStreamHash: input.pdfStreamHash,
        fingerprintAlgorithm: input.fingerprintAlgorithm,
        streamCount: input.streamCount,
      });

      return { kind: 'pending', record: retriedRecord };
    }
  }

  private async storeUploadedPdf(
    jobId: string,
    fileKey: string,
    file: PdfParseSubmissionFile,
  ): Promise<void> {
    try {
      await this.storage.putObject({
        key: fileKey,
        body: file.buffer,
        contentType: file.mimetype || 'application/pdf',
      });
    } catch (error) {
      await this.jobStore.markInfrastructureFailure(jobId, {
        code: 'PDF_PARSE_UPLOAD_FAILED',
        message: 'PDF parser upload could not be stored',
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
      throw new InternalServerErrorException(
        'PDF parser upload could not be stored',
      );
    }
  }

  private async enqueueJob(
    jobId: string,
    fileKey: string,
    adapterKey: string,
  ): Promise<void> {
    try {
      await this.queueProducer.enqueuePdfParseJob({
        jobId,
        fileKey,
        adapterKey,
      });
    } catch (error) {
      await this.jobStore.markInfrastructureFailure(jobId, {
        code: 'PDF_PARSE_ENQUEUE_FAILED',
        message: 'PDF parser job could not be enqueued',
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
      throw new InternalServerErrorException(
        'PDF parser job could not be enqueued',
      );
    }
  }
}

interface PrepareUploadJobInput {
  jobId: string;
  userId: string;
  universityId: string;
  fileKey: string;
  adapterKey: string;
  clientPdfStreamHash?: string;
  pdfStreamHash: string;
  fingerprintAlgorithm: string;
  streamCount: number;
}

type PreparedUploadJob =
  | { kind: 'pending'; record: PdfParserJobRecord }
  | { kind: 'existing'; record: PdfParserJobRecord };

function toUploadResponse(
  record: PdfParserJobRecord,
): PdfParserUploadResponseDto {
  return {
    jobId: record.jobId,
    fileKey: record.fileKey,
    adapterKey: record.adapterKey,
    status: record.status,
    result: record.result,
    error: record.error,
    moduleGroupingId: record.moduleGroupingId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    statusUrl: `/pdf-parser/jobs/${record.jobId}`,
  };
}

function buildFileKey(jobId: string, originalName: string): string {
  const safeName = originalName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `uploads/pdf-parser/${jobId}/${safeName || 'input.pdf'}`;
}
