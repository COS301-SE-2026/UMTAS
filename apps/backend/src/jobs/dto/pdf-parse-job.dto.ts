import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import type { PdfParseJobData } from 'shared-types';

export class PdfParseJobDto implements PdfParseJobData {
  @ApiProperty({ example: 'parse-job-123' })
  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @ApiProperty({ example: 'uploads/timetables/parse-job-123.pdf' })
  @IsString()
  @IsNotEmpty()
  fileKey!: string;

  @ApiProperty({ example: 'up' })
  @IsString()
  @IsNotEmpty()
  adapterKey!: string;
}
