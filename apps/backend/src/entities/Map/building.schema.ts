import { usersTable } from '../auth';
import { University } from '../Universities';

import type { GeoJsonPolygon } from '../../Building/dto/building.dto';
import { pgTable } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { varchar } from 'drizzle-orm/pg-core';
import { doublePrecision } from 'drizzle-orm/pg-core';
import { jsonb } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { uniqueIndex } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';

export const Building = pgTable(
  'Building',
  {
    BuildingID: uuid('BuildingID').primaryKey().defaultRandom(),
    UniversityID: uuid('UniversityID')
      .references(() => University.UniversityID, { onDelete: 'cascade' })
      .notNull(),
    BuildingName: varchar('BuildingName', { length: 100 }).notNull(),

    //these ones are all nullable since a building can exist before an admin places it on the map
    Latitude: doublePrecision('Latitude'),
    Longitude: doublePrecision('Longitude'),
    //nullable drawing from admin around the buildings
    Footprint: jsonb('Footprint').$type<GeoJsonPolygon>(),

    Icon: varchar('Icon', { length: 64 }),
    DisplayColour: varchar('DisplayColour', { length: 10 }),
    CreatedBy: uuid('CreatedBy').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    CreatedAt: timestamp('CreatedAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
    UpdateAt: timestamp('UpdatedAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    buildingUniversityNameUnique: uniqueIndex(
      'building_university_name_unique',
    ).on(table.UniversityID, table.BuildingName),
    buildingUniversityByIdx: index('building_university_id_idx').on(
      table.UniversityID,
    ),
  }),
);
