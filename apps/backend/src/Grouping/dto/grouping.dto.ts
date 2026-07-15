import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsUUID,
  Length,
} from 'class-validator';
import { PickType } from '@nestjs/swagger';

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ModuleGroupingDto {
  @IsUUID()
  GroupID!: string;

  @Length(1, 64)
  Hash!: string | null;
} //END_ModuleGroupingDto

export class GroupModules {
  @IsUUID()
  GroupModuleID!: string;

  @IsUUID()
  GroupID!: string;

  @IsUUID()
  ModuleID!: string;
} //END_GroupModules

export class CourseModule {
  @IsUUID()
  CourseModuleID!: string;

  @IsUUID()
  CourseID!: string;

  @IsUUID()
  GroupModuleID!: string;

  Core!: boolean;

  @Length(1, 30)
  SemesterOfStudy?: string;

  YearOfStudy?: number;
} //END_CourseModule

///If you create a group, nothing is required
//If you create a group that should belong to a group, provide the Course fields to call createCourse
export class CreateModuleGroupingDto {
  @IsUUID()
  CourseID?: string;

  //modules to populate group with
  modules?: string[];
}

//Responses
//Single group response
export class GroupingSingleResponse extends PickType(ModuleGroupingDto, [
  'GroupID',
  'Hash',
]) {
  //Array of modules group was populated with
  modules?: string[];
}

//List Response
export class GroupingListResponseDto {
  groups!: GroupingSingleResponse[];
}

//Delete response
export class DeleteResponseDto extends PickType(ModuleGroupingDto, [
  'GroupID',
]) {
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
