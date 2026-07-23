import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { SolverResult } from 'shared-types';
import {
  SolverResultDto,
  WorkerCallbackErrorDto,
} from '../../jobs/dto/worker-contract.dto';

export class SolverCallbackDto {
  @ApiProperty({ enum: ['completed', 'failed'] })
  @IsIn(['completed', 'failed'])
  status!: 'completed' | 'failed';

  @ApiPropertyOptional({
    type: SolverResultDto,
    description: 'A valid timetable solution and its soft-heuristic scores.',
  })
  @IsOptional()
  @IsObject()
  result?: SolverResult;

  @ApiPropertyOptional({ type: () => WorkerCallbackErrorDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkerCallbackErrorDto)
  error?: WorkerCallbackErrorDto;
}
