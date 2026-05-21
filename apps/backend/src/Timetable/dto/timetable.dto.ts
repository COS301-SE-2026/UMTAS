import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  IsInt,
  ArrayUnique,
  Length,
} from 'class-validator';

export class CreateTimetableDto {
  @ApiPropertyOptional({
    example: 'Semester 1',
    description: 'Display name for the timetable',
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  timetableName?: string;

  @ApiPropertyOptional({
    example: [1, 2, 3],
    description: 'Event IDs to attach on creation',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayUnique()
  eventIds?: number[];
} //CreateTimetableDto

export class UpdateTimetableDto {
  @ApiPropertyOptional({
    example: 'Semester 2',
    description: 'Updated display name for the timetable',
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  timetableName?: string;

  @ApiPropertyOptional({
    example: [4, 5],
    description: 'Event IDs to link to the timetable',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayUnique()
  addEventIds?: number[];

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'Event IDs to unlink from the timetable',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayUnique()
  removeEventIds?: number[];
} //UpdateTimetableDto

export class TimetableDto {
  @ApiProperty({ example: 1 })
  timetableID!: number;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  userID!: string;

  @ApiPropertyOptional({ example: 'Semester 1', nullable: true })
  timetableName?: string | null;
} //TimetableDto

export class TimetableResponseDto {
  @ApiProperty({ type: TimetableDto })
  timetable!: TimetableDto;

  @ApiPropertyOptional({
    example: [1, 2, 3],
    description: 'IDs of events linked to this timetable',
  })
  eventIds?: number[];
} //TimetableResponseDto

export class TimetableListResponseDto {
  @ApiProperty({
    type: [TimetableResponseDto],
    description: 'List of timetables with their linked event IDs',
  })
  timetables!: TimetableResponseDto[];
} //TimetableListResponseDto

export class DeleteTimetableResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
} //DeleteTimetableResponseDto
