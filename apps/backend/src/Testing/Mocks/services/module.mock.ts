import { ModuleServiceV2 } from 'src/Module/moduleV2.service';
import { ModuleService } from '../../../Module/module.service';

export function createMockModuleService() {
  const mockModuleService: Partial<jest.Mocked<ModuleService>> = {
    create: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),

    //helpertjies
    setStyling: jest.fn(),
    getStyling: jest.fn(),
    getUniForModule: jest.fn(),
    moduleOwnershipCheck: jest.fn(),
    updateStylingService: jest.fn(),
  };

  return {
    mockModuleService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockModuleService

//V2
export function createMockModuleServiceV2() {
  const mockModuleServiceV2: Partial<jest.Mocked<ModuleServiceV2>> = {
    ...createMockModuleService().mockModuleService,
    create: jest.fn(),
    getAll: jest.fn(),
    getByIdV2: jest.fn(),
    enrollToModuleV2: jest.fn(),
    getByExternalID: jest.fn(),
  };

  return {
    mockModuleServiceV2,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockModuleService
