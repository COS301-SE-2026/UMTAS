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

  it('enqueues PDF parse payloads with the backend job id as BullMQ jobId', async () => {
    const payload: PdfParseJobData = {
      jobId: 'parse-1',
      fileKey: 'uploads/parse-1.pdf',
      adapterKey: 'up',
    };

    await service.enqueuePdfParseJob(payload);

    expect(pdfParseAdd).toHaveBeenCalledWith(PDF_PARSE_JOB_NAME, payload, {
      jobId: 'parse-1',
    });
  });

  it('enqueues timetable solve payloads with the backend job id as BullMQ jobId', async () => {
    const payload: TimetableSolveJobData = {
      jobId: 'solve-1',
      solverKey: 'default',
      mode: 'feasibility',
    };

    await service.enqueueTimetableSolveJob(payload);

    expect(timetableSolveAdd).toHaveBeenCalledWith(
      TIMETABLE_SOLVE_JOB_NAME,
      payload,
      { jobId: 'solve-1' },
    );
  });
});
