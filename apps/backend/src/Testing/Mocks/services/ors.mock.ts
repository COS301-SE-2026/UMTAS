import { OrsService } from 'src/Route/ors.service';

export function createMockOrsService() {
  const mockOrsService: Partial<jest.Mocked<OrsService>> = {
    getWalkingRoute: jest.fn(),
    getWalkingRouteVariants: jest.fn(),
  };

  return {
    mockOrsService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockOrsService
