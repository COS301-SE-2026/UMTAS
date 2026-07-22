//Mocks the actual database used by the API
//Basically replaces DatabaseService
import { DeepMockProxy, mockClear, mockDeep } from 'jest-mock-extended';
import { AppDatabase } from '../../db/database.service';

export function createMockDatabase(): {
  mockDb: DeepMockProxy<AppDatabase>;
  reset: () => void;
} {
  const mockDb = mockDeep<AppDatabase>();

  return {
    mockDb,
    reset: () => mockClear(mockDb),
  };
} //END_createMockDatabase
