import type { PdfStreamFingerprintResult } from 'shared-types';
import { QueueProducerService } from '../jobs/queue-producer.service';
import { ObjectStorageService } from '../storage/object-storage.service';
import { PdfParseSubmission } from './pdf-parse-submission';
import { PdfParserFingerprintService } from './pdf-parser-fingerprint.service';
import {
  PdfParserJobStoreService,
  type PdfParserJobRecord,
} from './pdf-parser-job-store.service';

describe('PdfParseSubmission', () => {
  let queueProducer: MockQueueProducer;
  let storage: MockObjectStorage;
  let jobStore: MockPdfParserJobStore;
  let fingerprintService: MockPdfParserFingerprintService;
  let submission: PdfParseSubmission;

  beforeEach(() => {
    queueProducer = { enqueuePdfParseJob: jest.fn().mockResolvedValue({}) };
    storage = { putObject: jest.fn().mockResolvedValue({}) };
    jobStore = {
      findDuplicate: jest.fn().mockResolvedValue(undefined),
      createQueuedJob: jest.fn().mockResolvedValue(queuedRecord),
      retryFailedDuplicate: jest.fn().mockResolvedValue(retriedRecord),
      markInfrastructureFailure: jest.fn().mockResolvedValue(undefined),
    };
    fingerprintService = {
      computeOrThrow: jest.fn().mockReturnValue(fingerprint),
    };

    submission = new PdfParseSubmission(
      queueProducer as unknown as QueueProducerService,
      storage as unknown as ObjectStorageService,
      jobStore as unknown as PdfParserJobStoreService,
      fingerprintService as unknown as PdfParserFingerprintService,
    );
  });

  it('recomputes the backend hash and keeps a mismatching client hash diagnostic only', async () => {
    await submission.submit(submissionInput);

    expect(jobStore.findDuplicate).toHaveBeenCalledWith({
      userId,
      universityId,
      adapterKey: 'up',
      fingerprintAlgorithm: fingerprint.algorithmVersion,
      pdfStreamHash: fingerprint.hash,
      statuses: ['queued', 'completed'],
    });
    expect(jobStore.createQueuedJob).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        universityId,
        clientPdfStreamHash: 'f'.repeat(64),
        pdfStreamHash: fingerprint.hash,
        streamCount: fingerprint.streamCount,
      }),
    );
  });

  it('returns an existing duplicate upload without storing or enqueueing another job', async () => {
    jobStore.findDuplicate.mockResolvedValue(completedRecord);

    await expect(submission.submit(submissionInput)).resolves.toEqual({
      jobId: completedRecord.jobId,
      fileKey: completedRecord.fileKey,
      adapterKey: completedRecord.adapterKey,
      status: completedRecord.status,
      result: completedRecord.result,
      error: completedRecord.error,
      moduleGroupingId: completedRecord.moduleGroupingId,
      createdAt: completedRecord.createdAt,
      updatedAt: completedRecord.updatedAt,
      statusUrl: `/pdf-parser/jobs/${completedRecord.jobId}`,
    });

    expect(storage.putObject).not.toHaveBeenCalled();
    expect(jobStore.createQueuedJob).not.toHaveBeenCalled();
    expect(queueProducer.enqueuePdfParseJob).not.toHaveBeenCalled();
  });

  it('creates the persisted job before enqueueing the BullMQ job', async () => {
    const calls: string[] = [];
    jobStore.createQueuedJob.mockImplementation(async () => {
      calls.push('create');
      return queuedRecord;
    });
    storage.putObject.mockImplementation(async () => {
      calls.push('store');
      return {};
    });
    queueProducer.enqueuePdfParseJob.mockImplementation(async () => {
      calls.push('enqueue');
      return {};
    });

    await submission.submit(submissionInput);

    expect(calls).toEqual(['create', 'store', 'enqueue']);
  });

  it('retries a failed duplicate upload instead of returning the failed job', async () => {
    jobStore.createQueuedJob.mockRejectedValue(new Error('duplicate key'));
    jobStore.findDuplicate
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(failedRecord);

    await expect(submission.submit(submissionInput)).resolves.toEqual(
      expect.objectContaining({
        jobId: retriedRecord.jobId,
        status: 'queued',
      }),
    );

    expect(jobStore.retryFailedDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: failedRecord.jobId,
        adapterKey: 'up',
        pdfStreamHash,
      }),
    );
    expect(storage.putObject).toHaveBeenCalledWith(
      expect.objectContaining({ key: retriedRecord.fileKey }),
    );
    expect(queueProducer.enqueuePdfParseJob).toHaveBeenCalledWith({
      jobId: retriedRecord.jobId,
      fileKey: retriedRecord.fileKey,
      adapterKey: 'up',
    });
  });

  it('marks the reserved job failed when object storage fails', async () => {
    storage.putObject.mockRejectedValue(new Error('storage down'));

    await expect(submission.submit(submissionInput)).rejects.toThrow(
      'PDF parser upload could not be stored',
    );

    expect(jobStore.markInfrastructureFailure).toHaveBeenCalledWith(
      queuedRecord.jobId,
      expect.objectContaining({
        code: 'PDF_PARSE_UPLOAD_FAILED',
      }),
    );
    expect(queueProducer.enqueuePdfParseJob).not.toHaveBeenCalled();
  });

  it('marks the persisted job failed when enqueueing fails', async () => {
    queueProducer.enqueuePdfParseJob.mockRejectedValue(new Error('redis down'));

    await expect(submission.submit(submissionInput)).rejects.toThrow(
      'PDF parser job could not be enqueued',
    );

    expect(jobStore.markInfrastructureFailure).toHaveBeenCalledWith(
      expect.stringMatching(/^pdf-parse-/),
      expect.objectContaining({
        code: 'PDF_PARSE_ENQUEUE_FAILED',
      }),
    );
  });
});

const userId = '11111111-1111-4111-8111-111111111111';
const universityId = '22222222-2222-4222-8222-222222222222';
const pdfStreamHash = 'a'.repeat(64);

type MockQueueProducer = {
  enqueuePdfParseJob: jest.Mock;
};

type MockObjectStorage = {
  putObject: jest.Mock;
};

type MockPdfParserJobStore = {
  findDuplicate: jest.Mock;
  createQueuedJob: jest.Mock;
  retryFailedDuplicate: jest.Mock;
  markInfrastructureFailure: jest.Mock;
};

type MockPdfParserFingerprintService = {
  computeOrThrow: jest.Mock;
};

const fingerprint: Extract<PdfStreamFingerprintResult, { ok: true }> = {
  ok: true,
  hash: pdfStreamHash,
  streamCount: 1,
  algorithmVersion: 'pdf-stream-payload-sha256-v1',
};

const uploadedPdf = {
  originalName: 'Timetable PDF.pdf',
  mimetype: 'application/pdf',
  buffer: Buffer.from(
    '%PDF-1.7\n1 0 obj\n<< /Length 7 >>\nstream\npayload\nendstream\nendobj\n',
  ),
};

const submissionInput = {
  userId,
  universityId,
  adapterKey: 'up',
  clientPdfStreamHash: 'f'.repeat(64),
  file: uploadedPdf,
};

const queuedRecord: PdfParserJobRecord = {
  jobId: 'pdf-parse-33333333-3333-4333-8333-333333333333',
  fileKey:
    'uploads/pdf-parser/pdf-parse-33333333-3333-4333-8333-333333333333/timetable-pdf.pdf',
  adapterKey: 'up',
  status: 'queued',
  createdAt: '2026-07-03T00:00:00.000Z',
  updatedAt: '2026-07-03T00:00:00.000Z',
};

const completedRecord: PdfParserJobRecord = {
  jobId: queuedRecord.jobId,
  fileKey: queuedRecord.fileKey,
  adapterKey: queuedRecord.adapterKey,
  status: 'completed',
  result: { modules: [], events: [], warnings: [] },
  createdAt: queuedRecord.createdAt,
  updatedAt: queuedRecord.updatedAt,
};

const failedRecord: PdfParserJobRecord = {
  jobId: 'pdf-parse-44444444-4444-4444-8444-444444444444',
  fileKey:
    'uploads/pdf-parser/pdf-parse-44444444-4444-4444-8444-444444444444/timetable-pdf.pdf',
  adapterKey: 'up',
  status: 'failed',
  error: {
    code: 'PARSER_FAILED',
    message: 'Parser failed',
    details: {},
  },
  createdAt: queuedRecord.createdAt,
  updatedAt: queuedRecord.updatedAt,
};

const retriedRecord: PdfParserJobRecord = {
  jobId: failedRecord.jobId,
  fileKey:
    'uploads/pdf-parser/pdf-parse-55555555-5555-4555-8555-555555555555/timetable-pdf.pdf',
  adapterKey: 'up',
  status: 'queued',
  createdAt: failedRecord.createdAt,
  updatedAt: failedRecord.updatedAt,
};
