import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  ArrayUnique,
  Length,
  IsUUID,
} from 'class-validator';
import { EventDto } from 'src/Events/dto/EventDto.dto';

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
    type: [String],
    example: ['00000000-0000-0000-0000-000000000000'],
    description: 'Event IDs to attach on creation',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
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
    type: [String],
    example: ['00000000-0000-0000-0000-000000000000'],
    description: 'Event IDs to link to the timetable',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayUnique()
  addEventIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['00000000-0000-0000-0000-000000000000'],
    description: 'Event IDs to unlink from the timetable',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayUnique()
  removeEventIds?: string[];
} //UpdateTimetableDto

export class TimetableDto {
  @ApiProperty({ example: 'someId' })
  timetableID!: string;

  @ApiPropertyOptional({ example: 'Semester 1', nullable: true })
  timetableName?: string | null;
} //TimetableDto

export class UserTimetableDto {
  @ApiProperty({ example: 'someId' })
  timetableID!: string;

  @ApiProperty({
    type: String,
    example: '00000000-0000-0000-0000-000000000000',
  })
  UserTimetableID!: string;
} //TimetableDto

export class TimetableResponseDto {
  @ApiProperty({ type: String })
  UserTimetableID!: string;

  @ApiProperty({ type: TimetableDto })
  timetable!: TimetableDto;

  @ApiPropertyOptional({
    type: [String],
    example: ['00000000-0000-0000-0000-000000000000'],
    description: 'IDs of events linked to this timetable',
  })
  eventIds?: string[];
} //TimetableResponseDto

export class TimetableResponseDto2 {
  @ApiProperty({ type: String })
  UserTimetableID!: string;

  @ApiProperty({ type: TimetableDto })
  timetable!: TimetableDto;

  @ApiProperty({ type: [EventDto] })
  events: EventDto[] = [];
}

export class TimetableListResponseDtoV2 {
  @ApiProperty({
    type: [TimetableResponseDto2],
    description: 'List of timetables with their linked event objects',
  })
  timetables!: TimetableResponseDto2[];
}

export class TimetableListResponseDto {
  @ApiProperty({
    type: [TimetableResponseDto],
    description: 'List of timetables with their linked event IDs',
  })
  timetables!: TimetableResponseDto[];
} //TimetableListResponseDto

export class DeleteTimetableResponseDto {
  @ApiProperty({ type: Boolean, example: true })
  success!: boolean;
} //DeleteTimetableResponseDto
