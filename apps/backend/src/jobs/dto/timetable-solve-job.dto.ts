import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { TimetableSolveJobData } from 'shared-types';

export class TimetableSolveJobDto implements TimetableSolveJobData {
  @ApiProperty({ example: 'solve-job-123' })
  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @ApiProperty({ example: 'default' })
  @IsString()
  @IsNotEmpty()
  solverProfileKey!: string;

  @ApiProperty({ enum: ['feasibility', 'optimization'] })
  @IsIn(['feasibility', 'optimization'])
  solveMode!: 'feasibility' | 'optimization';

  @ApiProperty({
    enum: ['auto', 'cp-sat', 'ga'],
    required: false,
    default: 'auto',
  })
  @IsOptional()
  @IsIn(['auto', 'cp-sat', 'ga'])
  engine?: 'auto' | 'cp-sat' | 'ga';
}
