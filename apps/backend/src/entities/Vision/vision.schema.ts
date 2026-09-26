import {
  date,
  index,
  jsonb,
  pgTable,
  text,
  uuid,
  varchar,
  uniqueIndex,
  timestamp,
} from 'drizzle-orm/pg-core';
import { modules, Event, usersTable } from '../index';

//Types
import type { SessionInferenceResult } from '../../Vision/dto';

export const VisionSession = pgTable(
  'VisionSession',
  {
    SessionID: uuid('SessionID').defaultRandom().primaryKey(),
    ModuleID: uuid('ModuleID')
      .references(() => modules.moduleID, { onDelete: 'cascade' })
      .notNull(),
    EventID: uuid('EventID').references(() => Event.eventID, {
      onDelete: 'set null',
    }),
    Date: date('Date').notNull(),
    SessionName: varchar('SessionName', { length: 256 }).notNull(),
    SessionDsc: text('SessionDsc'),
    Data: jsonb('Data').$type<SessionInferenceResult>().notNull().default({
      questions_asked: 0,
      total_restless_frames: 0,
      total_stable_frames: 0,
      total_paying_attention: 0,
      total_no_attention: 0,
      total_frames: 0,
    }),
    CreatedBy: uuid('CreatedBy').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    CreatedAt: timestamp('CreatedAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    moduleDateIdx: index('vision_session_module_date_idx').on(
      table.ModuleID,
      table.Date,
    ),
    eventIdx: index('vision_session_event_idx').on(table.EventID),
    moduleNameUnique: uniqueIndex('vision_session_module_name_unique').on(
      table.ModuleID,
      table.SessionName,
      table.Date,
    ),
  }),
);
