import { ApiProperty } from '@nestjs/swagger';
import { PickType, OmitType, IntersectionType } from '@nestjs/swagger';

import {
  CreateModuleDto,
  ModuleSingleResponseDto,
  UpdateModuleDto,
} from 'src/Module/dto/module.dto';

export class CreateBuilderModuleDto extends OmitType(CreateModuleDto, [
  'CourseID',
  'ModuleGroupingID',
]) {}

//Update
export class UpdateBuilderDto extends UpdateModuleDto {}

//Responses
//Single
export class BuilderSingleResponseDto extends IntersectionType(
  ModuleSingleResponseDto,
  PickType(CreateBuilderModuleDto, ['styling'] as const),
) {}

//List
export class BuilderListResponseDto {
  @ApiProperty({
    type: [BuilderSingleResponseDto],
    description: 'List of Modules created by user with optional styling',
  })
  modules!: BuilderSingleResponseDto[];
}
