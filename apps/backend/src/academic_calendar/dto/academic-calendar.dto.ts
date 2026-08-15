import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

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

export class AcademicCalendarDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: CALENDAR_ID_EXAMPLE,
    description: 'Unique academic-calendar identifier.',
  })
  id!: string;

  @ApiProperty({
    type: Number,
    example: 2026,
    minimum: 1000,
    maximum: 9999,
    description: 'Four-digit academic year represented by this calendar.',
  })
  year!: number;
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
