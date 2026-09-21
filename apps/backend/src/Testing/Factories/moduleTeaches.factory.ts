import {
  CreateTeachesDto,
  ModuleTeachesType,
} from 'src/ModuleTeaches/dto/teaches.dto';

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
