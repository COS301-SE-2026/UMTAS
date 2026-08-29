import { ModuleServiceV2 } from 'src/Module/moduleV2.service';

export function createMockModuleServiceV2() {
  const mockModuleServiceV2: Partial<jest.Mocked<ModuleServiceV2>> = {
    create: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),

    getByIdV2: jest.fn(),

    //helpertjies
    setStyling: jest.fn(),
    getStyling: jest.fn(),
    getUniForModule: jest.fn(),
    moduleOwnershipCheck: jest.fn(),
    updateStylingService: jest.fn(),
  };

  return {
    mockModuleServiceV2,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockModuleService
