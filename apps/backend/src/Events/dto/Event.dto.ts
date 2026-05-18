import {
  ApiProperty,
  getSchemaPath,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export enum EventType {
  Lecture = 'lecture',
  Custom = 'custom',
}

export class CreateEventDto {
  @ApiProperty({
    example: 'COS301 Lecture',
    description: 'Display name of the event',
  })
  title!: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Module linked to the event',
  })
  moduleId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Module linked to the event',
  })
  userId?: string;

  @ApiProperty({
    example: 'lecture',
    description: 'Type of event created',
  })
  type!: EventType;

  @ApiPropertyOptional({
    example: '#3B82F6',
    description: 'Hex color used for displaying the event',
  })
  color?: string;
} //CreateEventDto

// @ApiProperty({
//   example: '2026-05-18T08:30:00.000Z',
//   description: 'ISO-8601 start datetime of the event',
// })
// start!: string;

// @ApiProperty({
//   example: '2026-05-18T10:20:00.000Z',
//   description: 'ISO-8601 end datetime of the event',
// })
// end!: string;
