import { createHmac, randomUUID } from 'node:crypto';
import type { NfcTagEntity } from '../../entities';

export function createNfcTag(
  token: string,
  secret: string,
  overrides: Partial<NfcTagEntity> = {},
): NfcTagEntity {
  return {
    tagId: randomUUID(),
    ownerUserId: randomUUID(),
    universityId: randomUUID(),
    tokenHash: createHmac('sha256', secret).update(token).digest('hex'),
    registeredAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
