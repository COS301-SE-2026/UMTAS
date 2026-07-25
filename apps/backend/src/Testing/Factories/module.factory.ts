import { randomUUID } from 'crypto';
import { modules } from '../../entities';
import { CreateModuleDto } from '../../Module/dto/module.dto';

type Module = typeof modules.$inferSelect;

const MODULE_CODE: string = 'COS332';
const MODULE_NAME: string = 'Networks';
const MODULE_DESCRIPTION: string = 'It is about networks, duh';
const STYLING: { colour: string } = { colour: `#TEST` };

//create a module
export function createModule(overrides: Partial<Module> = {}): Module {
  return {
    moduleID: randomUUID(),
    moduleCode: MODULE_CODE,
    moduleName: MODULE_NAME,
    moduleDescription: MODULE_DESCRIPTION,
    validated: false,

    ...overrides,
  };
} //END_createModule

export function createModuleDto(
  overrides: Partial<CreateModuleDto> = {},
): CreateModuleDto {
  return {
    moduleCode: MODULE_CODE,
    moduleName: MODULE_NAME,
    moduleDescription: MODULE_DESCRIPTION,
    styling: STYLING,
    validated: true,

    ...overrides,
  };
} //END_createModuleDto
