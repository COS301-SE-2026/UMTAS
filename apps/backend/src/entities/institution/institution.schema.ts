// Tables:
/**
 * universities
 * academic_calenders
 * restrictions
 */

// ENUM
/**
 * restriction_type
 */
import { relations, sql } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  index,
  uuid,
  uniqueIndex,
  date,
  boolean,
  smallint,
  text,
  timestamp,
  jsonb,
  //   integer,
  //   bigint,
} from 'drizzle-orm/pg-core';

export const restrictionTypeEnum = pgEnum('restriction_type', [
  'public_holiday',
  'recess',
  'closure',
  'exam_period',
  'day_swap',
]); //restrictionTypeEnum

export const universitiesTable = pgTable(
  'universities',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    name: text('name').notNull(),
    country: text('country').notNull(),
    email_domain: text('email_domain'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailDomainUniqueIndex: uniqueIndex('universities_email_domain_unique').on(
      table.email_domain,
    ),
  }),
); //universitiesTable

export const academicCalendarsTable = pgTable(
  'academic_calendars',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    universityId: uuid('university_id')
      .notNull()
      .references(() => universitiesTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), //Maybe null
    timezone: text('timezone').notNull().default('Africa/Johannesburg'),
    regionCode: text('region_code').notNull(),
    semesterStart: date('semester_start').notNull(),
    semesterEnd: date('semester_end').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    universityIdIndex: index('academic_calendars_university_id_idx').on(
      table.universityId,
    ),
  }),
); //academicCalendarsTable

export const restrictionsTable = pgTable(
  'restrictions',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    academicCalendarId: uuid('academic_calendar_id')
      .notNull()
      .references(() => academicCalendarsTable.id, { onDelete: 'cascade' }),
    type: restrictionTypeEnum('type').notNull(),
    dateStart: date('date_start').notNull(),
    dateEnd: date('date_end').notNull(),
    sourceDayOfWeek: smallint('source_day_of_week'),
    targetDayOfWeek: smallint('target_day_of_week'),
    label: text('label').notNull(),
    criteria: jsonb('criteria'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    calendarTypeIndex: index('restrictions_calendar_type_idx').on(
      table.academicCalendarId,
      table.type,
    ),

    dateRangeIndex: index('restrictions_date_range_idx').on(
      table.dateStart,
      table.dateEnd,
    ),
  }),
); //restrictionsTable

export const universitiesRelations = relations(
  universitiesTable,
  ({ many }) => ({ academicCalendars: many(academicCalendarsTable) }),
); //universitiesRelations

export const academicCalendarsRelations = relations(
  academicCalendarsTable,
  ({ one, many }) => ({
    university: one(universitiesTable, {
      fields: [academicCalendarsTable.universityId],
      references: [universitiesTable.id],
    }),

    restrictions: many(restrictionsTable),
  }),
); //academicCalendarsRelations

export const restrictionsRelations = relations(
  restrictionsTable,
  ({ one }) => ({
    academicCalendar: one(academicCalendarsTable, {
      fields: [restrictionsTable.academicCalendarId],
      references: [academicCalendarsTable.id],
    }),
  }),
); //restrictionsRelations

export type University = typeof universitiesTable.$inferSelect;
export type NewUniversity = typeof universitiesTable.$inferInsert;

export type AcademicCalendar = typeof academicCalendarsTable.$inferSelect;
export type NewAcademicCalendar = typeof academicCalendarsTable.$inferInsert;

export type Restriction = typeof restrictionsTable.$inferSelect;
export type NewRestriction = typeof restrictionsTable.$inferInsert;
