import { randomUUID } from 'crypto';
import { AppUser } from '../../entities/index';

export function createUser(overrides: Partial<AppUser> = {}): AppUser {
  const now = new Date();

  return {
    id: randomUUID(),
    name: 'TestUser Name',
    email: 'testuser@some.com',
    emailVerified: true,
    image: null,
    role: 'user',
    banned: false,
    banReason: null,
    banExpires: null,
    createdAt: now,
    updatedAt: now,

    ...overrides,
  };
} //END_createUser
