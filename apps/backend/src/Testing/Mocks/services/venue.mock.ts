import { VenueService } from 'src/Venue/venue.service';

export function createMockVenueService() {
  const mockVenueService: Partial<jest.Mocked<VenueService>> = {
    create: jest.fn(),
    getById: jest.fn(),
    getAllVenues: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),

    //helpertjies
  };

  return {
    mockVenueService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockBuildingService
