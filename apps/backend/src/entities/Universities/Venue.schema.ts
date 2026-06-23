import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const Venue = pgTable('Venue', {
  VenueID: serial('VenueID').primaryKey(),
  VenueName: varchar('VenueName', { length: 30 }),
});
