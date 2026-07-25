import { randomUUID } from 'crypto';
import { ModuleGrouping } from '../../entities';

type Group = typeof ModuleGrouping.$inferSelect;

export function createGroup(overrides: Partial<Group> = {}): Group {
  return {
    GroupID: randomUUID(),
    Hash: null,

    ...overrides,
  };
} //END_createGroup
