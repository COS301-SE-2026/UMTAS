import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_PDF_PARSE } from '../redis/queue.constants';
import {
  JobStatus,
  PdfParserCallbackDto,
  SubmitPdfJobDto,
} from './dto/pdf-parser.dto';

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);

  constructor(@InjectQueue(QUEUE_PDF_PARSE) private readonly pdfQueue: Queue) {}

  async submitJob(dto: SubmitPdfJobDto): Promise<{ jobId: string }> {
    const job = await this.pdfQueue.add('parse', dto, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    this.logger.log(
      `Submitted PDF parse job ${job.id} for file ${dto.fileKey}`,
    );
    return { jobId: job.id || '' };
  }

  processCallback(dto: PdfParserCallbackDto): Promise<{ success: boolean }> {
    this.logger.log(
      `Received PDF parser callback for job ${dto.jobId} with status ${dto.status}`,
    );

    if (dto.status === JobStatus.FAILED) {
      this.logger.error(`PDF parse job ${dto.jobId} failed: ${dto.error}`);
      return Promise.resolve({ success: true });
    }

    this.logger.log(`Successfully parsed PDF data for job ${dto.jobId}`);
    return Promise.resolve({ success: true });
  }
}
