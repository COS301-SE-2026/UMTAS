import { BuildingService } from 'src/Building/building.service';

export function createMockBuildingService() {
  const mockBuildingService: Partial<jest.Mocked<BuildingService>> = {
    createBuilding: jest.fn(),
    getById: jest.fn(),
    getAllBuildings: jest.fn(),
    updateBuildingLocation: jest.fn(),

    //helpertjies
  };

  return {
    mockBuildingService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockBuildingService
