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
