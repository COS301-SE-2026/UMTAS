import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import type { SessionInferenceResult } from './';

//SessionInferenceResultDto
export class SessionInferenceResultDto implements SessionInferenceResult {
  @ApiProperty({
    example: 12,
    description: 'Number of questions asked during the session',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  questions_asked!: number;

  @ApiProperty({ example: 40, minimum: 0 })
  @IsInt()
  @Min(0)
  total_restless_frames!: number;

  @ApiProperty({ example: 100, minimum: 0 })
  @IsInt()
  @Min(0)
  total_stable_frames!: number;

  @ApiProperty({ example: 80, minimum: 0 })
  @IsInt()
  @Min(0)
  total_paying_attention!: number;

  @ApiProperty({ example: 20, minimum: 0 })
  @IsInt()
  @Min(0)
  total_no_attention!: number;

  @ApiProperty({ example: 140, minimum: 0 })
  @IsInt()
  @Min(0)
  total_frames!: number;
} //END_SessionInferenceResultDto

//Base Dto
export class VisionSessionDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Unique identifier for a vision session',
  })
  @IsUUID()
  @IsNotEmpty()
  SessionID!: string;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Module the session belongs to',
  })
  @IsUUID()
  @IsNotEmpty()
  ModuleID!: string;

  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Event the session is linked to, if any',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  EventID?: string | null;

  @ApiProperty({
    example: '2026-01-02',
    description: 'Date the session occurred on',
    format: 'date',
  })
  @IsDateString({ strict: true })
  Date!: string;

  @ApiProperty({
    example: 'Lecture 3',
    description: 'Human readable name for the session',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 256)
  SessionName!: string;

  @ApiPropertyOptional({
    example: 'Covers chapter 4 and 5',
    description: 'Short session description',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  SessionDsc?: string | null;

  @ApiProperty({
    type: SessionInferenceResultDto,
    description: 'Aggregated inference results from the vision model',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => SessionInferenceResultDto)
  Data!: SessionInferenceResult;

  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'User who uploaded the session',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  CreatedBy?: string | null;

  @ApiProperty({
    example: '2026-01-02T08:00:00.000Z',
    description: 'When the session was created',
  })
  @IsDateString()
  CreatedAt!: string;
} //END_VisionSessionDto

// Create
export class CreateVisionSessionDto extends PickType(VisionSessionDto, [
  'ModuleID',
  'EventID',
  'Date',
  'SessionName',
  'SessionDsc',
  'Data',
] as const) {} //END_CreateVisionSessionDto

export class CreateVisionSessionInput extends CreateVisionSessionDto {
  CreatedBy!: string;
} //END_CreateVisionSessionInput

// Update
export class UpdateVisionSessionDto extends PartialType(
  PickType(VisionSessionDto, [
    'EventID',
    'Date',
    'SessionName',
    'SessionDsc',
    'Data',
  ] as const),
) {} //END_UpdateVisionSessionDto

//Responses
export class VisionSessionSingleResponseDto {
  @ApiProperty({ type: VisionSessionDto })
  session!: VisionSessionDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
} //END_VisionSessionSingleResponseDto

export class VisionSessionListResponseDto {
  @ApiProperty({ type: [VisionSessionDto] })
  sessions!: VisionSessionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
} //END_VisionSessionListResponseDto

// Query
export class VisionSessionQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by module ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional({
    description: 'Filter by event ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiPropertyOptional({
    description: 'Filter sessions from this date onward (inclusive)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @ApiPropertyOptional({
    description: 'Filter sessions up to this date (inclusive)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;

  @ApiPropertyOptional({
    description: 'Search on session name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 256)
  search?: string;
} //END_VisionSessionQueryDto

//Delete
export class DeleteVisionSessionResponseDto extends PickType(VisionSessionDto, [
  'SessionID',
  'SessionName',
] as const) {
  @ApiProperty({ example: true })
  success!: boolean;
} //END_DeleteVisionSessionResponseDto
