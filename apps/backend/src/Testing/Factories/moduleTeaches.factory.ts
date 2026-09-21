import {
  CreateTeachesDto,
  ModuleTeachesType,
  TeachesResponseDto,
} from 'src/ModuleTeaches/dto/teaches.dto';
import { createModuleSingleResponseDto } from './module.factory';

export function createModuleTeaches(
  overrides: Partial<ModuleTeachesType> = {},
): ModuleTeachesType {
  return {
    ModuleID: 'module-1',
    UserID: 'user-1',
    ...overrides,
  };
} //END_createModuleTeaches

export function createCreateTeachesDto(
  overrides: Partial<CreateTeachesDto> = {},
): CreateTeachesDto {
  return {
    ModuleID: 'module-1',
    UserID: 'user-1',
    ...overrides,
  };
} //END_createCreateTeachesDto

export function createTeachesResponseDto(
  overrides: Partial<TeachesResponseDto> = {},
): TeachesResponseDto {
  return {
    ModuleID: 'module-1',
    UserID: 'user-1',
    module: createModuleSingleResponseDto(),
    ...overrides,
  };
}
