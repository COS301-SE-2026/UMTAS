import { BuildingService } from 'src/Building/building.service';

export function createMockBuildingService() {
  const mockBuildingService: Partial<jest.Mocked<BuildingService>> = {
    create: jest.fn(),
    getById: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  return {
    mockBuildingService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockBuildingService
