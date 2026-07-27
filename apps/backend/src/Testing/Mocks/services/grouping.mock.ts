import { GroupingService } from '../../../Grouping/grouping.service';

export function createMockGroupingService() {
  const mockGroupingService: Partial<jest.Mocked<GroupingService>> = {
    createModuleGrouping: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    updateGroup: jest.fn(),
    deleteGroup: jest.fn(),
    populateGroup: jest.fn(),
  };

  return {
    mockGroupingService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockGroupingService
