import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ActivityTypeSchema } from 'shared-types';
import { EventSource, type DayOfWeek } from './event.types';

const DAY_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export class EventCriteriaDto {
  @ApiProperty({ enum: EventSource })
  @IsEnum(EventSource)
  eventSource!: EventSource;

  @ApiPropertyOptional({
    example: '2026-02-17',
    description: 'Required when the event is not recurring.',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  @ValidateIf((value: EventCriteriaDto) => !value.dayOfWeek)
  date?: string;

  @ApiPropertyOptional({
    enum: DAY_OF_WEEK,
    description: 'Required when the event is recurring.',
  })
  @IsOptional()
  @IsEnum(DAY_OF_WEEK)
  @ValidateIf((value: EventCriteriaDto) => !value.date)
  dayOfWeek?: DayOfWeek;

  @ApiProperty({ example: '08:30' }) @IsString() startTime!: string;
  @ApiProperty({ example: '10:20' }) @IsString() endTime!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() moduleId?: string;
}

export class UpdateEventCriteriaDto extends PartialType(EventCriteriaDto) {}

export class VenueDto {
  @ApiProperty() @IsUUID() venueId!: string;
  @ApiProperty() @IsString() venueName!: string;
}

export class EventDto {
  @ApiProperty() @IsUUID() eventId!: string;
  @ApiProperty({ type: EventCriteriaDto })
  @ValidateNested()
  @Type(() => EventCriteriaDto)
  eventCriteria!: EventCriteriaDto;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 32)
  eventName?: string;
  @ApiPropertyOptional({ enum: ActivityTypeSchema.options })
  @IsOptional()
  @IsEnum(ActivityTypeSchema.options)
  activityType?: (typeof ActivityTypeSchema.options)[number];
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 10)
  activityCode?: string | null;
  @ApiPropertyOptional({ type: [VenueDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VenueDto)
  venues?: VenueDto[];
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  validated?: boolean;
}

export class CreateEventDto extends PickType(EventDto, [
  'eventName',
  'activityCode',
  'eventCriteria',
  'venues',
  'isRecurring',
  'validated',
] as const) {
  @ApiPropertyOptional({
    enum: ActivityTypeSchema.options,
    description: 'Required when eventCriteria.moduleId is provided.',
  })
  @ValidateIf(
    (value: CreateEventDto) =>
      value.activityType !== undefined ||
      value.eventCriteria?.moduleId !== undefined,
  )
  @IsDefined()
  @IsEnum(ActivityTypeSchema.options)
  activityType?: (typeof ActivityTypeSchema.options)[number];
}
export class UpdateEventDto extends PartialType(
  OmitType(EventDto, ['eventId', 'eventCriteria', 'venues'] as const),
) {
  @ApiPropertyOptional({ type: UpdateEventCriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEventCriteriaDto)
  eventCriteria?: UpdateEventCriteriaDto;
}
export class EventSingleResponseDto {
  @ApiProperty({ type: EventDto }) event!: EventDto;
}
export class EventListResponseDto {
  @ApiProperty({ type: [EventDto] }) events!: EventDto[];
}
export class DeleteResponseDto extends PickType(EventDto, [
  'eventName',
  'activityCode',
] as const) {
  @ApiProperty() success!: boolean;
}
export class EventFiltersDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() moduleId?: string;
}
