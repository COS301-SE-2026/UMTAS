import { randomUUID } from 'crypto';
import { University } from '../../entities';

type University = typeof University.$inferSelect;

export function createUniversity(
  overrides: Partial<University> = {},
): University {
  return {
    UniversityID: randomUUID(),
    UniversityName: 'University of Pretoria',
    ApiIdentifier: '',
    BaseApiUrl: '',
    ApiKey: '',

    ...overrides,
  };
} //END_createUniversity
