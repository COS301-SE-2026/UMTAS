import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import {
  CALENDAR_RESTRICTION_TYPES,
  WEEKDAYS,
  type CalendarRestrictionType,
  type Weekday,
} from '../../entities/AcademicCalendar/calendar.types';

const DOMAIN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class CreateCalendarRestrictionDto {
  @ApiProperty({
    enum: CALENDAR_RESTRICTION_TYPES,
    enumName: 'CalendarRestrictionType',
    example: 'PUBLIC_HOLIDAY',
    description:
      'How this restriction affects semester bounds or generated events.',
  })
  @IsEnum(CALENDAR_RESTRICTION_TYPES)
  type!: CalendarRestrictionType;

  @ApiProperty({
    type: String,
    format: 'date',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    example: '2026-04-27',
    description: 'Inclusive first date in YYYY-MM-DD format.',
  })
  @Matches(DOMAIN_DATE_PATTERN)
  @IsDateString({ strict: true })
  startDate!: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    example: '2026-04-27',
    description:
      'Inclusive final date in YYYY-MM-DD format. Defaults to startDate when omitted.',
  })
  @IsOptional()
  @Matches(DOMAIN_DATE_PATTERN)
  @IsDateString({ strict: true })
  endDate?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Freedom Day',
    default: '',
    description: 'Human-readable detail. Defaults to an empty string.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: WEEKDAYS,
    enumName: 'Weekday',
    example: 'MONDAY',
    description:
      'Teaching pattern to use on the target date. Required only for DAY_SWAP.',
  })
  @ValidateIf(
    (input: CreateCalendarRestrictionDto) =>
      input.type === 'DAY_SWAP' || input.replacementWeekday !== undefined,
  )
  @IsEnum(WEEKDAYS)
  replacementWeekday?: Weekday;
}

/** PUT performs a full replacement; type and startDate are therefore required. */
export class UpdateCalendarRestrictionDto extends CreateCalendarRestrictionDto {}

export class CalendarRestrictionDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: 'f8429809-2402-41a7-af75-28c463e83d5f',
    description: 'Unique restriction identifier.',
  })
  id!: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '120afed7-9444-4d9c-a7f2-8f08dc2b7d70',
    description: 'Academic calendar containing this restriction.',
  })
  academicCalendarId!: string;

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
    description: 'Inclusive final date.',
  })
  endDate!: string;

  @ApiProperty({ type: String, example: 'Freedom Day' })
  description!: string;

  @ApiPropertyOptional({
    enum: WEEKDAYS,
    enumName: 'Weekday',
    example: 'MONDAY',
    nullable: true,
    description: 'Present only for a DAY_SWAP restriction.',
  })
  replacementWeekday?: Weekday | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-08-11T10:30:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-08-11T10:30:00.000Z',
  })
  updatedAt!: string;
}

export class CalendarRestrictionListDto {
  @ApiProperty({
    type: [CalendarRestrictionDto],
    description: 'Restrictions belonging to the requested academic calendar.',
  })
  restrictions!: CalendarRestrictionDto[];
}

export class DeleteCalendarRestrictionResponseDto {
  @ApiProperty({
    type: Boolean,
    enum: [true],
    example: true,
    description: 'Confirms that the calendar restriction was deleted.',
  })
  success!: true;
}
