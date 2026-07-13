import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SolverResult, WorkerCallbackError } from 'shared-types';

export class SolverJobResponseDto {
  @ApiProperty({ example: 'solve-job-123' })
  jobId!: string;

  @ApiProperty({ example: 'default' })
  solverProfileKey!: string;

  @ApiProperty({ enum: ['feasibility', 'optimization'] })
  solveMode!: 'feasibility' | 'optimization';

  @ApiPropertyOptional({ enum: ['auto', 'cp-sat', 'ga'] })
  requestedEngine?: 'auto' | 'cp-sat' | 'ga';

  @ApiProperty({ enum: ['queued', 'completed', 'failed'] })
  status!: 'queued' | 'completed' | 'failed';

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  result?: SolverResult;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
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
