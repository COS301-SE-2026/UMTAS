import { randomUUID } from 'crypto';
import { modules } from 'src/entities';

type Module = typeof modules.$inferSelect;

//create a module
export function createModule(overrides: Partial<Module> = {}): Module {
  return {
    moduleID: randomUUID(),
    moduleCode: 'COS332',
    moduleName: 'Networks',
    moduleDescription: 'About Networks',
    validated: false,

    ...overrides,
  };
} //END_createModule
