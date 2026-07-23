import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsUUID,
  Length,
  IsOptional,
} from 'class-validator';
import { PickType } from '@nestjs/swagger';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ModuleGroupingDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  GroupID!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Length(1, 64)
  Hash!: string | null;
} //END_ModuleGroupingDto

export class GroupModules {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  GroupModuleID!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  GroupID!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  ModuleID!: string;
} //END_GroupModules

export class CourseModule {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  CourseModuleID!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  CourseID!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  GroupModuleID!: string;

  @ApiProperty({ type: Boolean })
  Core!: boolean;

  @ApiPropertyOptional({ type: String })
  @Length(1, 30)
  SemesterOfStudy?: string;

  @ApiPropertyOptional({ type: Number })
  YearOfStudy?: number;
} //END_CourseModule

///If you create a group, nothing is required
//If you create a group that should belong to a group, provide the Course fields to call createCourse
export class CreateModuleGroupingDto {
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsUUID()
  CourseID?: string;

  //modules to populate group with
  @ApiProperty({
    description: 'module array to ad dto the group',
    type: [String],
    example: [
      '10000000-0000-0000-0000-000000000000',
      '20000000-0000-0000-0000-000000000000',
    ],
  })
  @IsArray({ message: 'modules needs to be an array of UUIDs' })
  @IsOptional()
  @IsUUID('4', { each: true, message: 'Each module ID should be a UUID' })
  @Type(() => String)
  modules?: string[];
}

//Responses
//Single group response
export class GroupingSingleResponse extends PickType(ModuleGroupingDto, [
  'GroupID',
  'Hash',
]) {
  @ApiPropertyOptional({ type: [String] })
  //Array of modules group was populated with
  modules?: string[];
}

//List Response
export class GroupingListResponseDto {
  @ApiProperty({ type: [GroupingSingleResponse] })
  groups!: GroupingSingleResponse[];
}

//Delete response
export class DeleteResponseDto extends PickType(ModuleGroupingDto, [
  'GroupID',
]) {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  success!: boolean;
} //END_DeleteResponseDto

//Populate Group body
export class PopulateGroupBodyDto {
  @ApiProperty({
    description: 'module array to ad dto the group',
    type: [String],
    example: [
      '10000000-0000-0000-0000-000000000000',
      '20000000-0000-0000-0000-000000000000',
    ],
  })
  @IsArray({ message: 'modules needs to be an array of UUIDs' })
  @ArrayNotEmpty({ message: 'modules array should not be empty meneer' })
  @IsUUID('4', { each: true, message: 'Each module ID should be a UUID' })
  @Type(() => String)
  modules!: string[];
}
