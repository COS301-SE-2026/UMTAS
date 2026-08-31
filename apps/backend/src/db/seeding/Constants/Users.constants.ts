import { randomUUID } from 'crypto';

//Users
export const UserIDs: string[] = [randomUUID(), randomUUID(), randomUUID()];
export const UserNames: string[] = [
  'Jannie Bloekom',
  'Sarrie Jammer Gat',
  'Piet Pierneef',
  'Cos Admin',
];
export const UserEmails: string[] = [
  'Jannie Bloekom@FlyAtUP.com',
  'Sarrie Jammer Gat@FlyAtUP.com',
  'Piet Pierneef@FlyAtUP.com',
  process.env.SEED_COS_ADMIN_EMAIL ?? 'Admin@UMTAS2024!',
];

export const UserPasswords: string[] = [
  '123Jannie Bloekom#123',
  '123Sarrie Jammer Gat#123',
  '123Piet Pierneef#123',
  process.env.SEED_COS_ADMIN_PASSWORD ?? 'Admin@UMTAS2024!',
];
