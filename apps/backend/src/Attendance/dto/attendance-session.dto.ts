import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { SessionAttendanceCaptureMethodEnum } from '../../entities';
import type { SessionAttendanceCaptureMethodType } from '../../entities';

function numberValue(value: unknown): unknown {
  return typeof value === 'string' && value.trim() !== ''
    ? Number(value)
    : value;
}

export class CreateAttendanceSessionDto {
  @ApiProperty({
    description: 'Event represented by this dated attendance session',
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
  })
  @IsUUID()
  eventID!: string;

  @ApiProperty({
    description: 'Scheduled occurrence start time',
    format: 'date-time',
    example: '2026-09-15T08:00:00.000Z',
  })
  @IsDateString()
  scheduledStartAt!: string;

  @ApiProperty({
    description: 'Scheduled occurrence end time',
    format: 'date-time',
    example: '2026-09-15T10:00:00.000Z',
  })
  @IsDateString()
  scheduledEndAt!: string;
}

export class UpdateAttendanceSessionDto extends PartialType(
  CreateAttendanceSessionDto,
) {}

export class AttendanceSessionFiltersDto {
  @ApiPropertyOptional({
    description: 'Limit results to one event',
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
  })
  @IsOptional()
  @IsUUID()
  eventID?: string;
}

export class RecordBarcodeAttendanceDto {
  @ApiProperty({
    description: 'Current guest headcount observed by the scanner',
    minimum: 0,
    example: 42,
  })
  @Transform(({ value }) => numberValue(value))
  @IsInt()
  @Min(0)
  guestCount!: number;

  @ApiPropertyOptional({
    description: 'Event to record attendance against when selecting a slot',
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
  })
  @IsOptional()
  @IsUUID()
  eventID?: string;
}

export class RecordAttendanceDto {
  @ApiProperty({
    description: 'NFC is the capture adapter for this endpoint',
    enum: ['NFC'],
    example: 'NFC',
  })
  @Equals('NFC')
  captureMethod!: 'NFC';

  @ApiProperty({
    description: 'Registered NFC tag identifier',
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000002',
  })
  @IsUUID()
  tagId!: string;

  @ApiProperty({
    description: 'Secret credential stored on the NFC tag',
    minLength: 32,
    maxLength: 128,
    example: 'abcdefghijklmnopqrstuvwxyz012345',
  })
  @IsString()
  @Length(32, 128)
  @Matches(/^[A-Za-z0-9_-]+$/)
  token!: string;
}

export enum AttendanceRecordStatus {
  RECORDED = 'RECORDED',
  ALREADY_RECORDED = 'ALREADY_RECORDED',
  NO_CURRENT_EVENT = 'NO_CURRENT_EVENT',
  AMBIGUOUS_EVENT = 'AMBIGUOUS_EVENT',
  INVALID_TAG = 'INVALID_TAG',
}

export class AttendanceRecordResponseDto {
  @ApiProperty({
    description: 'Outcome of the attendance capture',
    enum: AttendanceRecordStatus,
    example: AttendanceRecordStatus.RECORDED,
  })
  @IsEnum(AttendanceRecordStatus)
  status!: AttendanceRecordStatus;

  @ApiProperty({
    description: 'Human-readable result suitable for a toast',
    example: 'Attendance recorded.',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Resolved attendance session',
    format: 'uuid',
    nullable: true,
  })
  sessionId?: string | null;

  @ApiPropertyOptional({
    description: 'Time at which attendance was recorded',
    format: 'date-time',
    nullable: true,
  })
  recordedAt?: Date | null;
}

export class SetGuestCountDto {
  @ApiProperty({
    description: 'Anonymous attendance total replacing the current value',
    minimum: 0,
    example: 12,
  })
  @Transform(({ value }) => numberValue(value))
  @IsInt()
  @Min(0)
  guestCount!: number;

  @ApiProperty({
    description: 'Source of the replacement count',
    enum: ['BARCODE', 'MANUAL'],
    example: 'BARCODE',
  })
  @IsIn(['BARCODE', 'MANUAL'])
  captureMethod!: 'BARCODE' | 'MANUAL';
}

export class AttendanceSessionResponseDto {
  @ApiProperty({ description: 'Attendance session identifier', format: 'uuid' })
  SessionID!: string;

  @ApiProperty({ description: 'Related event identifier', format: 'uuid' })
  eventID!: string;

  @ApiProperty({
    description: 'Scheduled occurrence start',
    format: 'date-time',
  })
  scheduledStartAt!: Date;

  @ApiProperty({ description: 'Scheduled occurrence end', format: 'date-time' })
  scheduledEndAt!: Date;

  @ApiProperty({ description: 'Session creation time', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last session update time', format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Number of distinct identified attendees',
    example: 8,
  })
  identifiedCount!: number;

  @ApiProperty({
    description: 'Current anonymous attendance count',
    example: 3,
  })
  guestCount!: number;

  @ApiProperty({
    description: 'Identified plus anonymous attendance',
    example: 11,
  })
  attendedCount!: number;
}

export class AttendanceSessionListResponseDto {
  @ApiProperty({
    description: 'Attendance sessions visible to the operator',
    type: [AttendanceSessionResponseDto],
  })
  sessionList!: AttendanceSessionResponseDto[];
}

export class SessionAttendanceResponseDto {
  @ApiProperty({ description: 'Attendance record identifier', format: 'uuid' })
  AttendanceID!: string;

  @ApiProperty({ description: 'Parent attendance session', format: 'uuid' })
  SessionID!: string;

  @ApiProperty({
    description: 'Identified attendee, or null for the anonymous count row',
    format: 'uuid',
    nullable: true,
  })
  UserID!: string | null;

  @ApiProperty({
    description: 'Anonymous count, or null for an identified attendee',
    type: Number,
    nullable: true,
    minimum: 0,
  })
  guestCount!: number | null;

  @ApiProperty({
    description: 'Most recent capture method for this record',
    enum: SessionAttendanceCaptureMethodEnum,
  })
  captureMethod!: SessionAttendanceCaptureMethodType;

  @ApiProperty({ description: 'Initial recording time', format: 'date-time' })
  recordedAt!: Date;

  @ApiProperty({ description: 'Last update time', format: 'date-time' })
  updatedAt!: Date;
}

export class VerifiedAttendanceHistoryResponseDto {
  @ApiProperty({
    description: 'Identified attendance belonging to the current user',
    type: [SessionAttendanceResponseDto],
  })
  attendanceList!: SessionAttendanceResponseDto[];
}

export class AttendanceCaptureResultDto {
  @ApiProperty({
    description: 'Whether a new identified record was inserted',
    enum: ['RECORDED', 'ALREADY_RECORDED'],
  })
  status!: 'RECORDED' | 'ALREADY_RECORDED';

  @ApiProperty({ type: SessionAttendanceResponseDto })
  attendance!: SessionAttendanceResponseDto;
}

export class DeleteAttendanceSessionResponseDto {
  @ApiProperty({
    description: 'Whether the session was deleted',
    example: true,
  })
  success!: boolean;
}
