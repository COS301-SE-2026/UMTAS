import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  SolverCallbackPayloadSchema,
  TimetableSolveJobDataSchema,
  type SolverCallbackPayload,
  type SolverInput,
  type SolverResult,
  type TimetableSolveJobData,
} from 'shared-types';
import { Public } from '../auth/auth.guard';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import { QueueProducerService } from '../jobs/queue-producer.service';
import { TimetableSolveJobDto } from '../jobs/dto/timetable-solve-job.dto';
import { SolverCallbackDto } from './dto/solver-callback.dto';
import { SolverJobResponseDto } from './dto/solver-job-response.dto';
import { SolverInputBuilderService } from './solver-input-builder.service';
import { SolverJobStoreService } from './solver-job-store.service';

@ApiTags('Solver')
@ApiBearerAuth('bearer')
@Controller('solver')
export class SolverController {
  constructor(
    private readonly jobStore: SolverJobStoreService,
    private readonly queueProducer: QueueProducerService,
    private readonly inputBuilder: SolverInputBuilderService,
  ) {}

  @Post('jobs')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Persist and enqueue a timetable solve job',
  })
  @ApiAcceptedResponse({
    schema: {
      type: 'object',
      properties: {
        accepted: { type: 'boolean', example: true },
        jobId: { type: 'string', example: 'solve-job-123' },
      },
    },
  })
  async submitAndEnqueue(
    @Body() job: TimetableSolveJobDto,
  ): Promise<{ accepted: true; jobId: string }> {
    const validatedJob = validateTimetableSolveJob(job);
    const persistedJob = {
      jobId: validatedJob.jobId,
      solverProfileKey: validatedJob.solverProfileKey,
      solveMode: validatedJob.solveMode,
      requestedEngine: validatedJob.engine,
    };

    try {
      await this.jobStore.createQueuedJob(persistedJob);
    } catch (createError) {
      try {
        await this.jobStore.retryFailedJob(persistedJob);
      } catch {
        throw createError;
      }
    }

    try {
      await this.queueProducer.enqueueTimetableSolveJob(validatedJob);
    } catch (error) {
      await this.jobStore.markInfrastructureFailure(validatedJob.jobId, {
        code: 'SOLVER_ENQUEUE_FAILED',
        message: 'Solver job could not be enqueued',
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      });
      throw new InternalServerErrorException(
        'Solver job could not be enqueued',
      );
    }

    return { accepted: true, jobId: validatedJob.jobId };
  }

  @Get('jobs/:jobId/input')
  @Public()
  @UseGuards(WorkerCallbackAuthGuard)
  @ApiOperation({ summary: 'Build solver input for an authenticated worker' })
  @ApiOkResponse({ type: Object })
  getInput(@Param('jobId') jobId: string): Promise<SolverInput> {
    return this.inputBuilder.build(jobId);
  }

  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Get solver job status and persisted result metadata',
  })
  @ApiOkResponse({ type: SolverJobResponseDto })
  async getJob(@Param('jobId') jobId: string): Promise<SolverJobResponseDto> {
    const job = await this.jobStore.findJob(jobId);
    if (!job) {
      throw new NotFoundException(`Solver job not found: ${jobId}`);
    }

    return job;
  }

  @Get('jobs/:jobId/result')
  @ApiOperation({ summary: 'Get a completed solver result' })
  @ApiOkResponse({ type: Object })
  async getJobResult(@Param('jobId') jobId: string): Promise<SolverResult> {
    const job = await this.jobStore.findJob(jobId);
    if (job?.status !== 'completed' || !job.result) {
      throw new NotFoundException(`Solver result not found: ${jobId}`);
    }

    return job.result;
  }

  @Post('jobs/:jobId/callback')
  @Public()
  @UseGuards(WorkerCallbackAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Receive final solver worker callback' })
  async receiveCallback(
    @Param('jobId') jobId: string,
    @Body() body: SolverCallbackDto,
  ): Promise<{ accepted: true; jobId: string }> {
    const callback = validateSolverCallback(body);
    await this.jobStore.recordCallback(jobId, callback);

    return { accepted: true, jobId };
  }
}

function validateTimetableSolveJob(
  job: TimetableSolveJobDto,
): TimetableSolveJobData {
  const result = TimetableSolveJobDataSchema.safeParse(job);
  if (result.success) {
    return result.data;
  }

  throw new BadRequestException({
    message: 'Timetable solve job did not match the shared queue contract',
    issues: result.error.issues,
  });
}

function validateSolverCallback(
  body: SolverCallbackDto,
): SolverCallbackPayload {
  const payload =
    body.status === 'completed'
      ? { status: body.status, result: body.result }
      : { status: body.status, error: body.error };
  const result = SolverCallbackPayloadSchema.safeParse(payload);
  if (result.success) {
    return result.data;
  }

  throw new BadRequestException({
    message: 'Solver callback did not match the shared solver contract',
    issues: result.error.issues,
  });
}
