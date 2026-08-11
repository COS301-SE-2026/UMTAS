export const CALENDAR_RESTRICTION_TYPES = [
  'SEMESTER_1_START',
  'SEMESTER_1_END',
  'SEMESTER_2_START',
  'SEMESTER_2_END',
  'HOLIDAY',
  'PUBLIC_HOLIDAY',
  'UNIVERSITY_CLOSURE',
  'RECESS',
  'TEST_WEEK',
  'EXAM_PERIOD',
  'SUPP_WEEK',
  'DAY_SWAP',
] as const;

export type CalendarRestrictionType =
  (typeof CALENDAR_RESTRICTION_TYPES)[number];

export const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type Weekday = (typeof WEEKDAYS)[number];
