import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Length } from 'class-validator';

export enum EventType {
  LECTURE = 'lecture',
} //event type

export class EventCriteriaDto {
  @ApiPropertyOptional({
    enum: EventType,
    example: EventType.LECTURE,
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType | null;

  @ApiProperty({ example: 'Monday' })
  @IsString()
  day!: string;

  @ApiProperty({ example: '08:30' })
  @IsString()
  startTime!: string;

  @ApiProperty({ example: '10:20' })
  @IsString()
  endTime!: string;

  @ApiPropertyOptional({ example: 'COS301' })
  @IsOptional()
  @IsString()
  @Length(6, 10)
  moduleCode?: string;

  @ApiPropertyOptional({ example: 'IT 2-26' })
  @IsOptional()
  @IsString()
  venue?: string;
} //EventCriteriaDto

export class CreateEventDto {
  @ApiPropertyOptional({
    example: 'event name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  name?: string;

  @ApiPropertyOptional({
    example: 'lec1',
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  code?: string;

  @ApiProperty({
    type: EventCriteriaDto,
    description: 'Criteria for an event',
  })
  @ValidateNested()
  @Type(() => EventCriteriaDto)
  eventCriteria!: EventCriteriaDto;

  @ApiPropertyOptional({ example: false, default: false, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
} //CreateEventDto

export class EventDto {
  @ApiProperty({ example: 1 })
  eventID!: number;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  userID!: string;

  @ApiPropertyOptional({
    example: 'event name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  name?: string;

  @ApiPropertyOptional({
    example: 'lec1',
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  code?: string;

  @ApiProperty({ type: EventCriteriaDto })
  eventCriteria!: EventCriteriaDto;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
} //EventDto

export class LectureResponseDto {
  @ApiProperty({ example: 1 })
  lectureID!: number;

  @ApiProperty({ example: 12, nullable: true, type: Number })
  moduleID!: number | null;

  @ApiProperty({ example: 1, nullable: true, type: Number })
  eventID!: number | null;

  @ApiPropertyOptional({ example: 'IT 2-26', nullable: true })
  venue?: string | null;
} //LectureResponseDto

export class UpdateEventCriteriaDto {
  @ApiPropertyOptional({
    enum: EventType,
    example: EventType.LECTURE,
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({ example: 'Tuesday' })
  @IsOptional()
  @IsString()
  day?: string;

  @ApiPropertyOptional({ example: '10:30' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '12:20' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ example: 'COS301' })
  @IsOptional()
  @IsString()
  moduleCode?: string;

  @ApiPropertyOptional({ example: 'IT 2-26' })
  @IsOptional()
  @IsString()
  venue?: string;

  // @ApiPropertyOptional({ example: true })
  // @IsOptional()
  // @IsBoolean()
  // isRecurring?: boolean;
} //udpateEventCriteria

export class UpdateEventDto {
  @ApiPropertyOptional({
    example: 'event name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  name?: string;

  @ApiPropertyOptional({
    example: 'lec1',
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  code?: string;

  @ApiPropertyOptional({
    type: UpdateEventCriteriaDto,
    description: 'Event update criteria',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEventCriteriaDto)
  eventCriteria?: UpdateEventCriteriaDto;

  @ApiPropertyOptional({ example: false, default: false, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
} //Update event

export class EventResponseDto {
  @ApiProperty({
    example: {
      eventID: 1,
      userID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'eventnameidk',
      code: 'lec1',
      eventCriteria: {
        day: 'Monday',
        startTime: '08:30',
        endTime: '10:20',
      },
    },
  })
  event!: EventDto;

  @ApiPropertyOptional({ type: LectureResponseDto })
  lecture?: LectureResponseDto;
} //event response

export class EventListResponseDto {
  @ApiProperty({
    type: [EventResponseDto],
    description: 'List of events with optional lecture details',
  })
  events!: EventResponseDto[];
} //event list

export class DeleteResponseDto {
  @ApiProperty({
    example: true,
    default: true,
  })
  success!: boolean;
} //delete response
