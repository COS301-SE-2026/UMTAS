import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsUUID, Min } from 'class-validator';
import {
  AttendanceCaptureModeEnum,
  AttendanceSessionStateEnum,
  SessionAttendanceCaptureMethodEnum,
} from '../../entities';
import type {
  AttendanceCaptureModeType,
  AttendanceSessionStateType,
  SessionAttendanceCaptureMethodType,
} from '../../entities';

export class CreateAttendanceSessionDto {
  @ApiProperty({ description: 'Event occurrence being materialised' })
  @IsUUID()
  eventID!: string;

  @ApiProperty({ example: '2026-09-15T08:00:00.000Z' })
  @IsDateString()
  scheduledStartAt!: string;

  @ApiProperty({ example: '2026-09-15T10:00:00.000Z' })
  @IsDateString()
  scheduledEndAt!: string;

  @ApiProperty({ example: '2026-09-15T07:45:00.000Z' })
  @IsDateString()
  captureOpensAt!: string;

  @ApiProperty({ example: '2026-09-15T10:15:00.000Z' })
  @IsDateString()
  captureClosesAt!: string;

  @ApiProperty({ enum: AttendanceCaptureModeEnum })
  @IsEnum(AttendanceCaptureModeEnum)
  captureMode!: AttendanceCaptureModeType;
}

export class RecordIdentifiedAttendanceDto {
  @ApiProperty({ description: 'Existing university user to record manually' })
  @IsUUID()
  UserID!: string;
}

export class SetGuestCountDto {
  @ApiProperty({ minimum: 0, example: 12 })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  )
  @IsInt()
  @Min(0)
  guestCount!: number;
}

export class AttendanceSessionResponseDto {
  @ApiProperty()
  SessionID!: string;

  @ApiProperty()
  eventID!: string;

  @ApiProperty()
  scheduledStartAt!: Date;

  @ApiProperty()
  scheduledEndAt!: Date;

  @ApiProperty()
  captureOpensAt!: Date;

  @ApiProperty()
  captureClosesAt!: Date;

  @ApiProperty({ enum: AttendanceSessionStateEnum })
  state!: AttendanceSessionStateType;

  @ApiProperty({ enum: AttendanceCaptureModeEnum })
  captureMode!: AttendanceCaptureModeType;

  @ApiProperty({ nullable: true })
  openedAt!: Date | null;

  @ApiProperty({ nullable: true })
  closedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  identifiedCount!: number;

  @ApiProperty()
  guestCount!: number;

  @ApiProperty()
  attendedCount!: number;
}

export class SessionAttendanceResponseDto {
  @ApiProperty()
  AttendanceID!: string;

  @ApiProperty()
  SessionID!: string;

  @ApiProperty({ nullable: true })
  UserID!: string | null;

  @ApiProperty({ nullable: true })
  guestCount!: number | null;

  @ApiProperty({ enum: SessionAttendanceCaptureMethodEnum })
  captureMethod!: SessionAttendanceCaptureMethodType;

  @ApiProperty()
  recordedAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class VerifiedAttendanceHistoryResponseDto {
  @ApiProperty({ type: [SessionAttendanceResponseDto] })
  attendanceList!: SessionAttendanceResponseDto[];
}

export class AttendanceCaptureResultDto {
  @ApiProperty({ enum: ['RECORDED', 'ALREADY_RECORDED'] })
  status!: 'RECORDED' | 'ALREADY_RECORDED';

  @ApiProperty({ type: SessionAttendanceResponseDto })
  attendance!: SessionAttendanceResponseDto;
}
