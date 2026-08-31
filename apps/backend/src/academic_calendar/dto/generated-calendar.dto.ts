import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  CALENDAR_RESTRICTION_TYPES,
  WEEKDAYS,
  type CalendarRestrictionType,
  type Weekday,
} from '../../entities/AcademicCalendar/calendar.types';

export class GenerateCalendarDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '339cd591-7c62-4ea7-8a2b-602598553133',
    description: 'Timetable containing the source events to generate.',
  })
  @IsUUID()
  timetableId!: string;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1000,
    maximum: 9999,
    example: 2027,
    description: 'Academic year to generate. Defaults to the current UTC year.',
  })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(9999)
  year?: number;
}

export class GeneratedRecurringEventDto {
  @ApiProperty({
    example: 'cos301-l1-monday',
    description: 'Stable series key.',
  })
  key!: string;

  @ApiProperty({ example: 'COS301 Lecture' })
  title!: string;

  @ApiPropertyOptional({ example: 'Lecture group 1' })
  description?: string;

  @ApiPropertyOptional({ example: 'IT 4-1' })
  location?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  moduleId?: string;

  @ApiPropertyOptional({ example: '#3B82F6' })
  moduleColour?: string;

  @ApiProperty({ example: '08:30', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })
  startTime!: string;

  @ApiProperty({ example: '09:20', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })
  endTime!: string;

  @ApiProperty({ enum: WEEKDAYS, enumName: 'Weekday', example: 'MONDAY' })
  weekday!: Weekday;

  @ApiProperty({ type: String, format: 'date', example: '2026-02-02' })
  startsOn!: string;

  @ApiProperty({ type: String, format: 'date', example: '2026-06-22' })
  endsOn!: string;

  @ApiProperty({
    type: [String],
    items: { type: 'string', format: 'date' },
    example: ['2026-03-30'],
    description: 'Dates removed from the weekly series.',
  })
  excludedDates!: string[];

  @ApiProperty({
    type: [String],
    items: { type: 'string', format: 'date' },
    example: ['2026-04-03'],
    description: 'Dates added to the weekly series, normally by day swaps.',
  })
  additionalDates!: string[];
}

export class GeneratedOneOffEventDto {
  @ApiProperty({
    example: 'exam-cos301-20260615',
    description: 'Stable event key.',
  })
  key!: string;

  @ApiProperty({ example: 'COS301 Exam' })
  title!: string;

  @ApiPropertyOptional({ example: 'Main examination' })
  description?: string;

  @ApiPropertyOptional({ example: 'Exam Hall A' })
  location?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  moduleId?: string;

  @ApiPropertyOptional({ example: '#3B82F6' })
  moduleColour?: string;

  @ApiProperty({ type: String, format: 'date', example: '2026-06-15' })
  date!: string;

  @ApiProperty({ example: '09:00', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })
  startTime!: string;

  @ApiProperty({ example: '12:00', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })
  endTime!: string;
}

export class GeneratedAllDayEventDto {
  @ApiProperty({
    example: 'restriction-f8429809',
    description: 'Stable event key.',
  })
  key!: string;

  @ApiProperty({ example: 'Freedom Day' })
  title!: string;

  @ApiPropertyOptional({ example: 'Public holiday' })
  description?: string;

  @ApiProperty({
    enum: CALENDAR_RESTRICTION_TYPES,
    enumName: 'CalendarRestrictionType',
    example: 'PUBLIC_HOLIDAY',
  })
  type!: CalendarRestrictionType;

  @ApiProperty({ type: String, format: 'date', example: '2026-04-27' })
  startDate!: string;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-04-27',
    description: 'Inclusive domain end date.',
  })
  endDate!: string;
}

export class GeneratedCalendarWarningDto {
  @ApiProperty({ example: 'RECURRING_EVENT_CRITERIA_INVALID' })
  code!: string;

  @ApiProperty({
    example: 'COS301 Lecture is missing a weekday or time range.',
  })
  message!: string;

  @ApiPropertyOptional({
    type: String,
    example: '6d3689c6-983b-4a6e-9da5-d12998290892',
    description: 'Identifier of the source record that caused the warning.',
  })
  sourceId?: string;
}

export class GeneratedCalendarPayloadDto {
  @ApiProperty({ example: 'University of Pretoria 2026 Academic Calendar' })
  name!: string;

  @ApiProperty({ type: Number, minimum: 1000, maximum: 9999, example: 2026 })
  year!: number;

  @ApiProperty({ type: () => [GeneratedRecurringEventDto] })
  recurringEvents!: GeneratedRecurringEventDto[];

  @ApiProperty({ type: () => [GeneratedOneOffEventDto] })
  oneOffEvents!: GeneratedOneOffEventDto[];

  @ApiProperty({ type: () => [GeneratedAllDayEventDto] })
  allDayEvents!: GeneratedAllDayEventDto[];

  @ApiProperty({ type: () => [GeneratedCalendarWarningDto] })
  warnings!: GeneratedCalendarWarningDto[];
}

export class GeneratedCalendarDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: () => GeneratedCalendarPayloadDto })
  payload!: GeneratedCalendarPayloadDto;
}
