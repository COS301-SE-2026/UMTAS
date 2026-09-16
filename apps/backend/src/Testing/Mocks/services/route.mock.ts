import { RouteService } from 'src/Route/route.service';

export function createMockRouteService() {
  const mockRouteService: Partial<jest.Mocked<RouteService>> = {
    getRouteVariant: jest.fn(),
    getOrCreateRoute: jest.fn(),
    getActiveRoute: jest.fn(),
  };

  return {
    mockRouteService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockRouteService
