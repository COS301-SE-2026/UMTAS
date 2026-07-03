import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { PdfStreamFingerprintResult } from 'shared-types';
import { IS_PUBLIC_KEY } from '../auth/auth.guard';
import type { SessionData } from '../auth/session.decorator';
import { QueueProducerService } from '../jobs/queue-producer.service';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import { ObjectStorageService } from '../storage/object-storage.service';
import { PdfParserController } from './pdf-parser.controller';
import { PdfParserFingerprintService } from './pdf-parser-fingerprint.service';
import {
  PdfParserJobStoreService,
  type PdfParserJobRecord,
} from './pdf-parser-job-store.service';

describe('PdfParserController auth metadata', () => {
  it('does not mark upload or status endpoints as public', () => {
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_KEY,
        PdfParserController.prototype.uploadAndEnqueue,
      ),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, PdfParserController.prototype.getJob),
    ).toBeUndefined();
  });

  it('keeps worker callbacks public for bearer-token guard access', () => {
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_KEY,
        PdfParserController.prototype.receiveCallback,
      ),
    ).toBe(true);
  });
});

describe('PdfParserController', () => {
  let queueProducer: MockQueueProducer;
  let storage: MockObjectStorage;
  let jobStore: MockPdfParserJobStore;
  let fingerprintService: MockPdfParserFingerprintService;
  let controller: PdfParserController;

  beforeEach(async () => {
    queueProducer = { enqueuePdfParseJob: jest.fn().mockResolvedValue({}) };
    storage = { putObject: jest.fn().mockResolvedValue({}) };
    jobStore = {
      findDuplicate: jest.fn().mockResolvedValue(undefined),
      createQueuedJob: jest.fn().mockResolvedValue(queuedRecord),
      retryFailedDuplicate: jest.fn().mockResolvedValue(retriedRecord),
      markInfrastructureFailure: jest.fn().mockResolvedValue(undefined),
      findJob: jest.fn().mockResolvedValue(queuedRecord),
      recordCallback: jest.fn().mockResolvedValue(completedRecord),
    };
    fingerprintService = {
      computeOrThrow: jest.fn().mockReturnValue(fingerprint),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [PdfParserController],
      providers: [
        { provide: QueueProducerService, useValue: queueProducer },
        { provide: ObjectStorageService, useValue: storage },
        { provide: PdfParserJobStoreService, useValue: jobStore },
        { provide: PdfParserFingerprintService, useValue: fingerprintService },
        {
          provide: WorkerCallbackAuthGuard,
          useValue: { canActivate: jest.fn() },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(PdfParserController);
  });

  it('returns duplicate lookup results only from the scoped store query', async () => {
    jobStore.findDuplicate.mockResolvedValue(completedRecord);

    await expect(
      controller.lookupDuplicate(session, {
        universityId,
        adapterKey: 'up',
        fingerprintAlgorithm: 'pdf-stream-payload-sha256-v1',
        pdfStreamHash,
      }),
    ).resolves.toEqual({
      duplicate: true,
      jobId: completedRecord.jobId,
      status: 'completed',
      resultAvailable: true,
      statusUrl: `/pdf-parser/jobs/${completedRecord.jobId}`,
    });

    expect(jobStore.findDuplicate).toHaveBeenCalledWith({
      userId,
      universityId,
      adapterKey: 'up',
      fingerprintAlgorithm: 'pdf-stream-payload-sha256-v1',
      pdfStreamHash,
      statuses: ['queued', 'completed'],
    });
  });

  it('recomputes the backend hash during upload and keeps a mismatching client hash diagnostic only', async () => {
    await controller.uploadAndEnqueue(
      session,
      uploadedPdf,
      'up',
      universityId,
      'pdf-stream-payload-sha256-v1',
      'f'.repeat(64),
    );

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

    await expect(
      controller.uploadAndEnqueue(
        session,
        uploadedPdf,
        'up',
        universityId,
        undefined,
        undefined,
      ),
    ).resolves.toEqual({
      jobId: completedRecord.jobId,
      fileKey: completedRecord.fileKey,
      adapterKey: completedRecord.adapterKey,
      status: completedRecord.status,
      result: completedRecord.result,
      error: completedRecord.error,
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

    await controller.uploadAndEnqueue(
      session,
      uploadedPdf,
      'up',
      universityId,
      undefined,
      undefined,
    );

    expect(calls).toEqual(['create', 'store', 'enqueue']);
  });

  it('retries a failed duplicate upload instead of returning the failed job', async () => {
    jobStore.createQueuedJob.mockRejectedValue(new Error('duplicate key'));
    jobStore.findDuplicate
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(failedRecord);

    await expect(
      controller.uploadAndEnqueue(
        session,
        uploadedPdf,
        'up',
        universityId,
        undefined,
        undefined,
      ),
    ).resolves.toEqual(
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

    await expect(
      controller.uploadAndEnqueue(
        session,
        uploadedPdf,
        'up',
        universityId,
        undefined,
        undefined,
      ),
    ).rejects.toThrow('PDF parser upload could not be stored');

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

    await expect(
      controller.uploadAndEnqueue(
        session,
        uploadedPdf,
        'up',
        universityId,
        undefined,
        undefined,
      ),
    ).rejects.toThrow('PDF parser job could not be enqueued');

    expect(jobStore.markInfrastructureFailure).toHaveBeenCalledWith(
      expect.stringMatching(/^pdf-parse-/),
      expect.objectContaining({
        code: 'PDF_PARSE_ENQUEUE_FAILED',
      }),
    );
  });

  it('persists completed worker callbacks through the store', async () => {
    const result = { modules: [], events: [], warnings: [] };

    await expect(
      controller.receiveCallback(queuedRecord.jobId, {
        status: 'completed',
        result,
      }),
    ).resolves.toEqual({ accepted: true, jobId: queuedRecord.jobId });

    expect(jobStore.recordCallback).toHaveBeenCalledWith(queuedRecord.jobId, {
      status: 'completed',
      result,
    });
  });

  it('persists failed worker callbacks through the store', async () => {
    const error = { code: 'PARSE_FAILED', message: 'bad pdf' };

    await expect(
      controller.receiveCallback(queuedRecord.jobId, {
        status: 'failed',
        error,
      }),
    ).resolves.toEqual({ accepted: true, jobId: queuedRecord.jobId });

    expect(jobStore.recordCallback).toHaveBeenCalledWith(queuedRecord.jobId, {
      status: 'failed',
      error,
    });
  });

  it('returns completed result JSON for the authenticated job owner', async () => {
    jobStore.findJob.mockResolvedValue(completedRecord);

    await expect(
      controller.getJobResult(session, completedRecord.jobId),
    ).resolves.toEqual(completedRecord.result);

    expect(jobStore.findJob).toHaveBeenCalledWith(completedRecord.jobId, {
      userId,
    });
  });

  it('does not return another user job when the scoped store lookup misses', async () => {
    jobStore.findJob.mockResolvedValue(undefined);

    await expect(
      controller.getJob(session, queuedRecord.jobId),
    ).rejects.toThrow(`PDF parser job not found: ${queuedRecord.jobId}`);
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
  findJob: jest.Mock;
  recordCallback: jest.Mock;
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

const session: SessionData = {
  user: {
    id: userId,
    name: 'Student',
    email: 'student@example.com',
    emailVerified: true,
    role: 'student',
    banned: false,
    createdAt: '2026-07-03T00:00:00.000Z',
    updatedAt: '2026-07-03T00:00:00.000Z',
  },
  session: {
    id: 'session-1',
    token: 'token-1',
    userId,
    expiresAt: '2026-07-04T00:00:00.000Z',
    createdAt: '2026-07-03T00:00:00.000Z',
    updatedAt: '2026-07-03T00:00:00.000Z',
  },
};

const uploadedPdf = {
  originalname: 'Timetable PDF.pdf',
  mimetype: 'application/pdf',
  buffer: Buffer.from('stream\npayload\nendstream'),
  size: 24,
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
