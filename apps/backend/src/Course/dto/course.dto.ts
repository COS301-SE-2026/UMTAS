import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { PartialType, PickType, OmitType } from '@nestjs/swagger';
import { ModulesDto } from 'src/Module/dto/module.dto';
import { Type } from 'class-transformer';

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

  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Unique identifier for a group of modules',
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

  @ApiPropertyOptional({
    example: 'Bachelor of Science',
    description: 'Degree that course belongs to',
  })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  Degree?: string | null;

  @ApiPropertyOptional({
    type: () => [ModulesDto],
    description: 'Modules for the course.',
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModulesDto)
  Modules?: ModulesDto[];
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

  message?: string;
}

//Delete
export class DeleteCourseResponseDto extends PickType(CourseDto, [
  'CourseName',
]) {
  @ApiProperty({ type: Boolean, example: true })
  success!: boolean;
}

//getAll filters
export class CourseFilters extends PartialType(
  PickType(CourseDto, ['CourseName', 'UniversityID', 'Degree']),
) {}
