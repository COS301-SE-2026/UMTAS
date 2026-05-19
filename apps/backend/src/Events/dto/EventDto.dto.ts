import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  type?: EventType;

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
  moduleCode?: string;

  @ApiPropertyOptional({ example: 'IT 2-26' })
  @IsOptional()
  @IsString()
  venue!: string;
} //EventCriteriaDto

export class CreateEventDto {
  @ApiProperty({
    type: EventCriteriaDto,
    description: 'Criteria for an event',
  })
  @ValidateNested()
  @Type(() => EventCriteriaDto)
  eventCriteria!: EventCriteriaDto;
} //CreateEventDto

export class EventDto {
  @ApiProperty({ example: 1 })
  eventID!: number;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  userID!: string;

  @ApiProperty({ type: EventCriteriaDto })
  eventCriteria!: EventCriteriaDto;
} //EventDto

export class LectureResponseDto {
  @ApiProperty({ example: 1 })
  lectureID!: number;

  @ApiProperty({ example: 12, nullable: true })
  moduleID!: number | null;

  @ApiProperty({ example: 1, nullable: true })
  eventID!: number | null;

  @ApiPropertyOptional({ example: 'IT 2-26', nullable: true })
  venue?: string | null;
} //LectureResponseDto

export class UpdateEventDto {
  @ApiPropertyOptional({
    example: {
      day: 'Tuesday',
      startTime: '10:30',
      endTime: '12:20',
      type: 'practical',
      moduleCode: 'COS301',
    },
    description: 'Updated flexible JSON criteria for the event',
  })
  @IsOptional()
  @IsObject()
  eventCriteria?: Record<string, unknown>;
} //Update event

export class EventResponseDto {
  @ApiProperty({
    example: {
      eventID: 1,
      userID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
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
