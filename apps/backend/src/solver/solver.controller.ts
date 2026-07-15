import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
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
  SolverPreferencesSchema,
  type SolverCallbackPayload,
  type SolverInput,
  type SolverResult,
} from 'shared-types';
import { Public } from '../auth/auth.guard';
import { CurrentSession, type SessionData } from '../auth/session.decorator';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import { TimetableSolveJobDto } from '../jobs/dto/timetable-solve-job.dto';
import { SolverCallbackDto } from './dto/solver-callback.dto';
import { SolverJobResponseDto } from './dto/solver-job-response.dto';
import { SolverInputBuilderService } from './solver-input-builder.service';
import { SolverJobStoreService } from './solver-job-store.service';
import type { SolverJobRecord } from './solver-job-store.service';
import { SolverSubmissionService } from './solver-submission.service';

@ApiTags('Solver')
@ApiBearerAuth('bearer')
@Controller('solver')
export class SolverController {
  constructor(
    private readonly jobStore: SolverJobStoreService,
    private readonly inputBuilder: SolverInputBuilderService,
    private readonly submission: SolverSubmissionService,
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
    @CurrentSession() session: SessionData,
    @Body() job: TimetableSolveJobDto,
  ): Promise<{
    accepted: true;
    jobId: string;
    status: 'queued' | 'completed' | 'failed';
    result?: SolverResult;
  }> {
    const validatedJob = validateTimetableSolveJob(job);
    const record = await this.submission.submit({
      userId: session.user.id,
      ...validatedJob,
    });
    return {
      accepted: true,
      jobId: record.jobId,
      status: record.status,
      result: record.result,
    };
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
  async getJob(
    @CurrentSession() session: SessionData,
    @Param('jobId') jobId: string,
  ): Promise<SolverJobResponseDto> {
    const job = await this.jobStore.findJob(jobId, { userId: session.user.id });
    if (!job) {
      throw new NotFoundException(`Solver job not found: ${jobId}`);
    }

    return toJobResponse(job);
  }

  @Get('jobs/:jobId/result')
  @ApiOperation({ summary: 'Get a completed solver result' })
  @ApiOkResponse({ type: Object })
  async getJobResult(
    @CurrentSession() session: SessionData,
    @Param('jobId') jobId: string,
  ): Promise<SolverResult> {
    const job = await this.jobStore.findJob(jobId, { userId: session.user.id });
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
    @Query('attemptToken', new ParseUUIDPipe()) attemptToken: string,
    @Body() body: SolverCallbackDto,
  ): Promise<{ accepted: true; jobId: string }> {
    const callback = validateSolverCallback(body);
    await this.jobStore.recordCallback(jobId, attemptToken, callback);

    return { accepted: true, jobId };
  }
}

function toJobResponse(job: SolverJobRecord): SolverJobResponseDto {
  return {
    jobId: job.jobId,
    solverProfileKey: job.solverProfileKey,
    solveMode: job.solveMode,
    requestedEngine: job.requestedEngine,
    status: job.status,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
    failedAt: job.failedAt,
  };
}

function validateTimetableSolveJob(job: TimetableSolveJobDto): {
  solverProfileKey: string;
  solveMode: 'feasibility' | 'optimization';
  engine: 'auto' | 'cp-sat' | 'ga';
  preferences: ReturnType<typeof SolverPreferencesSchema.parse>;
} {
  const result = SolverPreferencesSchema.safeParse(job.preferences ?? {});
  const solverProfileKey = job.solverProfileKey?.trim();
  const validMode =
    job.solveMode === 'feasibility' || job.solveMode === 'optimization';
  const engine = job.engine ?? 'auto';
  const validEngine =
    engine === 'auto' || engine === 'cp-sat' || engine === 'ga';
  if (result.success && solverProfileKey && validMode && validEngine) {
    return {
      solverProfileKey,
      solveMode: job.solveMode,
      engine,
      preferences: result.data,
    };
  }

  throw new BadRequestException({
    message: 'Timetable solve job did not match the shared queue contract',
    issues: result.success ? [] : result.error.issues,
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
