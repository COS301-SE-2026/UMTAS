import { ApiProperty } from '@nestjs/swagger';

export class EnrollStudentToCourseResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the enrolled student',
    example: '00000000-0000-0000-0000-000000000000',
    format: 'uuid',
  })
  UserID!: string;

  @ApiProperty({
    description: 'Unique identifier of the course the student enrolled in',
    example: '00000000-0000-0000-0000-000000000000',
    format: 'uuid',
  })
  CourseID!: string;

  @ApiProperty({
    description:
      'Timestamp when the student enrolled in the course (UTC, ISO 8601)',
    example: '2026-09-11T14:32:07.000Z',
    type: 'string',
    format: 'date-time',
  })
  EnrolledAt!: Date;
} //END_EnrollStudentToCourseResponseDto
