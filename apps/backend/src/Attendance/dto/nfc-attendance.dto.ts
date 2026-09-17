import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

function trimmedValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class NfcTagRegistrationResponseDto {
  @ApiProperty({ format: 'uuid' })
  tagId!: string;

  @ApiProperty()
  token!: string;

  @ApiProperty({ format: 'uri' })
  tagUrl!: string;

  @ApiProperty()
  activationTicket!: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;
}

export class ConfirmNfcTagRegistrationDto {
  @ApiProperty()
  @IsString()
  @Length(40, 2048)
  activationTicket!: string;
}

export class RegisteredNfcTagDto {
  @ApiProperty({ format: 'uuid' })
  tagId!: string;

  @ApiProperty()
  displayId!: string;

  @ApiProperty({ format: 'date-time' })
  registeredAt!: Date;
}

export class RegisteredNfcTagStatusDto {
  @ApiProperty({ type: RegisteredNfcTagDto, nullable: true })
  tag!: RegisteredNfcTagDto | null;
}

export class NfcCheckInDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tagId!: string;

  @ApiProperty({ minLength: 32, maxLength: 128 })
  @IsString()
  @Length(32, 128)
  @Matches(/^[A-Za-z0-9_-]+$/)
  token!: string;
}

export class NfcTagTestResponseDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  valid!: boolean;

  @ApiProperty()
  message!: string;

  @ApiPropertyOptional({ nullable: true })
  displayId?: string | null;
}

export class OperatorAttendanceSlotDto {
  @ApiProperty({ format: 'uuid' })
  eventID!: string;

  @ApiProperty()
  eventName!: string;

  @ApiProperty({ format: 'uuid' })
  moduleID!: string;

  @ApiProperty()
  moduleCode!: string;

  @ApiProperty()
  moduleName!: string;

  @ApiProperty({ nullable: true })
  venue!: string | null;

  @ApiProperty({ format: 'date-time' })
  scheduledStartAt!: Date;

  @ApiProperty({ format: 'date-time' })
  scheduledEndAt!: Date;

  @ApiProperty({ nullable: true, format: 'uuid' })
  sessionId!: string | null;

  @ApiProperty({
    description: 'Availability derived from the event time and capture buffer',
    enum: ['UPCOMING', 'AVAILABLE', 'ENDED'],
  })
  state!: 'UPCOMING' | 'AVAILABLE' | 'ENDED';

  @ApiProperty()
  attendanceCount!: number;
}

export class OperatorAttendanceSlotsResponseDto {
  @ApiProperty({ type: [OperatorAttendanceSlotDto] })
  slotList!: OperatorAttendanceSlotDto[];

  @ApiProperty({ type: Boolean })
  ambiguous!: boolean;

  @ApiPropertyOptional({ type: OperatorAttendanceSlotDto, nullable: true })
  currentSlot!: OperatorAttendanceSlotDto | null;
}

export class OperatorSlotsQueryDto {
  @ApiPropertyOptional({ example: '2026-09-17' })
  @Transform(({ value }) => trimmedValue(value))
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
