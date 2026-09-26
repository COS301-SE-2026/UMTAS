import { createHmac } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
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

  it('prepares a signed ticket and confirms the registered tag', async () => {
    const prepared = service.prepareRegistration(actor);
    expect(prepared.token).toHaveLength(43);
    expect(prepared.tagUrl).toContain(encodeURIComponent(prepared.token));
    const registeredAt = new Date();
    mockTransaction(mockDb, {
      insert: [
        [
          {
            tagId: prepared.tagId,
            ownerUserId: actor.userId,
            universityId: actor.uniId,
            tokenHash: createHmac('sha256', 'test-auth-secret')
              .update(prepared.token)
              .digest('hex'),
            registeredAt,
          },
        ],
      ],
    });
    await expect(
      service.confirmRegistration(actor, prepared.activationTicket),
    ).resolves.toEqual({
      tagId: prepared.tagId,
      displayId: `…${prepared.tagId.slice(-6).toUpperCase()}`,
      registeredAt,
    });
  });

  it('rejects tampered, expired, and other operator tickets', async () => {
    const prepared = service.prepareRegistration(actor);
    mockTransaction(mockDb, {});
    await expect(
      service.confirmRegistration(
        actor,
        `${prepared.activationTicket}tampered`,
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.confirmRegistration(
        { ...actor, userId: 'other' },
        prepared.activationTicket,
      ),
    ).rejects.toThrow(ForbiddenException);

    const [encoded] = prepared.activationTicket.split('.');
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
    payload.expiresAt = Date.now() - 1;
    const expiredPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = createHmac('sha256', 'test-auth-secret')
      .update(expiredPayload)
      .digest('base64url');
    await expect(
      service.confirmRegistration(actor, `${expiredPayload}.${signature}`),
    ).rejects.toThrow(BadRequestException);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('requires the signing secret to register a sticker', () => {
    delete process.env.BETTER_AUTH_SECRET;
    expect(() => service.prepareRegistration(actor)).toThrow(
      InternalServerErrorException,
    );
  });

  it('returns the registered tag without exposing its credential', async () => {
    mockDbResult(mockDb.select as jest.Mock, [
      {
        tagId,
        ownerUserId: actor.userId,
        universityId: actor.uniId,
        tokenHash: 'a'.repeat(64),
        registeredAt: new Date('2026-09-23T08:00:00Z'),
      },
    ]);
    const tag = await service.getRegisteredTag(actor);
    expect(tag).toEqual({
      tagId,
      displayId: '…69C8E1',
      registeredAt: new Date('2026-09-23T08:00:00Z'),
    });
  });
});
