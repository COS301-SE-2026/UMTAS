import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';
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
    example: '120afed7-9444-4d9c-a7f2-8f08dc2b7d70',
    description: 'Academic calendar whose restrictions must be applied.',
  })
  @IsUUID()
  academicCalendarId!: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '339cd591-7c62-4ea7-8a2b-602598553133',
    description: 'Timetable containing the source events to generate.',
  })
  @IsUUID()
  timetableId!: string;
}

export class Rfc5545CalendarDto {
  @ApiProperty({
    type: String,
    enum: ['-//UMTAS//Academic Calendar//EN'],
    example: '-//UMTAS//Academic Calendar//EN',
  })
  prodId!: '-//UMTAS//Academic Calendar//EN';

  @ApiProperty({ type: String, enum: ['2.0'], example: '2.0' })
  version!: '2.0';

  @ApiProperty({ type: String, enum: ['GREGORIAN'], example: 'GREGORIAN' })
  calendarScale!: 'GREGORIAN';
}

export class Rfc5545TimedEventDto {
  @ApiProperty({
    example: 'series-cos301-l1-monday@umtas',
    description: 'Globally unique, stable RFC 5545 event UID.',
  })
  uid!: string;

  @ApiProperty({
    example: '20260811T103000Z',
    pattern: '^\\d{8}T\\d{6}Z$',
    description: 'UTC basic-format creation timestamp.',
  })
  dtstamp!: string;

  @ApiProperty({
    example: 'Africa/Johannesburg',
    description: 'IANA timezone used by all local timed values.',
  })
  tzid!: string;

  @ApiProperty({
    example: '20260202T083000',
    pattern: '^\\d{8}T\\d{6}$',
    description: 'Local basic-format event start.',
  })
  dtstart!: string;

  @ApiProperty({
    example: '20260202T092000',
    pattern: '^\\d{8}T\\d{6}$',
    description: 'Local basic-format event end.',
  })
  dtend!: string;

  @ApiProperty({
    example: 'COS301 Lecture',
    description: 'RFC 5545-escaped TEXT value.',
  })
  summary!: string;

  @ApiPropertyOptional({
    example: 'Week 1 overview',
    description: 'RFC 5545-escaped TEXT value.',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'IT 4-1',
    description: 'RFC 5545-escaped TEXT value.',
  })
  location?: string;

  @ApiProperty({ type: String, enum: ['CONFIRMED'], example: 'CONFIRMED' })
  status!: 'CONFIRMED';

  @ApiProperty({ type: Number, enum: [0], example: 0 })
  sequence!: 0;

  @ApiPropertyOptional({
    example: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;UNTIL=20260622T063000Z',
    description: 'RRULE value without the RRULE property-name prefix.',
  })
  rrule?: string;

  @ApiProperty({
    type: [String],
    example: ['20260330T083000'],
    description: 'Excluded local date-times in the same timezone as DTSTART.',
  })
  exdate!: string[];

  @ApiProperty({
    type: [String],
    example: ['20260403T083000'],
    description: 'Additional local date-times in the same timezone as DTSTART.',
  })
  rdate!: string[];
}

export class Rfc5545AllDayEventDto {
  @ApiProperty({ example: 'restriction-f8429809@umtas' })
  uid!: string;

  @ApiProperty({ example: '20260811T103000Z', pattern: '^\\d{8}T\\d{6}Z$' })
  dtstamp!: string;

  @ApiProperty({
    example: '20260427',
    pattern: '^\\d{8}$',
    description: 'Inclusive all-day start in RFC DATE format.',
  })
  dtstart!: string;

  @ApiProperty({
    example: '20260428',
    pattern: '^\\d{8}$',
    description: 'Exclusive all-day end in RFC DATE format.',
  })
  dtend!: string;

  @ApiProperty({
    example: 'Freedom Day',
    description: 'RFC 5545-escaped TEXT.',
  })
  summary!: string;

  @ApiPropertyOptional({
    example: 'Public holiday',
    description: 'RFC 5545-escaped TEXT.',
  })
  description?: string;

  @ApiProperty({ type: String, enum: ['CONFIRMED'], example: 'CONFIRMED' })
  status!: 'CONFIRMED';

  @ApiProperty({ type: Number, enum: [0], example: 0 })
  sequence!: 0;
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

  @ApiProperty({ type: () => Rfc5545TimedEventDto })
  rfc5545!: Rfc5545TimedEventDto;
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

  @ApiProperty({ type: () => Rfc5545TimedEventDto })
  rfc5545!: Rfc5545TimedEventDto;
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

  @ApiProperty({ type: () => Rfc5545AllDayEventDto })
  rfc5545!: Rfc5545AllDayEventDto;
}

export class GeneratedCalendarWarningDto {
  @ApiProperty({ example: 'MODULE_SEMESTER_MISSING' })
  code!: string;

  @ApiProperty({ example: 'COS301 has no semester assignment.' })
  message!: string;

  @ApiPropertyOptional({
    type: String,
    example: '6d3689c6-983b-4a6e-9da5-d12998290892',
    description: 'Identifier of the source record that caused the warning.',
  })
  sourceId?: string;
}

export class GeneratedCalendarPayloadDto {
  @ApiProperty({ type: Number, enum: [1], example: 1 })
  schemaVersion!: 1;

  @ApiProperty({ example: 'University of Pretoria 2026 Academic Calendar' })
  name!: string;

  @ApiProperty({ type: Number, minimum: 1000, maximum: 9999, example: 2026 })
  year!: number;

  @ApiProperty({
    example: 'Africa/Johannesburg',
    description: 'IANA timezone for all generated timed events.',
  })
  timezone!: string;

  @ApiProperty({ type: () => Rfc5545CalendarDto })
  @ValidateNested()
  @Type(() => Rfc5545CalendarDto)
  rfc5545!: Rfc5545CalendarDto;

  @ApiProperty({ type: () => [GeneratedRecurringEventDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedRecurringEventDto)
  recurringEvents!: GeneratedRecurringEventDto[];

  @ApiProperty({ type: () => [GeneratedOneOffEventDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedOneOffEventDto)
  oneOffEvents!: GeneratedOneOffEventDto[];

  @ApiProperty({ type: () => [GeneratedAllDayEventDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedAllDayEventDto)
  allDayEvents!: GeneratedAllDayEventDto[];

  @ApiProperty({ type: () => [GeneratedCalendarWarningDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedCalendarWarningDto)
  warnings!: GeneratedCalendarWarningDto[];
}

export class GeneratedCalendarDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  academicCalendarId!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  timetableId!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  universityId!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-08-11T10:30:00.000Z',
  })
  generatedAt!: string;

  @ApiProperty({ type: () => GeneratedCalendarPayloadDto })
  @ValidateNested()
  @Type(() => GeneratedCalendarPayloadDto)
  payload!: GeneratedCalendarPayloadDto;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}
