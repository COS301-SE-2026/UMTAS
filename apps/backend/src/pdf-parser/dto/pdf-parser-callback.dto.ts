import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { PdfParserResult } from 'shared-types';

export class WorkerCallbackErrorDto {
  @ApiProperty({ example: 'PARSER_FAILED' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'PDF parser failed' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}

export class PdfParserCallbackDto {
  @ApiProperty({ enum: ['completed', 'failed'] })
  @IsIn(['completed', 'failed'])
  status!: 'completed' | 'failed';

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  result?: PdfParserResult;

  @ApiPropertyOptional({ type: () => WorkerCallbackErrorDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkerCallbackErrorDto)
  error?: WorkerCallbackErrorDto;
}
