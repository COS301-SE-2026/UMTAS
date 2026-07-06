//Mocks the actual database used by the API
//Basically replaces DatabaseService
import { mock } from 'jest-mock-extended';
import { DatabaseService } from '../../db/database.service';

export function createMockDatabase() {
  const mockDb = mock<DatabaseService['db']>();

  return {
    mockDb,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockDatabase
