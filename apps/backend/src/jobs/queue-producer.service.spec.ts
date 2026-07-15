import type { Queue } from 'bullmq';
import type { PdfParseJobData, TimetableSolveJobData } from 'shared-types';
import { QueueProducerService } from './queue-producer.service';
import {
  PDF_PARSE_JOB_NAME,
  TIMETABLE_SOLVE_JOB_NAME,
} from './queue.constants';

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
    const payload: PdfParseJobData = {
      jobId: 'parse-1',
      fileKey: 'uploads/parse-1.pdf',
      adapterKey: 'up',
    };

    await service.enqueuePdfParseJob(payload);

    expect(pdfParseAdd).toHaveBeenCalledWith(PDF_PARSE_JOB_NAME, payload);
  });

  it('uses the attempt token as the idempotent solver execution ID', async () => {
    const payload: TimetableSolveJobData = {
      jobId: 'solve-1',
      attemptToken: '11111111-1111-4111-8111-111111111111',
      solveMode: 'feasibility',
      engine: 'auto',
    };

    await service.enqueueTimetableSolveJob(payload);

    expect(timetableSolveAdd).toHaveBeenCalledWith(
      TIMETABLE_SOLVE_JOB_NAME,
      payload,
      { jobId: payload.attemptToken },
    );
  });
});
