import { randomUUID } from 'node:crypto';
import {
  CreateTeachesDto,
  ModuleTeachesType,
  TeachesResponseDto,
} from '../../ModuleTeaches/dto/teaches.dto';
import { createModuleSingleResponseDto } from './module.factory';

export function createModuleTeaches(
  overrides: Partial<ModuleTeachesType> = {},
): ModuleTeachesType {
  return {
    ModuleID: randomUUID(),
    UserID: randomUUID(),
    ...overrides,
  };
} //END_createModuleTeaches

export function createCreateTeachesDto(
  overrides: Partial<CreateTeachesDto> = {},
): CreateTeachesDto {
  return {
    ModuleID: randomUUID(),
    UserID: randomUUID(),
    ...overrides,
  };
} //END_createCreateTeachesDto

export function createTeachesResponseDto(
  overrides: Partial<TeachesResponseDto> = {},
): TeachesResponseDto {
  return {
    ModuleID: randomUUID(),
    UserID: randomUUID(),
    module: createModuleSingleResponseDto(),
    ...overrides,
  };
}
