import type { NewCalendarRestrictionRecord } from '../../../entities';

type PublicCalendarRestriction = Omit<
  NewCalendarRestrictionRecord,
  'academicCalendarId' | 'replacementWeekday' | 'type'
> & {
  type: 'PUBLIC_HOLIDAY' | 'HOLIDAY' | 'UNIVERSITY_CLOSURE';
};

export const PublicCalendarsSeed = [
  {
    name: 'South African Public Holidays',
    year: 2026,
    restrictions: [
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-01-01',
        endDate: '2026-01-01',
        description: "New Year's Day",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-03-21',
        endDate: '2026-03-21',
        description: 'Human Rights Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-04-03',
        endDate: '2026-04-03',
        description: 'Good Friday',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-04-06',
        endDate: '2026-04-06',
        description: 'Family Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-04-27',
        endDate: '2026-04-27',
        description: 'Freedom Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-05-01',
        endDate: '2026-05-01',
        description: "Workers' Day",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-06-16',
        endDate: '2026-06-16',
        description: 'Youth Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-08-09',
        endDate: '2026-08-09',
        description: "National Women's Day",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-08-10',
        endDate: '2026-08-10',
        description: "National Women's Day (observed)",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-09-24',
        endDate: '2026-09-24',
        description: 'Heritage Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-12-16',
        endDate: '2026-12-16',
        description: 'Day of Reconciliation',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-12-25',
        endDate: '2026-12-25',
        description: 'Christmas Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2026-12-26',
        endDate: '2026-12-26',
        description: 'Day of Goodwill',
      },
    ] satisfies readonly PublicCalendarRestriction[],
  },
] as const;
