import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum JobStatus {
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class PdfParserCallbackDto {
  @ApiProperty({
    description: 'The unique BullMQ / Core job identifier',
    example: 'job_12345',
  })
  @IsString()
  jobId: string;

  @ApiProperty({
    description: 'Status of the parsing task',
    enum: JobStatus,
    example: 'completed',
  })
  @IsEnum(JobStatus)
  status: JobStatus;

  @ApiPropertyOptional({
    description: 'Error message if status is failed',
    example: 'Failed to extract tables',
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({
    description: 'The parsed output containing timetable structure',
    example: { tables: [] },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class SubmitPdfJobDto {
  @ApiProperty({
    description: 'The storage key of the PDF object in object storage',
    example: 'uploads/2026/timetable.pdf',
  })
  @IsString()
  fileKey: string;

  @ApiProperty({
    description: 'The university layout adapter identifier to use',
    example: 'university_a',
  })
  @IsString()
  universityId: string;
}
