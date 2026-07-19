import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { PartialType, PickType, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class StylingDto {
  @ApiProperty({ example: '#3B82F6' })
  @IsString()
  @IsNotEmpty()
  colour!: string;
}

//Base class
export class ModulesDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Unique identifier for a module',
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

  @ApiProperty({
    description: 'Styling to be used for a Module',
    example: {
      colour: 'FFFFF',
    },
    type: StylingDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => StylingDto)
  styling?: StylingDto | null;

  @ApiProperty({
    example: true,
    description: 'Whether the module has been approved by a university admin',
  })
  @IsOptional()
  @IsBoolean()
  validated?: boolean;
} //ModuleDto

//Create
export class CreateModuleDto extends PickType(ModulesDto, [
  'moduleCode',
  'moduleName',
  'moduleDescription',
  'styling',
  'validated',
]) {
  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'ModuleGroupingID to identify group the module belongs to',
  })
  @IsOptional()
  @IsUUID()
  @IsOptional()
  ModuleGroupingID?: string;

  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'CourseID module belongs to',
  })
  @IsOptional()
  @IsUUID()
  @IsOptional()
  CourseID?: string;
} //CreateModuleDto

//Update
export class UpdateModuleDto extends PartialType(
  OmitType(ModulesDto, ['moduleID'] as const),
) {} //update

//Responses
//Single
export class ModuleSingleResponseDto extends ModulesDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Unique identifier for a module group',
  })
  @IsUUID()
  @IsOptional()
  ModuleGroupingID?: string;
}

//List
export class ModuleListResponseDto {
  @ApiProperty({
    type: [ModuleSingleResponseDto],
    description: 'List of modules',
  })
  modules!: ModuleSingleResponseDto[];
}

//Delete
export class DeleteModuleResponseDto extends PickType(ModulesDto, [
  'moduleCode',
]) {
  @ApiProperty({ example: true })
  success!: boolean;
} //delete

//GetAll filters
export class ModuleFiltersDto {
  @ApiPropertyOptional({
    description:
      'Filter by university ID - returns all modules across all courses in the university',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsOptional()
  @IsUUID()
  universityId?: string;

  @ApiPropertyOptional({
    description: 'Filter by course ID - returns all modules in the course',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Filter by ModuleGrouping ID',
  })
  @IsOptional()
  @IsUUID()
  GroupID?: string;

  //Filter by code using wildcard
  @ApiPropertyOptional({
    example: 'COS',
    description: 'Filter by code, makes use of wildcard search',
  })
  @IsOptional()
  @IsString()
  moduleCode?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Choose to filter modules based of current user enrollments',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  userEnrollment?: boolean;
} //ModuleFiltersDto

export class ModuleStylingResponseDto {
  @ApiProperty({
    description: 'Describes the state of the success response',
    example: 'Suceess',
    type: String,
  })
  message!: string;
}

export class ModuleStylingBodyDto {
  @ApiProperty({
    description: 'Styling to be used for a Module',
    example: {
      colour: 'FFFFF',
    },
    type: StylingDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => StylingDto)
  styling!: StylingDto;
}

//Enroll response
export class EnrolResponseDto extends PickType(ModulesDto, ['moduleID']) {
  UserID!: string;

  @ApiProperty({
    example:
      'User successfully enrolled into module[00000000-0000-0000-0000-000000000000]',
    description: 'Message to describe success/failure of enrollment',
  })
  message!: string;
} //END_EnrolResponseDto
