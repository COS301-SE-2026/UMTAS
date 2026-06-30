import {ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length} from 'class-validator';
import {PartialType, PickType, OmitType} from '@nestjs/swagger';
import { isNotNull } from 'drizzle-orm';

export class CourseDto {

    @ApiProperty({
        example: '00000000-0000-0000-0000-000000000000',
        description: 'Unique identifier for a course',
        required: true
    })
    @IsUUID()
    @IsNotEmpty()
    CourseID!: string;

    @ApiProperty({
        example: 'BSc Computer Science',
        description: 'Name of the course',
        required: true
    })
    @IsNotEmpty()
    @IsString()
    @Length(2, 30)
    CourseName!: string;

    @ApiProperty({
        example: '00000000-0000-0000-0000-000000000000',
        description: 'Unique identifier for a university',
        required: true
    })
    @IsUUID()
    @IsNotEmpty()
    UniversityID!: string;
}

//create
export class CreateCourseDto extends PickType(CourseDto, ['CourseName', 'UniversityID']){}

//update
export class UpdateCourseDto extends PartialType(OmitType(CourseDto, ['CourseID'] as const)){}

//response
//Single
export class CourseSingleResponseDto extends CourseDto {}

//List
export class CourseListResponseDto {

    @ApiProperty({
        type: [CourseDto],
        description: 'List of courses'
    })
    courses!: CourseDto[];
}

//Delete
export class DeleteCourseResponseDto extends PickType(CourseDto, ['CourseName']) {

  @ApiProperty({ example: true })
  success!: boolean;
}