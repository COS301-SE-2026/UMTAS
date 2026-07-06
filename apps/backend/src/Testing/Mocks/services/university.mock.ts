import { UniversityService } from '../../../University/university.service';

export function createMockUniversityService() {
  const mockUniversityService: Partial<jest.Mocked<UniversityService>> = {
    create: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),

    getUsersRole: jest.fn(),
    applyForUniRole: jest.fn(),
    approveUserRole: jest.fn(),

    //helpertjies
    getByName: jest.fn(),
    checkDuplicateUniversityName: jest.fn(),
  };

  return {
    mockUniversityService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockUniversityService
