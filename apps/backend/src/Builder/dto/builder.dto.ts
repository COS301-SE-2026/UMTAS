import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PickType, OmitType, IntersectionType } from '@nestjs/swagger';

import {
  CreateModuleDto,
  ModuleSingleResponseDto,
  UpdateModuleDto,
} from '../../Module/dto/module.dto';
import { CreateEventDto } from 'src/Events/dto/EventDto.dto';

export class CreateBuilderModuleDto extends OmitType(CreateModuleDto, [
  'CourseID',
  'ModuleGroupingID',
  'CourseModuleInfo',
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

//BuilderEvent
export class CreateBuilderEventDto extends PartialType(
  PickType(CreateEventDto, [
    'eventName',
    'activityType',
    'activityCode',
    'isRecurring',
    'eventCriteria',
  ]),
) {}
