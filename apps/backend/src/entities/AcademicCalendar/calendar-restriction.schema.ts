import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { AcademicCalendar } from './academic-calendar.schema';
import { CALENDAR_RESTRICTION_TYPES, WEEKDAYS } from './calendar.types';

export const calendarRestrictionTypeEnum = pgEnum(
  'CalendarRestrictionType',
  CALENDAR_RESTRICTION_TYPES,
);

export const weekdayEnum = pgEnum('CalendarWeekday', WEEKDAYS);

export const CalendarRestriction = pgTable(
  'CalendarRestriction',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    academicCalendarId: uuid('academicCalendarId')
      .notNull()
      .references(() => AcademicCalendar.id, { onDelete: 'cascade' }),
    type: calendarRestrictionTypeEnum('type').notNull(),
    startDate: date('startDate', { mode: 'string' }).notNull(),
    endDate: date('endDate', { mode: 'string' }).notNull(),
    description: text('description').default('').notNull(),
    replacementWeekday: weekdayEnum('replacementWeekday'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('calendar_restriction_calendar_idx').on(table.academicCalendarId),
    check(
      'calendar_restriction_date_range_valid',
      sql`${table.endDate} >= ${table.startDate}`,
    ),
    check(
      'calendar_restriction_replacement_weekday_valid',
      sql`(${table.type} = 'DAY_SWAP' and ${table.replacementWeekday} is not null)
          or (${table.type} <> 'DAY_SWAP' and ${table.replacementWeekday} is null)`,
    ),
    uniqueIndex('calendar_restriction_day_swap_target_unique')
      .on(table.academicCalendarId, table.startDate)
      .where(sql`${table.type} = 'DAY_SWAP'`),
  ],
);

export type CalendarRestrictionRecord = typeof CalendarRestriction.$inferSelect;
export type NewCalendarRestrictionRecord =
  typeof CalendarRestriction.$inferInsert;
