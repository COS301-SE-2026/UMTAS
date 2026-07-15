import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { SolverResult } from 'shared-types';
import { WorkerCallbackErrorDto } from '../../pdf-parser/dto/pdf-parser-callback.dto';

export class SolverCallbackDto {
  @ApiProperty({ enum: ['completed', 'failed'] })
  @IsIn(['completed', 'failed'])
  status!: 'completed' | 'failed';

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
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
