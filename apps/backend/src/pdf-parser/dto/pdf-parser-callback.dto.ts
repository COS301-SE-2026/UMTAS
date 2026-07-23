import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { PdfParserResult } from 'shared-types';
import {
  PdfParserResultDto,
  WorkerCallbackErrorDto,
} from '../../jobs/dto/worker-contract.dto';

export class PdfParserCallbackDto {
  @ApiProperty({ enum: ['completed', 'failed'] })
  @IsIn(['completed', 'failed'])
  status!: 'completed' | 'failed';

  @ApiPropertyOptional({ type: PdfParserResultDto })
  @IsOptional()
  @IsObject()
  result?: PdfParserResult;

  @ApiPropertyOptional({ type: () => WorkerCallbackErrorDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkerCallbackErrorDto)
  error?: WorkerCallbackErrorDto;
}
