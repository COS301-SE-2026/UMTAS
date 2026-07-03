import { BuilderService } from '../../../Builder/builder.service';

export function createMockBuilderService() {
  const mockBuilderService: Partial<jest.Mocked<BuilderService>> = {
    createModule: jest.fn(),
    getAllModules: jest.fn(),
    getModuleById: jest.fn(),
    updateModule: jest.fn(),
    deleteModule: jest.fn(),

    //helpertjies
  };

  return {
    mockBuilderService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockBuilderService
