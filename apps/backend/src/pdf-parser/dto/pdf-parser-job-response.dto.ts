import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PdfParserResult, WorkerCallbackError } from 'shared-types';
import {
  PdfParserResultDto,
  WorkerCallbackErrorDto,
} from '../../jobs/dto/worker-contract.dto';

export class PdfParserJobResponseDto {
  @ApiProperty({ example: 'pdf-parse-2d82d1ff-fb51-4c67-80cf-61d88c12d596' })
  jobId!: string;

  @ApiPropertyOptional({
    example:
      'uploads/pdf-parser/pdf-parse-2d82d1ff-fb51-4c67-80cf-61d88c12d596/timetable.pdf',
    nullable: true,
  })
  fileKey!: string | null;

  @ApiPropertyOptional({ example: 'up', nullable: true })
  adapterKey!: string | null;

  @ApiProperty({ enum: ['queued', 'completed', 'failed'] })
  status!: 'queued' | 'completed' | 'failed';

  @ApiPropertyOptional({ type: PdfParserResultDto })
  result?: PdfParserResult;

  @ApiPropertyOptional({ type: WorkerCallbackErrorDto })
  error?: WorkerCallbackError;

  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000000',
    nullable: true,
  })
  moduleGroupingId?: string | null;

  @ApiProperty({ example: '2026-07-02T10:15:30.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-07-02T10:15:45.000Z' })
  updatedAt!: string;
}

export class PdfParserUploadResponseDto extends PdfParserJobResponseDto {
  @ApiProperty({
    example: '/pdf-parser/jobs/pdf-parse-2d82d1ff-fb51-4c67-80cf-61d88c12d596',
  })
  statusUrl!: string;
}

export class PdfParserLookupResponseDto {
  @ApiProperty({ type: Boolean, example: true })
  duplicate!: boolean;

  @ApiPropertyOptional({
    example: 'pdf-parse-2d82d1ff-fb51-4c67-80cf-61d88c12d596',
  })
  jobId?: string;

  @ApiPropertyOptional({ enum: ['queued', 'completed', 'failed'] })
  status?: 'queued' | 'completed' | 'failed';

  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000000',
    nullable: true,
  })
  moduleGroupingId?: string | null;

  @ApiPropertyOptional({ type: Boolean, example: true })
  resultAvailable?: boolean;

  @ApiPropertyOptional({
    example: '/pdf-parser/jobs/pdf-parse-2d82d1ff-fb51-4c67-80cf-61d88c12d596',
  })
  statusUrl?: string;
}
