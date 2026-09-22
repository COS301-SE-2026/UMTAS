import { createAttendancePreference } from '../Testing/Factories';
import { createDbChain, mockDbResult } from '../Testing/Mocks/database.helpers';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { DatabaseService } from '../db/database.service';
import { AttendancePreferenceService } from './attendance-preference.service';

/* eslint-disable @typescript-eslint/unbound-method */

describe('AttendancePreferenceService', () => {
  const { mockDb, reset } = createMockDatabase();
  const service = new AttendancePreferenceService({
    db: mockDb,
  } as unknown as DatabaseService);

  beforeEach(() => reset());

  it('returns the preference for an operator and university', async () => {
    const preference = createAttendancePreference();
    mockDbResult(mockDb.select as jest.Mock, [preference]);

    await expect(
      service.getPreference(preference.ownerUserId, preference.universityId),
    ).resolves.toEqual(preference);
  });

  it('upserts the preferred event', async () => {
    const preference = createAttendancePreference();
    (mockDb.insert as jest.Mock).mockReturnValue(createDbChain([preference]));

    await expect(
      service.setPreferredEvent(
        preference.ownerUserId,
        preference.universityId,
        preference.preferredEventId,
      ),
    ).resolves.toEqual(preference);
  });

  it('clears only the scoped operator preference', async () => {
    const preference = createAttendancePreference();
    (mockDb.delete as jest.Mock).mockReturnValue(createDbChain([]));

    await expect(
      service.clearPreference(preference.ownerUserId, preference.universityId),
    ).resolves.toBeUndefined();
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
  });
});
