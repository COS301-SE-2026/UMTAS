import { randomUUID } from 'crypto';

//Users
export const UserIDs: string[] = [randomUUID(), randomUUID(), randomUUID()];
export const UserNames: string[] = [
  'Jannie Bloekom',
  'Sarrie Jammer Gat',
  'Piet Pierneef',
];
export const UserEmails: string[] = [
  'JannieBloekom@FlyAtUP.com',
  'SarrieJammerGat@FlyAtUP.com',
  'PietPierneef@FlyAtUP.com',
];

export const UserPasswords: string[] = [
  'JannieBloekom#123',
  'SarrieJammerGat#123',
  'PietPierneef#123',
];

export const DEFAULT_COS_ADMIN_EMAIL = 'admin301@local.umtas';
export const DEFAULT_SYSTEM_ADMIN_EMAIL = 'system-admin@local.umtas';

export const getCosAdminEmail = (): string =>
  process.env.SEED_COS_ADMIN_EMAIL?.toLowerCase() ?? DEFAULT_COS_ADMIN_EMAIL;

export const getSystemAdminEmail = (): string =>
  process.env.SEED_SYSTEM_ADMIN_EMAIL ?? DEFAULT_SYSTEM_ADMIN_EMAIL;
