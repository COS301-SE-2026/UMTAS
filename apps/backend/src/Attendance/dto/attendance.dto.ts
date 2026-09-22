import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AttendanceStateEnum } from '../../entities';
import type { AttendanceStateType } from '../../entities';

export class CreateAttendanceDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Unique identifier for an event',
  })
  @IsUUID()
  @IsNotEmpty()
  eventID!: string;

  @ApiProperty({
    type: String,
    example: 'yyyy-mm-dd',
    description: 'Date of event for which attendance is recorded',
  })
  @IsString()
  @IsNotEmpty()
  eventDate!: string;

  @ApiProperty({
    enum: AttendanceStateEnum,
    example: AttendanceStateEnum.ATTENDING,
    description: 'Is the user attending this event or not',
  })
  @IsEnum(AttendanceStateEnum, {
    message:
      'state must be one of the following values: ATTENDING, NOT_ATTENDING',
  })
  @IsNotEmpty()
  state!: AttendanceStateType;
}

export class UpdateAttendanceDto extends PartialType(
  OmitType(CreateAttendanceDto, ['eventID']),
) {}

export class AttendanceSingleResponse extends CreateAttendanceDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Unique identifier for an EventAttendance record',
  })
  @IsUUID()
  @IsNotEmpty()
  AttendanceID!: string;
}

export class AttendanceListResponse {
  @ApiProperty({
    type: [AttendanceSingleResponse],
    description: 'List of attendance records',
  })
  attendanceList!: AttendanceSingleResponse[];
}

export class deleteAttendanceResponse {
  @ApiProperty({
    type: Boolean,
    description: 'successfully deleted or not',
    example: true,
  })
  success!: boolean;
}

export class AttendanceFilters extends PartialType(CreateAttendanceDto) {
  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Filter by current userId together with other filters',
  })
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  AlsoFilterByUser?: boolean;
}
