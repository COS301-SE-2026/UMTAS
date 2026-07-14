import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../auth/auth.guard';
import type { SessionData } from '../auth/session.decorator';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import type { PdfParserCallbackDto } from './dto/pdf-parser-callback.dto';
import { PdfParseSubmission } from './pdf-parse-submission';
import { PdfParserController } from './pdf-parser.controller';
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
  let jobStore: MockPdfParserJobStore;
  let submission: MockPdfParseSubmission;
  let controller: PdfParserController;

  beforeEach(async () => {
    jobStore = {
      findDuplicate: jest.fn().mockResolvedValue(undefined),
      findJob: jest.fn().mockResolvedValue(queuedRecord),
      recordCallback: jest.fn().mockResolvedValue(completedRecord),
    };
    submission = {
      submit: jest.fn().mockResolvedValue(uploadResponse),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [PdfParserController],
      providers: [
        { provide: PdfParserJobStoreService, useValue: jobStore },
        { provide: PdfParseSubmission, useValue: submission },
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

  it('validates upload inputs and delegates submission', async () => {
    await expect(
      controller.uploadAndEnqueue(
        session,
        uploadedPdf,
        ' up ',
        universityId,
        'pdf-stream-payload-sha256-v1',
        'F'.repeat(64),
      ),
    ).resolves.toEqual(uploadResponse);

    expect(submission.submit).toHaveBeenCalledWith({
      userId,
      universityId,
      adapterKey: 'up',
      clientPdfStreamHash: 'f'.repeat(64),
      file: {
        originalName: uploadedPdf.originalname,
        mimetype: uploadedPdf.mimetype,
        buffer: uploadedPdf.buffer,
      },
    });
  });

  it('rejects unsupported upload adapters before submission', async () => {
    await expect(
      controller.uploadAndEnqueue(
        session,
        uploadedPdf,
        'other',
        universityId,
        undefined,
        undefined,
      ),
    ).rejects.toThrow('Only the "up" PDF adapter is supported');

    expect(submission.submit).not.toHaveBeenCalled();
  });

  it('rejects uploads without PDF magic bytes', async () => {
    await expect(
      controller.uploadAndEnqueue(
        session,
        {
          originalname: 'not-a-pdf.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.from('not a pdf'),
          size: 9,
        },
        'up',
        universityId,
        undefined,
        undefined,
      ),
    ).rejects.toThrow('Uploaded file must be a PDF');

    expect(submission.submit).not.toHaveBeenCalled();
  });

  it('rejects invalid client fingerprint diagnostics before submission', async () => {
    await expect(
      controller.uploadAndEnqueue(
        session,
        uploadedPdf,
        'up',
        universityId,
        'pdf-stream-payload-sha256-v1',
        'not-a-hash',
      ),
    ).rejects.toThrow('clientPdfStreamHash must be a 64-character hex hash');

    expect(submission.submit).not.toHaveBeenCalled();
  });

  it('rejects unsupported client fingerprint algorithms before submission', async () => {
    await expect(
      controller.uploadAndEnqueue(
        session,
        uploadedPdf,
        'up',
        universityId,
        'unknown',
        undefined,
      ),
    ).rejects.toThrow('Unsupported fingerprint algorithm: unknown');

    expect(submission.submit).not.toHaveBeenCalled();
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

  it('accepts a valid non-recurring parsed event before persistence', async () => {
    const result = {
      modules: [],
      events: [
        {
          moduleCode: 'COS101',
          activityType: 'test' as const,
          activityCode: 'T1',
          title: 'COS101 Test',
          day: null,
          date: '2026-03-17',
          startTime: '08:30',
          endTime: '09:20',
          venues: [],
          isRecurring: false as const,
          metadata: {},
          warnings: [],
        },
      ],
      warnings: [],
    };

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

  it('rejects incomplete parsed recurrence data before persistence', async () => {
    const callback = {
      status: 'completed',
      result: {
        modules: [],
        events: [
          {
            moduleCode: 'COS101',
            activityType: 'lecture',
            activityCode: 'L1',
            title: 'COS101 Lecture',
            day: null,
            date: null,
            startTime: '08:30',
            endTime: '09:20',
            venues: [],
            isRecurring: true,
            metadata: {},
            warnings: [],
          },
        ],
        warnings: [],
      },
    } as unknown as PdfParserCallbackDto;

    await expect(
      controller.receiveCallback(queuedRecord.jobId, callback),
    ).rejects.toThrow(
      'PDF parser callback did not match the shared parser contract',
    );

    expect(jobStore.recordCallback).not.toHaveBeenCalled();
  });

  it('rejects contradictory callback status payloads before persistence', async () => {
    await expect(
      controller.receiveCallback(queuedRecord.jobId, {
        status: 'completed',
        result: { modules: [], events: [], warnings: [] },
        error: { code: 'PARSE_FAILED', message: 'bad pdf' },
      }),
    ).rejects.toThrow(
      'PDF parser callback did not match the shared parser contract',
    );

    expect(jobStore.recordCallback).not.toHaveBeenCalled();
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

type MockPdfParserJobStore = {
  findDuplicate: jest.Mock;
  findJob: jest.Mock;
  recordCallback: jest.Mock;
};

type MockPdfParseSubmission = {
  submit: jest.Mock;
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
  buffer: Buffer.from(
    '%PDF-1.7\n1 0 obj\n<< /Length 7 >>\nstream\npayload\nendstream\nendobj\n',
  ),
  size: 67,
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

const uploadResponse = {
  jobId: queuedRecord.jobId,
  fileKey: queuedRecord.fileKey,
  adapterKey: queuedRecord.adapterKey,
  status: queuedRecord.status,
  result: queuedRecord.result,
  error: queuedRecord.error,
  moduleGroupingId: queuedRecord.moduleGroupingId,
  createdAt: queuedRecord.createdAt,
  updatedAt: queuedRecord.updatedAt,
  statusUrl: `/pdf-parser/jobs/${queuedRecord.jobId}`,
};
