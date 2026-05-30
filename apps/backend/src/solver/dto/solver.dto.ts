import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum SolverJobStatus {
  COMPLETED = 'completed',
  FAILED = 'failed',
  INFEASIBLE = 'infeasible',
}

export class SolverCallbackDto {
  @ApiProperty({
    description: 'The unique BullMQ / Core job identifier',
    example: 'job_67890',
  })
  @IsString()
  jobId: string;

  @ApiProperty({
    description: 'Status of the constraint solving optimization job',
    enum: SolverJobStatus,
    example: 'completed',
  })
  @IsEnum(SolverJobStatus)
  status: SolverJobStatus;

  @ApiPropertyOptional({
    description: 'Reason message if the status is failed or infeasible',
    example: 'Hard constraint conflict on Room 101',
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({
    description: 'The generated timetable solution map',
    example: { assignments: [] },
  })
  @IsOptional()
  @IsObject()
  solution?: Record<string, any>;
}

export class SubmitSolverJobDto {
  @ApiProperty({
    description:
      'The input constraints definition for the scheduling optimizer',
    example: { classes: [], rooms: [], limits: {} },
  })
  @IsObject()
  constraints: Record<string, any>;
}
