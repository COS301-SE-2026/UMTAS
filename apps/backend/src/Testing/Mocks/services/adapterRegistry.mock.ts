import { AdapterRegistry } from 'src/ApiService/Registry/AdapterRegistry.service';

export function createMockAdapterRegistryService() {
  const mockAdapterRegistryService: Partial<jest.Mocked<AdapterRegistry>> = {
    getAdapter: jest.fn(),
    register: jest.fn(),
  };

  return {
    mockAdapterRegistryService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockAdapterRegistryService
