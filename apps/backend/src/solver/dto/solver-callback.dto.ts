import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { SolverCallbackPayload } from 'shared-types';
import { WorkerCallbackErrorDto } from '../../pdf-parser/dto/pdf-parser-callback.dto';

export class SolverCallbackDto implements SolverCallbackPayload {
  @ApiProperty({ enum: ['completed', 'failed'] })
  @IsIn(['completed', 'failed'])
  status!: 'completed' | 'failed';

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description:
      'Temporary payload shape until the solver output contract is final.',
  })
  @IsOptional()
  @IsObject()
  result?: Record<string, unknown>;

  @ApiPropertyOptional({ type: () => WorkerCallbackErrorDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkerCallbackErrorDto)
  error?: WorkerCallbackErrorDto;
}
