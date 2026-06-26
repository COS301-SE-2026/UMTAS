import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length, IsBoolean, IsEnum, IsJSON } from 'class-validator';
import {PartialType, PickType, OmitType, IntersectionType} from '@nestjs/swagger';

export enum EventType {
  LECTURE = 'lecture',
  PERSONAL = 'personal'
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

  //uni owned
  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier for a module for when event created from module'
  })
  @IsUUID()
  @IsNotEmpty()
  moduleID!: string;

  //user owned
  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier for a user for when a personal event created for a user'
  })
  @IsUUID()
  @IsNotEmpty()
  UserID!: string;

  @ApiPropertyOptional({ example: 'IT 2-26' })
  @IsOptional()
  @IsString()
  venue?: string;
} //EventCriteriaDto

export class EventDto {

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier for an event'
  })
  @IsUUID()
  @IsNotEmpty()
  eventID!: string;

  @ApiPropertyOptional({
    example: 'event name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  eventName?: string;

  @ApiPropertyOptional({
    example: 'lec1',
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  eventCode?: string;

  @ApiProperty({ 
    type: EventCriteriaDto,
    description: 'Defines the additional information to attach to event entity'
  })
  @IsJSON()
  @IsOptional()
  eventCriteria!: EventCriteriaDto;

  @ApiPropertyOptional({ 
    example: true, 
    type: Boolean,
    default: false,
    description: 'Is the event recurring or not'
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}//EventDto

//Create Event
export class CreateEventDto extends PickType(EventDto, ['eventName', 'eventCode', 'eventCriteria', 'isRecurring']) {}

//Update Criteria
export class UpdateEventCriteriaDto  {}

//Update Event
export class UpdateEventDto extends PartialType(OmitType(EventDto, ['eventID'] as const)) {}

//Responses
//Single
export class EventSingleResponseDto extends EventDto {}

//List
export class EventListResponseDto {

  @ApiProperty({
      type: [EventDto],
      description: 'List of events'
  })
  modules!: EventDto[];
}

//Specialised Lecture Response
export class LectureResponseDto extends IntersectionType(PickType(EventDto, ['eventID']), PickType(EventCriteriaDto, ['moduleID', 'startTime', 'endTime', 'day'])){}

//Delete
export class DeleteResponseDto extends PickType(EventDto, ['eventCode', 'eventName']) {

  @ApiProperty({
    example: true,
    default: true
  })
  success!: boolean;
} //DeleteResponseDto
