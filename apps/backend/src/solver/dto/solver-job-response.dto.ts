import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SolverResult, WorkerCallbackError } from 'shared-types';
import {
  SolverResultDto,
  WorkerCallbackErrorDto,
} from '../../jobs/dto/worker-contract.dto';

export class SolverJobResponseDto {
  @ApiProperty({ example: 'solve-job-123' })
  jobId!: string;

  @ApiProperty({ enum: ['feasibility', 'optimization'] })
  solveMode!: 'feasibility' | 'optimization';

  @ApiPropertyOptional({ enum: ['auto', 'cp-sat', 'ga'] })
  requestedEngine?: 'auto' | 'cp-sat' | 'ga';

  @ApiProperty({ enum: ['queued', 'completed', 'failed'] })
  status!: 'queued' | 'completed' | 'failed';

  @ApiPropertyOptional({ type: SolverResultDto })
  result?: SolverResult;

  @ApiPropertyOptional({ type: WorkerCallbackErrorDto })
  error?: WorkerCallbackError;

  @ApiProperty({ example: '2026-07-13T10:15:30.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-07-13T10:15:45.000Z' })
  updatedAt!: string;

  @ApiPropertyOptional({ example: '2026-07-13T10:15:45.000Z' })
  completedAt?: string;

  @ApiPropertyOptional({ example: '2026-07-13T10:15:45.000Z' })
  failedAt?: string;
}
