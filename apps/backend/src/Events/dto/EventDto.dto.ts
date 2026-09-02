import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
import { StatsFiltersDto, StatsResponseDto } from 'src/stats.dto';

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

export class EventCriteriaDtoV2 extends PartialType(
  PickType(EventCriteriaDto, [
    'date',
    'dayOfWeek',
    'startTime',
    'endTime',
    'moduleId',
  ]),
) {
  @ApiProperty({
    default: false,
    description: `moduleId required in V2 - whomp whomp`,
    nullable: false,
  })
  @IsUUID()
  moduleId!: string;
}

export class UpdateEventCriteriaDto extends PartialType(EventCriteriaDto) {}

export class VenueDto {
  @ApiProperty() @IsUUID() venueId!: string;
  @ApiProperty() @IsString() venueName!: string;
}

export class EventDto {
  @ApiProperty()
  @IsUUID()
  eventId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 32)
  eventName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 10)
  activityCode?: string | null;

  @ApiPropertyOptional({ enum: ActivityTypeSchema.options })
  @IsOptional()
  @IsEnum(ActivityTypeSchema.options)
  activityType?: (typeof ActivityTypeSchema.options)[number];

  @ApiProperty({ type: EventCriteriaDto })
  @ValidateNested()
  @Type(() => EventCriteriaDto)
  eventCriteria!: EventCriteriaDto;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  validated?: boolean;

  @ApiPropertyOptional({ type: [VenueDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VenueDto)
  venues?: VenueDto[];
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

export class CreateEventDtoV2 extends PickType(EventDto, [
  'eventName',
  'activityCode',
  'activityType',
  'venues',
  'isRecurring',
  'validated',
]) {
  @ApiProperty({ type: EventCriteriaDtoV2 })
  @ValidateNested()
  @Type(() => EventCriteriaDtoV2)
  eventCriteria!: EventCriteriaDtoV2;

  @ApiProperty({
    description: 'Name of venue',
    example: 'Main Hall',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  venueName?: string;
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

  @IsString()
  message?: string;
}

export class EventListResponseDto {
  @ApiProperty({ type: [EventDto] }) events!: EventDto[];

  message?: string;
}

export class EventListResponseDtoV2 extends IntersectionType(
  EventListResponseDto,
  PickType(StatsResponseDto, ['count']),
) {}

export class DeleteResponseDto extends PickType(EventDto, [
  'eventName',
  'activityCode',
] as const) {
  @ApiProperty({ type: Boolean }) success!: boolean;
}

export class EventFiltersDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() moduleId?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID() timetableId?: string;

  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  all?: boolean;
}

export class EventFiltersDtoV2 extends IntersectionType(
  EventFiltersDto,
  PickType(StatsFiltersDto, ['Stats']),
) {}

export class ValidateEventDto extends PickType(EventDto, ['validated']) {}

export class ValidateEventResponseDto {
  @Type(() => EventDto)
  event!: EventDto;

  @IsString()
  message?: string;
} //END_ValidateEventResponseDto

//stats

//Events per day of week
export class EventStatsWeekDayDto {
  @ApiProperty()
  @ApiProperty({
    enum: DAY_OF_WEEK,
  })
  @IsEnum(DAY_OF_WEEK)
  dayOfWeek!: DayOfWeek;

  @ApiProperty()
  EventCount!: number;
}

export class EventStatsWeeklyResponseDto {
  @ApiProperty({ type: [EventStatsWeekDayDto] })
  data!: EventStatsWeekDayDto[];
}

//Events per venue
export class EventStatsVenueDto {
  @ApiProperty()
  VenueID!: string;

  @ApiProperty()
  VenueName!: string;

  @ApiProperty()
  EventCount!: number;
} //END_EventStatsVenueDto

export class EventStatsVenueResponseDto {
  @ApiProperty({ type: [EventStatsVenueDto] })
  data!: EventStatsVenueDto[];
}
