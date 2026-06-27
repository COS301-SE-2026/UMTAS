import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import {PartialType, PickType, OmitType} from '@nestjs/swagger';

//Base class
export class ModulesDto {

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier for a module'
  })
  @IsUUID()
  @IsNotEmpty()
  moduleID!: string;

  @ApiProperty({
    example: 'COS332',
    description: 'Module code used by the university',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  moduleCode!: string;

  @ApiProperty({
    example: 'Computer Networks',
    description: 'Name of the module',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  moduleName!: string;

  @ApiPropertyOptional({
    example: 'Introduction to computer networking concepts',
    description: 'Short module description',
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  moduleDescription?: string | null;
}//ModuleDto

//Create
export class CreateModuleDto extends PickType(ModulesDto, ['moduleCode', 'moduleName', 'moduleDescription']) {

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'CourseID to ensure module belongs to a course'
  })
  @IsUUID()
  @IsNotEmpty()
  courseID!: string;
}//CreateModuleDto

//Update
export class UpdateModuleDto extends PartialType(OmitType(ModulesDto, ['moduleID'] as const)) {


} //update

//Responses
//Single
export class ModuleSingleResponseDto extends ModulesDto {}

//List
export class ModuleListResponseDto {

    @ApiProperty({
        type: [ModuleSingleResponseDto],
        description: 'List of modules'
    })
    modules!: ModuleSingleResponseDto[];
}

//Delete
export class DeleteModuleResponseDto extends PickType(ModulesDto, ['moduleCode']) {

  @ApiProperty({ example: true })
  success!: boolean;
} //delete

//GetAll filters
export class ModuleFiltersDto {

  @ApiPropertyOptional({
    description: 'Filter by user ID - returns modules the user is enrolled in',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by course ID - returns all modules in the course',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Filter by university ID - returns all modules across all courses in the university',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsOptional()
  @IsUUID()
  universityId?: string;
}//ModuleFiltersDto
