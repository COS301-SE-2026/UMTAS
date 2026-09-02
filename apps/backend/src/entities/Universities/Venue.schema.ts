import {
  pgTable,
  uuid,
  varchar,
  primaryKey,
  uniqueIndex,
  AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { University } from './University.schema';
import { Event } from '../Events/index';
import { Building } from '../Map';
import { index } from 'drizzle-orm/pg-core';

export const Venue = pgTable(
  'Venue',
  {
    VenueID: uuid('VenueID').primaryKey().defaultRandom(),
    VenueName: varchar('VenueName', { length: 30 }),
    UniversityID: uuid('UniversityID')
      .references(() => University.UniversityID, { onDelete: 'cascade' })
      .notNull(),
    BuildingID: uuid('BuildingID').references(
      (): AnyPgColumn => Building.BuildingID,
      { onDelete: 'set null' },
    ),
  },
  (table) => ({
    universityVenueNameUnique: uniqueIndex('venue_university_name_unique').on(
      table.UniversityID,
      table.VenueName,
    ),
    venueBuildingIdIdx: index('venue_building_id_idx').on(table.BuildingID),
  }),
);

//Changing EventVenue to be linked to event instead of university, since this join table is for events to venues
//Moving the universityID to the venue table
export const EventVenue = pgTable(
  'EventVenue',
  {
    EventID: uuid('EventID')
      .references(() => Event.eventID, { onDelete: 'cascade' })
      .notNull(),
    VenueID: uuid('VenueID')
      .references(() => Venue.VenueID, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.EventID, table.VenueID] })],
);
