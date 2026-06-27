import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateNested, IsNotEmpty, IsOptional, IsString, IsUUID, Length, IsBoolean, IsEnum, IsJSON, isUUID } from 'class-validator';
import {PartialType, PickType, OmitType, IntersectionType} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import { EventType } from './event.types';


//Event Criteria
export class EventCriteriaDto {
  @ApiPropertyOptional({
    enum: EventType
  })
  @IsNotEmpty()
  @IsEnum(EventType)
  type!: EventType;

  @ApiProperty({ example: 'yyyy-mm-dd' })
  @IsString()
  date!: string;

  @ApiProperty({ example: '08:30' })
  @IsString()
  startTime!: string;

  @ApiProperty({ example: '10:20' })
  @IsString()
  endTime!: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsUUID()
  moduleID?:string
  
} //EventCriteriaDto

//update criteria
export class UpdateEventCriteriaDto {
  @ApiPropertyOptional({
    enum: EventType,
    example: EventType.UNIVERSITY
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({ example: 'yyyy-mm-dd' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: '08:30' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '10:20' })
  @IsOptional()
  @IsString()
  endTime?: string;
}

export class EventDto {

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier for an event'
  })
  @IsUUID()
  eventID!: string;

  @ApiProperty({ 
    type: EventCriteriaDto,
    description: 'Defines the additional information to attach to event entity'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventCriteriaDto)
  eventCriteria!: EventCriteriaDto;

  @ApiPropertyOptional({
    example: 'event name',
    required: true,
    description: 'Descriptive name for the event'
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
  eventCode?: string | null;

  @ApiPropertyOptional({ 
    example: true, 
    type: Boolean,
    default: true,
    description: 'Is the event recurring or not'
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}//EventDto

//Create Event
export class CreateEventDto extends PickType(EventDto, ['eventName', 'eventCode', 'eventCriteria', 'isRecurring'] as const) {}

  // //Personal
  // export class CreatePersonalEventDto extends CreateEventDto {}

  // //University owned
  // export class CreateUniversityEventDto extends CreateEventDto {

  //   @ApiProperty({
  //     description: 'Module to which the event belongs'
  //   })
  //   @IsUUID()
  //   moduleID!: string;

  //   //venue
  // }//CreateUniversityEventDto


//Update Event
export class UpdateEventDto extends PartialType(OmitType(EventDto, ['eventID', 'eventCriteria'] as const)) {

  @ApiPropertyOptional({
    type: UpdateEventCriteriaDto,
    description: 'Partial event criteria for update'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEventCriteriaDto)
  eventCriteria?: UpdateEventCriteriaDto;
}

//Responses
  //Single
  export class EventSingleResponseDto {

    @ApiProperty({
      type: EventDto,
    })
    event!: EventDto;
  }//EventSingleResponse

  //List
  export class EventListResponseDto {

    @ApiProperty({
        type: [EventDto],
        description: 'List of events'
    })
    events!: EventDto[];
  }

//Delete
export class DeleteResponseDto extends PickType(EventDto, ['eventName', 'eventCode']) {

  @ApiProperty({
    example: true,
    default: true
  })
  success!: boolean;
} //DeleteResponseDto

//GetAll filters
export class EventFiltersDto {

  @ApiPropertyOptional({
    description: 'Filter by user ID - return all personal events',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by module ID - returns all events for module',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsOptional()
  @IsUUID()
  moduleId?: string;
}//ModuleFiltersDto
