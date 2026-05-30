import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_SOLVER_OPTIMIZE } from '../redis/queue.constants';
import {
  SolverJobStatus,
  SolverCallbackDto,
  SubmitSolverJobDto,
} from './dto/solver.dto';

@Injectable()
export class SolverService {
  private readonly logger = new Logger(SolverService.name);

  constructor(
    @InjectQueue(QUEUE_SOLVER_OPTIMIZE) private readonly solverQueue: Queue,
  ) {}

  async submitJob(dto: SubmitSolverJobDto): Promise<{ jobId: string }> {
    const job = await this.solverQueue.add('optimize', dto, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    this.logger.log(`Submitted solver optimization job ${job.id}`);
    return { jobId: job.id || '' };
  }

  processCallback(dto: SolverCallbackDto): Promise<{ success: boolean }> {
    this.logger.log(
      `Received solver callback for job ${dto.jobId} with status ${dto.status}`,
    );

    if (
      dto.status === SolverJobStatus.FAILED ||
      dto.status === SolverJobStatus.INFEASIBLE
    ) {
      this.logger.error(
        `Solver job ${dto.jobId} failed or is infeasible: ${dto.error}`,
      );
      return Promise.resolve({ success: true });
    }

    this.logger.log(
      `Successfully completed solver optimization for job ${dto.jobId}`,
    );
    return Promise.resolve({ success: true });
  }
}
