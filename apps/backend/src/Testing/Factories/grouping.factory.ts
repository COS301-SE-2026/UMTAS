import { randomUUID } from 'crypto';
import { ModuleGrouping } from '../../entities';
import { CreateModuleGroupingDto } from '../../Grouping/dto/grouping.dto';

type Group = typeof ModuleGrouping.$inferSelect;

export function createGroup(overrides: Partial<Group> = {}): Group {
  return {
    GroupID: randomUUID(),
    Hash: null,

    ...overrides,
  };
} //END_createGroup

export function createGroupDto(
  overrides: Partial<CreateModuleGroupingDto> = {},
): CreateModuleGroupingDto {
  return {
    CourseID: randomUUID(),
    modules: [randomUUID(), randomUUID()],

    ...overrides,
  };
} //END_createGroupDto
