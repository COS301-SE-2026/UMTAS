import { NotFoundException } from '@nestjs/common';
import type { ParseJob } from '../entities';
import { createParseJob } from '../Testing/Factories';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  createDbChain,
  mockDbResult,
  mockSequentialResults,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import { ParserResultImporter } from './parser-result-importer.service';
import {
  parsePublicJobId,
  PdfParserJobStoreService,
  toPublicJobId,
} from './pdf-parser-job-store.service';

const JOB_UUID = '11111111-1111-4111-8111-111111111111';
const NOW = new Date('2026-07-29T12:00:00.000Z');
const parserResult = { modules: [], events: [], warnings: [] };
const completedCallback = {
  status: 'completed' as const,
  result: parserResult,
};
const failedCallback = {
  status: 'failed' as const,
  error: {
    code: 'PARSE_FAILED',
    message: 'Unreadable PDF',
    details: { page: 2 },
  },
};

describe('PdfParserJobStoreService', () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(NOW));
  afterEach(() => jest.useRealTimers());

  function harness() {
    const { mockDb } = createMockDatabase();
    const importer = { importResult: jest.fn().mockResolvedValue('group-1') };
    return {
      mockDb,
      importer,
      service: new PdfParserJobStoreService(
        { db: mockDb } as never,
        importer as unknown as ParserResultImporter,
      ),
    };
  }

  it.each([[undefined], [[]], [['queued', 'completed']]])(
    'finds duplicates with correct optional status scoping %#',
    async (statuses) => {
      const h = harness();
      mockDbResult(h.mockDb.select as jest.Mock, [row()]);
      await expect(
        h.service.findDuplicate({
          userId: 'user-1',
          universityId: 'uni-1',
          adapterKey: 'up',
          fingerprintAlgorithm: 'sha-v1',
          pdfStreamHash: 'hash',
          statuses: statuses as never,
        }),
      ).resolves.toMatchObject({ jobId: `pdf-parse-${JOB_UUID}` });
      expect(h.mockDb.select).toHaveBeenCalledTimes(1);
    },
  );

  it('returns undefined when no duplicate exists', async () => {
    const h = harness();
    mockDbResult(h.mockDb.select as jest.Mock, []);
    await expect(
      h.service.findDuplicate({
        userId: 'user-1',
        universityId: 'uni-1',
        adapterKey: 'up',
        fingerprintAlgorithm: 'sha-v1',
        pdfStreamHash: 'hash',
      }),
    ).resolves.toBeUndefined();
  });

  it('creates and maps a queued job using the public ID', async () => {
    const h = harness();
    const insert = createDbChain([row()]);
    (h.mockDb.insert as jest.Mock).mockReturnValue(insert);
    await expect(
      h.service.createQueuedJob({
        jobId: `pdf-parse-${JOB_UUID}`,
        userId: 'user-1',
        universityId: 'uni-1',
        fileKey: 'uploads/file.pdf',
        adapterKey: 'up',
        clientPdfStreamHash: 'client-hash',
        pdfStreamHash: 'server-hash',
        fingerprintAlgorithm: 'sha-v1',
        streamCount: 3,
      }),
    ).resolves.toMatchObject({
      jobId: `pdf-parse-${JOB_UUID}`,
      status: 'queued',
    });
    expect(insert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        JobID: JOB_UUID,
        UserID: 'user-1',
        UniversityID: 'uni-1',
        ClientPdfStreamHash: 'client-hash',
        StreamCount: 3,
        CreatedAt: NOW,
        UpdatedAt: NOW,
      }),
    );
  });

  it('rejects an empty queued-job insertion result', async () => {
    const h = harness();
    mockDbResult(h.mockDb.insert as jest.Mock, []);
    await expect(
      h.service.createQueuedJob({
        jobId: JOB_UUID,
        userId: 'user-1',
        universityId: 'uni-1',
        fileKey: 'file',
        adapterKey: 'up',
        pdfStreamHash: 'hash',
        fingerprintAlgorithm: 'sha-v1',
        streamCount: 1,
      }),
    ).rejects.toThrow('PDF parser job could not be created');
  });

  it('marks infrastructure failure and maps error details', async () => {
    const h = harness();
    const failed = row({
      Status: 'failed',
      ErrorCode: 'QUEUE',
      ErrorMessage: 'offline',
      ErrorDetails: { host: 'redis' },
      FailedAt: NOW,
    });
    const update = createDbChain([failed]);
    (h.mockDb.update as jest.Mock).mockReturnValue(update);
    await expect(
      h.service.markInfrastructureFailure(JOB_UUID, {
        code: 'QUEUE',
        message: 'offline',
        details: { host: 'redis' },
      }),
    ).resolves.toMatchObject({
      status: 'failed',
      error: { code: 'QUEUE', details: { host: 'redis' } },
    });
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({ Status: 'failed', FailedAt: NOW }),
    );
  });

  it('rejects infrastructure failure for a missing job', async () => {
    const h = harness();
    mockDbResult(h.mockDb.update as jest.Mock, []);
    await expect(
      h.service.markInfrastructureFailure(JOB_UUID, {
        code: 'QUEUE',
        message: 'offline',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('retries a failed duplicate and clears all terminal state', async () => {
    const h = harness();
    const update = createDbChain([row()]);
    (h.mockDb.update as jest.Mock).mockReturnValue(update);
    await h.service.retryFailedDuplicate({
      jobId: JOB_UUID,
      fileKey: 'new-file',
      adapterKey: 'new-adapter',
      clientPdfStreamHash: 'client',
      pdfStreamHash: 'server',
      fingerprintAlgorithm: 'sha-v2',
      streamCount: 4,
    });
    expect(update.set).toHaveBeenCalledWith({
      FileKey: 'new-file',
      AdapterKey: 'new-adapter',
      ClientPdfStreamHash: 'client',
      PdfStreamHash: 'server',
      FingerprintAlgorithm: 'sha-v2',
      StreamCount: 4,
      Status: 'queued',
      Result: null,
      ErrorCode: null,
      ErrorMessage: null,
      ErrorDetails: null,
      GroupID: null,
      UpdatedAt: NOW,
      CompletedAt: null,
      FailedAt: null,
    });
  });

  it('rejects a missing or raced failed duplicate retry', async () => {
    const h = harness();
    mockDbResult(h.mockDb.update as jest.Mock, []);
    await expect(
      h.service.retryFailedDuplicate({
        jobId: JOB_UUID,
        fileKey: 'file',
        adapterKey: 'up',
        pdfStreamHash: 'hash',
        fingerprintAlgorithm: 'sha-v1',
        streamCount: 1,
      }),
    ).rejects.toThrow('not available for retry');
  });

  it.each([
    ['completed', completedCallback],
    ['failed', failedCallback],
  ] as const)(
    'records a %s callback transactionally',
    async (_status, callback) => {
      const h = harness();
      const updated =
        callback.status === 'completed'
          ? row({
              Status: 'completed',
              Result: parserResult,
              GroupID: 'group-1',
              CompletedAt: NOW,
            })
          : row({
              Status: 'failed',
              ErrorCode: callback.error.code,
              ErrorMessage: callback.error.message,
              ErrorDetails: callback.error.details,
              FailedAt: NOW,
            });
      mockTransaction(h.mockDb, { select: [[row()]], update: [[updated]] });
      await expect(
        h.service.recordCallback(JOB_UUID, callback as never),
      ).resolves.toMatchObject({ status: callback.status });
      if (callback.status === 'completed') {
        expect(h.importer.importResult).toHaveBeenCalledWith(
          h.mockDb,
          expect.objectContaining({ JobID: JOB_UUID }),
          parserResult,
        );
      } else {
        expect(h.importer.importResult).not.toHaveBeenCalled();
      }
    },
  );

  it.each([
    row({ Status: 'completed', Result: parserResult, GroupID: 'group-1' }),
    row({
      Status: 'failed',
      ErrorCode: failedCallback.error.code,
      ErrorMessage: failedCallback.error.message,
      ErrorDetails: failedCallback.error.details,
    }),
  ])(
    'accepts an equivalent terminal callback idempotently %#',
    async (existing) => {
      const h = harness();
      mockTransaction(h.mockDb, { select: [[existing]] });
      const callback =
        existing.Status === 'completed' ? completedCallback : failedCallback;
      await expect(
        h.service.recordCallback(JOB_UUID, callback as never),
      ).resolves.toMatchObject({ status: callback.status });
      expect(h.mockDb.update).not.toHaveBeenCalled();
    },
  );

  it('links an equivalent completed callback missing its domain group', async () => {
    const h = harness();
    const existing = row({
      Status: 'completed',
      Result: parserResult,
      GroupID: null,
    });
    const linked = row({
      Status: 'completed',
      Result: parserResult,
      GroupID: 'group-1',
    });
    mockTransaction(h.mockDb, {
      select: [[existing]],
      update: [[linked]],
    });
    await expect(
      h.service.recordCallback(JOB_UUID, completedCallback as never),
    ).resolves.toMatchObject({ moduleGroupingId: 'group-1' });
    expect(h.importer.importResult).toHaveBeenCalled();
  });

  it('rejects missing, conflicting, terminal, callback-update, and linking races', async () => {
    const cases = [
      {
        existing: undefined,
        callback: completedCallback,
        message: 'not found',
      },
      {
        existing: row({
          Status: 'completed',
          Result: {
            ...parserResult,
            warnings: [
              { code: 'DIFFERENT', message: 'Different', details: {} },
            ],
          },
        }),
        callback: completedCallback,
        message: 'different completed callback',
      },
      {
        existing: row({
          Status: 'failed',
          ErrorCode: failedCallback.error.code,
          ErrorMessage: failedCallback.error.message,
        }),
        callback: completedCallback,
        message: 'already failed',
      },
    ];
    for (const testCase of cases) {
      const h = harness();
      mockTransaction(h.mockDb, {
        select: [testCase.existing ? [testCase.existing] : []],
      });
      await expect(
        h.service.recordCallback(JOB_UUID, testCase.callback as never),
      ).rejects.toThrow(testCase.message);
    }

    const updateRace = harness();
    mockTransaction(updateRace.mockDb, { select: [[row()]], update: [[]] });
    await expect(
      updateRace.service.recordCallback(JOB_UUID, failedCallback as never),
    ).rejects.toThrow('changed while recording callback');

    const linkRace = harness();
    mockTransaction(linkRace.mockDb, {
      select: [[row({ Status: 'completed', Result: parserResult })]],
      update: [[]],
    });
    await expect(
      linkRace.service.recordCallback(JOB_UUID, completedCallback as never),
    ).rejects.toThrow('changed while linking parser result');
  });

  it('supports scoped and unscoped lookup, missing jobs, and optional mapping', async () => {
    const h = harness();
    const full = row({
      FileKey: null,
      Status: 'completed',
      Result: parserResult,
      GroupID: null,
    });
    mockSequentialResults(h.mockDb.select as jest.Mock, [[full], [full], []]);
    await expect(h.service.findJob(JOB_UUID)).resolves.toMatchObject({
      fileKey: null,
      adapterKey: 'up',
      result: parserResult,
      moduleGroupingId: null,
    });
    await expect(
      h.service.findJob(`pdf-parse-${JOB_UUID}`, { userId: 'user-1' }),
    ).resolves.toMatchObject({ jobId: `pdf-parse-${JOB_UUID}` });
    await expect(h.service.findJob(JOB_UUID)).resolves.toBeUndefined();
  });

  it('rejects invalid persisted status and malformed public IDs', async () => {
    const h = harness();
    mockDbResult(h.mockDb.select as jest.Mock, [row({ Status: 'invalid' })]);
    await expect(h.service.findJob(JOB_UUID)).rejects.toThrow(
      'Unsupported PDF parser job status',
    );
    expect(parsePublicJobId(` pdf-parse-${JOB_UUID} `)).toBe(JOB_UUID);
    expect(parsePublicJobId(JOB_UUID)).toBe(JOB_UUID);
    expect(toPublicJobId(JOB_UUID)).toBe(`pdf-parse-${JOB_UUID}`);
    expect(toPublicJobId(`pdf-parse-${JOB_UUID}`)).toBe(
      `pdf-parse-${JOB_UUID}`,
    );
    expect(() => parsePublicJobId('bad')).toThrow(NotFoundException);
  });
});

function row(overrides: Partial<ParseJob> = {}): ParseJob {
  return createParseJob({
    JobID: JOB_UUID,
    UserID: 'user-1',
    UniversityID: 'uni-1',
    AdapterKey: 'up',
    FileKey: 'file.pdf',
    CreatedAt: NOW,
    UpdatedAt: NOW,
    ...overrides,
  });
}
