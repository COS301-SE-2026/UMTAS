import {ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length} from 'class-validator';
import {PartialType, PickType, OmitType} from '@nestjs/swagger';
import { isNotNull } from 'drizzle-orm';

export class CourseDto {

    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Unique identifier for a course',
        required: true
    })
    @IsUUID()
    @IsNotEmpty()
    courseID!: string;

    @ApiProperty({
        example: 'BSc Computer Science',
        description: 'Name of the course',
        required: true
    })
    @IsNotEmpty()
    @IsString()
    @Length(2, 30)
    courseName!: string;

    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Unique identifier for a university',
        required: true
    })
    @IsUUID()
    @IsNotEmpty()
    universityID!: string;
}

//create
export class CreateCourseDto extends PickType(CourseDto, ['courseName', 'universityID']){}

//update
export class UpdateCourseDto extends PartialType(OmitType(CourseDto, ['courseID'] as const)){}

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