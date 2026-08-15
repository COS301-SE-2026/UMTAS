import { randomUUID } from 'crypto';
import { modules, ModuleStyling } from '../../entities';
import { CourseModuleDto, CreateModuleDto } from '../../Module/dto/module.dto';

type Module = typeof modules.$inferSelect;

const MODULE_CODE: string = 'COS332';
const MODULE_NAME: string = 'Networks';
const MODULE_DESCRIPTION: string = 'It is about networks, duh';
const STYLING: { colour: string } = { colour: '#3366CC' };

//create a module
export function createModule(overrides: Partial<Module> = {}): Module {
  return {
    moduleID: randomUUID(),
    moduleCode: MODULE_CODE,
    moduleName: MODULE_NAME,
    moduleDescription: MODULE_DESCRIPTION,
    validated: false,
    ExternalID: null,

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

export function createCourseModule(
  overrides: Partial<CourseModuleDto> = {},
): CourseModuleDto {
  return {
    CourseModuleID: randomUUID(),
    GroupModuleID: randomUUID(),
    CourseID: randomUUID(),
    Core: false,

    ...overrides,
  };
} //END_createCourseModule

export function createModuleStyling(
  overrides: Partial<typeof ModuleStyling.$inferSelect> = {},
): typeof ModuleStyling.$inferSelect {
  return {
    ModuleID: randomUUID(),
    UserID: randomUUID(),
    styling: { colour: '#FFFFFF' },

    ...overrides,
  };
} //END_createModuleStyling
