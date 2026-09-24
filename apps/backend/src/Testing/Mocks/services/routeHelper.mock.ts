import { RouteHelperService } from 'src/Route/route.helper.service';

export function createMockRouteHelperService() {
  const mockRouteHelperService: Partial<jest.Mocked<RouteHelperService>> = {
    getStudentEventsForDate: jest.fn(),
    selectFirstVenuePerEvent: jest.fn(),
    compareEventContexts: jest.fn(),
    toEventContext: jest.fn(),
  };

  return {
    mockRouteHelperService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockRouteHelperService
