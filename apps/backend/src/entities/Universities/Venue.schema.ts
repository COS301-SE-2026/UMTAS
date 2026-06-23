import { pgTable, uuid, varchar, primaryKey } from 'drizzle-orm/pg-core';
import { University } from './University.schema';

export const Venue = pgTable('Venue', {
  VenueID: uuid('VenueID').primaryKey(),
  VenueName: varchar('VenueName', { length: 30 }),
});

export const EventVenue = pgTable(
  'EventVenue',
  {
    VenueID: uuid('VenueID')
      .references(() => Venue.VenueID, { onDelete: 'cascade' })
      .notNull(),
    UniversityID: uuid('UniversityID')
      .references(() => University.UniversityID, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.UniversityID, table.VenueID] })],
);
