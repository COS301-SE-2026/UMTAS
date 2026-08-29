import { uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { University } from '../Universities';
import { Building } from './building.schema';
import { jsonb } from 'drizzle-orm/pg-core';
import { LatLngDto } from 'src/Building/dto/building.dto';
import { integer } from 'drizzle-orm/pg-core';
import { varchar } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { uniqueIndex } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';

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
    PathCoordinates: jsonb('PathCoordinates').$type<LatLngDto[]>().notNull(),
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
    routeOriginDestinationUnique: uniqueIndex(
      'route_origin_destination_unique',
    ).on(table.OriginBuildingID, table.DestinationBuildingID),
    routeUniversityByIdx: index('route_university_id_idx').on(
      table.UniversityID,
    ),
  }),
);
