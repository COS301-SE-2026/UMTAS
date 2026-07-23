import { randomUUID } from 'crypto';

//Users
export const UserIDs: string[] = [randomUUID(), randomUUID(), randomUUID()];
export const UserNames: string[] = [
  'Jannie Bloekom',
  'Sarrie Jammer Gat',
  'Piet Pierneef',
];
export const UserEmails: string[] = UserNames.map(
  (name) => `${name}@FlyAtUP.com`,
);
export const UserPasswords: string[] = UserNames.map(
  (name) => `123${name}#123`,
);
