import { createHash } from 'crypto';
import { ActivityType, DayOfWeek } from 'shared-types';
import { VENUES_BY_ACTIVITY } from './Venues.constants';

const ACTIVITY_TYPES: ActivityType[] = ['lecture', 'tutorial', 'prac'];
const DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
];

export interface EventPattern {
  activityType: ActivityType;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  venueName: string;
  label: string;
}

// Time slots: 07:30 till 17:20
const TIME_SLOTS: { start: string; end: string }[] = [
  { start: '07:30', end: '08:20' },
  { start: '08:30', end: '09:20' },
  { start: '09:30', end: '10:20' },
  { start: '10:30', end: '11:20' },
  { start: '11:30', end: '12:20' },
  { start: '12:30', end: '13:20' },
  { start: '13:30', end: '14:20' },
  { start: '14:30', end: '15:20' },
  { start: '15:30', end: '16:20' },
  { start: '16:30', end: '17:20' },
];

function getEventCount(moduleCode: string): number {
  //Extract numbers from code
  const digits = moduleCode.replace(/\D/g, '');
  const sum = digits.split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
  //Sum numbers
  const mod = sum % 5;
  //max 5
  return mod === 0 ? 5 : mod;
}

export function getDeterministicPatterns(moduleCode: string): EventPattern[] {
  const hash = createHash('sha256').update(moduleCode).digest('hex');
  const seed = parseInt(hash.slice(0, 8), 16);

  const count = getEventCount(moduleCode);

  const patterns: EventPattern[] = [];
  for (let i = 0; i < count; i++) {
    const activity = ACTIVITY_TYPES[(seed + i) % ACTIVITY_TYPES.length];
    const day = DAYS[(seed + i * 7) % DAYS.length];
    const time = TIME_SLOTS[(seed + i * 13) % TIME_SLOTS.length];

    const venueNames =
      VENUES_BY_ACTIVITY[activity] ?? VENUES_BY_ACTIVITY.lecture!;
    const venueName = venueNames[(seed + i * 17) % venueNames.length];

    patterns.push({
      activityType: activity,
      dayOfWeek: day,
      startTime: time.start,
      endTime: time.end,
      venueName,
      label: activity.charAt(0).toUpperCase() + activity.slice(1),
    });
  }
  return patterns;
} //END_getDeterministicPatterns
