import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
    type: [Number],
    example: [1, 2, 3],
    description: 'Event IDs to attach on creation',
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @ArrayUnique()
  eventIds?: string[];
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
    type: [Number],
    example: [4, 5],
    description: 'Event IDs to link to the timetable',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayUnique()
  addEventIds?: string[];

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2],
    description: 'Event IDs to unlink from the timetable',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayUnique()
  removeEventIds?: string[];
} //UpdateTimetableDto

export class TimetableDto {
  @ApiProperty({ example: "someId" })
  timetableID!: string;

  @ApiPropertyOptional({ example: 'Semester 1', nullable: true })
  timetableName?: string | null;
} //TimetableDto

export class UserTimetableDto {
  @ApiProperty({ example: "someId" })
  timetableID!: string;

  @ApiProperty({
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  UserTimetableID!: string;
} //TimetableDto

export class TimetableResponseDto {
  @ApiProperty({ type: String })
  UserTimetableID!: string;

  @ApiProperty({ type: TimetableDto })
  timetable!: TimetableDto;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2, 3],
    description: 'IDs of events linked to this timetable',
  })
  eventIds?: string[];
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
