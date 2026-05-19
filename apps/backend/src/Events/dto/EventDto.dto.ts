import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class CreateEventDto {
  @ApiPropertyOptional({
    example: {
      day: 'Monday',
      startTime: '08:30',
      endTime: '10:20',
      type: 'lecture',
      moduleCode: 'COS301',
    },
    description:
      'Flexible JSON criteria used to describe or classify the event',
  })
  @IsOptional()
  @IsObject()
  eventCriteria?: Record<string, unknown>;
} //CreateEventDto

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
        type: 'lecture',
      },
    },
  })
  event!: unknown;
} //event response

export class EventListResponse {
  @ApiProperty({
    type: [Object],
    description: 'List of events',
  })
  events!: unknown[];
} //event list

export class DeleteResponseDto {
  @ApiProperty({
    example: true,
    default: true,
  })
  success!: boolean;
} //delete response
