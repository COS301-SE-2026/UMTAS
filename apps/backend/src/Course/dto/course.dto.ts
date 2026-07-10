import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { PartialType, PickType, OmitType } from '@nestjs/swagger';

export class CourseDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Unique identifier for a course',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  CourseID!: string;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Unique identifier for a university',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  UniversityID!: string;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Unique identifier for a group of modules',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  GroupID?: string | null;

  @ApiProperty({
    example: 'Computer Science',
    description: 'Name of the course',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 30)
  CourseName!: string;

  @ApiProperty({
    example: 'Bachelor of Science',
    description: 'Degree that course belongs to',
    required: false,
  })
  @IsString()
  @Length(1, 30)
  Degree?: string | null;
}

//create
export class CreateCourseDto extends PickType(CourseDto, [
  'UniversityID',
  'GroupID',
  'CourseName',
  'Degree',
]) {}

//update
export class UpdateCourseDto extends PartialType(
  OmitType(CourseDto, ['CourseID'] as const),
) {}

//response
//Single
export class CourseSingleResponseDto extends CourseDto {}

//List
export class CourseListResponseDto {
  @ApiProperty({
    type: [CourseDto],
    description: 'List of courses',
  })
  courses!: CourseDto[];
}

//Delete
export class DeleteCourseResponseDto extends PickType(CourseDto, [
  'CourseName',
]) {
  @ApiProperty({ example: true })
  success!: boolean;
}

//getAll filters
export class CourseFilters extends PartialType(
  PickType(CourseDto, ['CourseName', 'UniversityID', 'Degree']),
) {}
