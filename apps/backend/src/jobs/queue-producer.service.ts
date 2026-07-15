import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Job, Queue } from 'bullmq';
import type { PdfParseJobData, TimetableSolveJobData } from 'shared-types';
import {
  PDF_PARSE_JOB_NAME,
  PDF_PARSE_QUEUE_TOKEN,
  TIMETABLE_SOLVE_JOB_NAME,
  TIMETABLE_SOLVE_QUEUE_TOKEN,
} from './queue.constants';

@Injectable()
export class QueueProducerService {
  constructor(
    @InjectQueue(PDF_PARSE_QUEUE_TOKEN)
    private readonly pdfParseQueue: Queue<PdfParseJobData>,
    @InjectQueue(TIMETABLE_SOLVE_QUEUE_TOKEN)
    private readonly timetableSolveQueue: Queue<TimetableSolveJobData>,
  ) {}

  enqueuePdfParseJob(data: PdfParseJobData): Promise<Job<PdfParseJobData>> {
    return this.pdfParseQueue.add(PDF_PARSE_JOB_NAME, data);
  }

  enqueueTimetableSolveJob(
    data: TimetableSolveJobData,
  ): Promise<Job<TimetableSolveJobData>> {
    return this.timetableSolveQueue.add(TIMETABLE_SOLVE_JOB_NAME, data, {
      jobId: data.attemptToken,
    });
  }
}
