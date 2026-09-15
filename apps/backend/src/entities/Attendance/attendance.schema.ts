import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { usersTable } from '../auth';
import { Event } from '../Events';

export const AttendanceSessionState = pgEnum('AttendanceSessionState', [
  'SCHEDULED',
  'OPEN',
  'CLOSED',
  'CANCELLED',
]);

export enum AttendanceSessionStateEnum {
  SCHEDULED = 'SCHEDULED',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export type AttendanceSessionStateType =
  (typeof AttendanceSessionState.enumValues)[number];

export const AttendanceCaptureMode = pgEnum('AttendanceCaptureMode', [
  'IDENTIFIED',
  'AGGREGATE',
]);

export enum AttendanceCaptureModeEnum {
  IDENTIFIED = 'IDENTIFIED',
  AGGREGATE = 'AGGREGATE',
}

export type AttendanceCaptureModeType =
  (typeof AttendanceCaptureMode.enumValues)[number];

export const SessionAttendanceCaptureMethod = pgEnum(
  'SessionAttendanceCaptureMethod',
  ['NFC', 'BARCODE', 'CAMERA', 'MANUAL'],
);

export enum SessionAttendanceCaptureMethodEnum {
  NFC = 'NFC',
  BARCODE = 'BARCODE',
  CAMERA = 'CAMERA',
  MANUAL = 'MANUAL',
}

export type SessionAttendanceCaptureMethodType =
  (typeof SessionAttendanceCaptureMethod.enumValues)[number];

export const AttendanceSession = pgTable(
  'AttendanceSession',
  {
    SessionID: uuid('SessionID').primaryKey().defaultRandom(),
    eventID: uuid('eventID')
      .references(() => Event.eventID, { onDelete: 'cascade' })
      .notNull(),
    scheduledStartAt: timestamp('scheduledStartAt', {
      withTimezone: true,
    }).notNull(),
    scheduledEndAt: timestamp('scheduledEndAt', {
      withTimezone: true,
    }).notNull(),
    captureOpensAt: timestamp('captureOpensAt', {
      withTimezone: true,
    }).notNull(),
    captureClosesAt: timestamp('captureClosesAt', {
      withTimezone: true,
    }).notNull(),
    state: AttendanceSessionState('state').notNull().default('SCHEDULED'),
    captureMode: AttendanceCaptureMode('captureMode')
      .notNull()
      .default('IDENTIFIED'),
    openedAt: timestamp('openedAt', { withTimezone: true }),
    closedAt: timestamp('closedAt', { withTimezone: true }),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('attendance_session_event_start_unique').on(
      table.eventID,
      table.scheduledStartAt,
    ),
    check(
      'attendance_session_schedule_check',
      sql`${table.scheduledStartAt} < ${table.scheduledEndAt} AND ${table.captureOpensAt} < ${table.captureClosesAt}`,
    ),
  ],
);

export const SessionAttendance = pgTable(
  'SessionAttendance',
  {
    AttendanceID: uuid('AttendanceID').primaryKey().defaultRandom(),
    SessionID: uuid('SessionID')
      .references(() => AttendanceSession.SessionID, { onDelete: 'cascade' })
      .notNull(),
    UserID: uuid('UserID').references(() => usersTable.id, {
      onDelete: 'cascade',
    }),
    guestCount: integer('guestCount'),
    captureMethod: SessionAttendanceCaptureMethod('captureMethod').notNull(),
    recordedAt: timestamp('recordedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('session_attendance_session_user_unique')
      .on(table.SessionID, table.UserID)
      .where(sql`${table.UserID} IS NOT NULL`),
    uniqueIndex('session_attendance_session_aggregate_unique')
      .on(table.SessionID)
      .where(sql`${table.UserID} IS NULL`),
    index('session_attendance_user_idx').on(table.UserID),
    index('session_attendance_session_idx').on(table.SessionID),
    check(
      'session_attendance_shape_check',
      sql`((${table.UserID} IS NOT NULL AND ${table.guestCount} IS NULL) OR (${table.UserID} IS NULL AND ${table.guestCount} IS NOT NULL AND ${table.guestCount} >= 0))`,
    ),
  ],
);

export type AttendanceSessionEntity = typeof AttendanceSession.$inferSelect;
export type NewAttendanceSession = typeof AttendanceSession.$inferInsert;
export type SessionAttendanceEntity = typeof SessionAttendance.$inferSelect;
export type NewSessionAttendance = typeof SessionAttendance.$inferInsert;
