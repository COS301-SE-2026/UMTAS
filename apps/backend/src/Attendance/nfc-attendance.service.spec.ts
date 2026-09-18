import { createHmac } from 'node:crypto';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { mockDbResult } from '../Testing/Mocks/database.helpers';
import { DatabaseService } from '../db/database.service';
import { NfcAttendanceService } from './nfc-attendance.service';

/* eslint-disable @typescript-eslint/unbound-method */

describe('NfcAttendanceService tag testing', () => {
  const actor = {
    userId: 'operator-1',
    uniId: 'university-1',
    uniRole: 'lecturer' as const,
  };
  const tagId = '47a1d222-c8e7-4439-96d2-f99fbf69c8e1';
  const token = 'abcdefghijklmnopqrstuvwxyzABCDEFGH';
  const originalSecret = process.env.BETTER_AUTH_SECRET;
  const { mockDb, reset } = createMockDatabase();
  const service = new NfcAttendanceService({
    db: mockDb,
  } as unknown as DatabaseService);

  beforeEach(() => {
    reset();
    jest.clearAllMocks();
    process.env.BETTER_AUTH_SECRET = 'test-auth-secret';
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = originalSecret;
  });

  it('validates the active operator tag without recording attendance', async () => {
    mockDbResult(mockDb.select as jest.Mock, [
      {
        tagId,
        ownerUserId: actor.userId,
        universityId: actor.uniId,
        tokenHash: createHmac('sha256', 'test-auth-secret')
          .update(token)
          .digest('hex'),
      },
    ]);

    await expect(
      service.testRegisteredTag(actor, { tagId, token }),
    ).resolves.toEqual({
      valid: true,
      message: 'Tag read successfully. No attendance was recorded.',
      displayId: '…69C8E1',
    });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('rejects a replaced, mistyped, or differently owned credential', async () => {
    mockDbResult(mockDb.select as jest.Mock, [
      {
        tagId,
        ownerUserId: 'another-operator',
        universityId: actor.uniId,
        tokenHash: createHmac('sha256', 'test-auth-secret')
          .update(token)
          .digest('hex'),
      },
    ]);

    await expect(
      service.testRegisteredTag(actor, { tagId, token }),
    ).resolves.toEqual({
      valid: false,
      message: 'This is not your currently registered NFC sticker.',
    });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});
