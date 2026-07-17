import { randomUUID } from 'crypto';
import {
  modules,
  CourseModule,
  ModuleEnrollment,
  ModuleStyling,
} from 'src/entities';
import { courseId } from '../constants.spec';
import { ModuleService } from '../../Module/module.service';

export const baseDto = {
  moduleCode: 'COS332',
  moduleName: 'Networks and stuff',
  moduleDescription: 'Networks for the dweebs',
  courseID: courseId,
};

export function createMockModuleService() {
  const mockModuleService: Partial<jest.Mocked<ModuleService>> = {
    getUniForModule: jest.fn(),
    moduleOwnershipCheck: jest.fn(),
  };

  return {
    mockModuleService,
    reset: () => {
      Object.values(mockModuleService).forEach((fn: any) => fn.mockReset());
    },
  };
} //END_createMockModuleService

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

type CourseModule = typeof CourseModule.$inferSelect;
//Create a course owned module - the join table
export function createCourseModule(
  overrides: Partial<CourseModule> = {},
): CourseModule {
  return {
    GroupModuleID: randomUUID(),
    CourseID: randomUUID(),
    CourseModuleID: randomUUID(),
    Core: true,
    YearOfStudy: 1,
    SemesterOfStudy: '1',

    ...overrides,
  };
} //END_CourseModule

type ModuleEnrollment = typeof ModuleEnrollment.$inferSelect;
//Enroll use to module
export function createModuleEnrollment(
  overrides: Partial<ModuleEnrollment> = {},
): ModuleEnrollment {
  return {
    ModuleID: randomUUID(),
    UserID: randomUUID(),

    ...overrides,
  };
} //END_createModuleEnrollment

type ModuleStyling = typeof ModuleStyling.$inferSelect;

export function createModuleStyling(
  overrides: Partial<ModuleStyling> = {},
): ModuleStyling {
  return {
    ModuleID: randomUUID(),
    UserID: randomUUID(),
    styling: { colour: '#FFFFFF' },

    ...overrides,
  };
} //END_createModuleStyling
