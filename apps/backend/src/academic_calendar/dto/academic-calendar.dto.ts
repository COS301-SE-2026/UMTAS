import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

const UNIVERSITY_ID_EXAMPLE = '86f10d5e-f846-4bbc-85fb-67ea008f0f18';
const CALENDAR_ID_EXAMPLE = '120afed7-9444-4d9c-a7f2-8f08dc2b7d70';

export class CreateAcademicCalendarDto {
  @ApiProperty({
    type: Number,
    example: 2026,
    minimum: 1000,
    maximum: 9999,
    description:
      'Four-digit academic year. A university may have only one calendar per year.',
  })
  @IsInt()
  @Min(1000)
  @Max(9999)
  year!: number;
}

/** PUT replaces the calendar's mutable year; university ownership is session-bound. */
export class UpdateAcademicCalendarDto extends CreateAcademicCalendarDto {}

export class AcademicCalendarDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: CALENDAR_ID_EXAMPLE,
    description: 'Unique academic-calendar identifier.',
  })
  id!: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    example: UNIVERSITY_ID_EXAMPLE,
    description: 'University that owns the academic calendar.',
  })
  universityId!: string;

  @ApiProperty({
    type: Number,
    example: 2026,
    minimum: 1000,
    maximum: 9999,
    description: 'Four-digit academic year represented by this calendar.',
  })
  year!: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-08-11T10:30:00.000Z',
    description: 'ISO 8601 timestamp at which the calendar was created.',
  })
  createdAt!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-08-11T10:30:00.000Z',
    description: 'ISO 8601 timestamp of the most recent calendar update.',
  })
  updatedAt!: string;
}

export class DeleteAcademicCalendarResponseDto {
  @ApiProperty({
    type: Boolean,
    enum: [true],
    example: true,
    description: 'Confirms that the academic calendar was deleted.',
  })
  success!: true;
}
