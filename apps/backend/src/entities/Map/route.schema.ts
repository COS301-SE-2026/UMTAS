import { uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { University } from '../Universities';
import { Building } from './building.schema';
import { jsonb } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { varchar } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { uniqueIndex } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';

interface LatLng {
  lat: number;
  lng: number;
}

export const Route = pgTable(
  'Route',
  {
    RouteID: uuid('RouteID').primaryKey().defaultRandom(),
    UniversityID: uuid('UniversityID')
      .references(() => University.UniversityID, { onDelete: 'cascade' })
      .notNull(),
    OriginBuildingID: uuid('OriginBuildingID')
      .references(() => Building.BuildingID, { onDelete: 'cascade' })
      .notNull(),
    DestinationBuildingID: uuid('DestinationBuildingID')
      .references(() => Building.BuildingID, { onDelete: 'cascade' })
      .notNull(),
    RouteIndex: integer('RouteIndex').default(0).notNull(),
    PathCoordinates: jsonb('PathCoordinates').$type<LatLng[]>().notNull(),
    DistanceMetres: integer('DistanceMetres').notNull(),
    DisplayColour: varchar('DisplayColour', { length: 10 })
      .default('#0000FF')
      .notNull(),
    CreatedAt: timestamp('CreatedAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
    UpdatedAt: timestamp('UpdatedAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    routeVariantUnique: uniqueIndex(
      'route_university_origin_destination_variant_unique',
    ).on(
      table.UniversityID,
      table.OriginBuildingID,
      table.DestinationBuildingID,
      table.RouteIndex,
    ),

    routeUniversityOriginDestinationIdx: index(
      'route_university_origin_destination_idx',
    ).on(
      table.UniversityID,
      table.OriginBuildingID,
      table.DestinationBuildingID,
    ),
  }),
);
