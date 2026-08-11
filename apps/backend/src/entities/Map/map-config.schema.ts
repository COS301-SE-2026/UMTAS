import {
  doublePrecision,
  integer,
  pgTable,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { University } from '../Universities';

export const UniversityMapConfig = pgTable('UniversityMapConfig', {
  UniversityID: uuid('UniversityID')
    .primaryKey()
    .references(() => University.UniversityID, { onDelete: 'cascade' }),
  NorthLat: doublePrecision('NorthLat').notNull(),
  SouthLat: doublePrecision('SouthLat').notNull(),
  EastLng: doublePrecision('EastLng').notNull(),
  WestLng: doublePrecision('WestLng').notNull(),
  DefaultZoom: integer('DefaultZoom').default(16).notNull(),
  GoogleMapID: varchar('GoogleMapId', { length: 64 }),
});
