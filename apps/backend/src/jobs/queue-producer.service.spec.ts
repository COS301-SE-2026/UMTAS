import type { Queue } from 'bullmq';
import type { PdfParseJobData, TimetableSolveJobData } from 'shared-types';
import {
  createPdfParseJobData,
  createTimetableSolveJobData,
} from '../Testing/Factories';
import { QueueProducerService } from './queue-producer.service';

describe('QueueProducerService', () => {
  const pdfParseAdd = jest.fn();
  const timetableSolveAdd = jest.fn();

  const pdfParseQueue = {
    add: pdfParseAdd,
  } as unknown as jest.Mocked<Queue<PdfParseJobData>>;
  const timetableSolveQueue = {
    add: timetableSolveAdd,
  } as unknown as jest.Mocked<Queue<TimetableSolveJobData>>;

  let service: QueueProducerService;

  beforeEach(() => {
    jest.clearAllMocks();
    pdfParseAdd.mockResolvedValue(undefined);
    timetableSolveAdd.mockResolvedValue(undefined);
    service = new QueueProducerService(pdfParseQueue, timetableSolveQueue);
  });

  it('enqueues PDF parse payloads without using the backend job id as BullMQ jobId', async () => {
    const payload = createPdfParseJobData({
      jobId: 'parse-1',
      fileKey: 'uploads/parse-1.pdf',
    });

    await service.enqueuePdfParseJob(payload);

    expect(pdfParseAdd).toHaveBeenCalledWith('parse-pdf', payload);
  });

  it('uses the attempt token as the idempotent solver execution ID', async () => {
    const payload = createTimetableSolveJobData({
      jobId: 'solve-1',
      attemptToken: '11111111-1111-4111-8111-111111111111',
      solveMode: 'feasibility',
    });

    await service.enqueueTimetableSolveJob(payload);

    expect(timetableSolveAdd).toHaveBeenCalledWith('solve-timetable', payload, {
      jobId: payload.attemptToken,
    });
  });

  it.each([
    [
      'PDF',
      () =>
        service.enqueuePdfParseJob(
          createPdfParseJobData({
            jobId: 'parse-1',
            fileKey: 'file.pdf',
          }),
        ),
      pdfParseAdd,
    ],
    [
      'solver',
      () =>
        service.enqueueTimetableSolveJob(
          createTimetableSolveJobData({
            jobId: 'solve-1',
            attemptToken: '11111111-1111-4111-8111-111111111111',
            engine: 'ga',
          }),
        ),
      timetableSolveAdd,
    ],
  ] as const)('propagates %s queue rejection', async (_name, enqueue, add) => {
    const error = new Error('queue unavailable');
    add.mockRejectedValueOnce(error);
    await expect(enqueue()).rejects.toBe(error);
  });

  it('does not mutate either input payload', async () => {
    const pdfPayload = createPdfParseJobData({
      jobId: 'parse-1',
      fileKey: 'file.pdf',
    });
    const solverPayload = createTimetableSolveJobData({
      jobId: 'solve-1',
      attemptToken: '11111111-1111-4111-8111-111111111111',
      engine: 'ga',
    });
    const before = structuredClone({ pdfPayload, solverPayload });
    await service.enqueuePdfParseJob(pdfPayload);
    await service.enqueueTimetableSolveJob(solverPayload);
    expect({ pdfPayload, solverPayload }).toEqual(before);
  });
});
