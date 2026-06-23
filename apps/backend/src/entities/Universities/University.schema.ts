import { pgTable, varchar, uuid } from 'drizzle-orm/pg-core';
export const University = pgTable('University', {
  UniversityID: uuid('UniversityID').defaultRandom().primaryKey(),
  UniversityName: varchar('VenueName', { length: 30 }),
});
