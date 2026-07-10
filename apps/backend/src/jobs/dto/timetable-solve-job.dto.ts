import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import type { TimetableSolveJobData } from 'shared-types';

export class TimetableSolveJobDto implements TimetableSolveJobData {
  @ApiProperty({ example: 'solve-job-123' })
  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @ApiProperty({ example: 'default' })
  @IsString()
  @IsNotEmpty()
  solverKey!: string;

  @ApiProperty({ enum: ['feasibility', 'optimization'] })
  @IsIn(['feasibility', 'optimization'])
  mode!: 'feasibility' | 'optimization';
}
