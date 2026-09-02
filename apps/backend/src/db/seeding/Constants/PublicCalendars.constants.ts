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
  {
    name: 'South African Public Holidays',
    year: 2027,
    restrictions: [
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-01-01',
        endDate: '2027-01-01',
        description: "New Year's Day",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-03-21',
        endDate: '2027-03-21',
        description: 'Human Rights Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-03-22',
        endDate: '2027-03-22',
        description: 'Human Rights Day (observed)',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-03-26',
        endDate: '2027-03-26',
        description: 'Good Friday',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-03-29',
        endDate: '2027-03-29',
        description: 'Family Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-04-27',
        endDate: '2027-04-27',
        description: 'Freedom Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-05-01',
        endDate: '2027-05-01',
        description: "Workers' Day",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-06-16',
        endDate: '2027-06-16',
        description: 'Youth Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-08-09',
        endDate: '2027-08-09',
        description: "National Women's Day",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-09-24',
        endDate: '2027-09-24',
        description: 'Heritage Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-12-16',
        endDate: '2027-12-16',
        description: 'Day of Reconciliation',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-12-25',
        endDate: '2027-12-25',
        description: 'Christmas Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-12-26',
        endDate: '2027-12-26',
        description: 'Day of Goodwill',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2027-12-27',
        endDate: '2027-12-27',
        description: 'Day of Goodwill (observed)',
      },
    ] satisfies readonly PublicCalendarRestriction[],
  },
  {
    name: 'South African Public Holidays',
    year: 2028,
    restrictions: [
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-01-01',
        endDate: '2028-01-01',
        description: "New Year's Day",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-03-21',
        endDate: '2028-03-21',
        description: 'Human Rights Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-04-14',
        endDate: '2028-04-14',
        description: 'Good Friday',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-04-17',
        endDate: '2028-04-17',
        description: 'Family Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-04-27',
        endDate: '2028-04-27',
        description: 'Freedom Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-05-01',
        endDate: '2028-05-01',
        description: "Workers' Day",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-06-16',
        endDate: '2028-06-16',
        description: 'Youth Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-08-09',
        endDate: '2028-08-09',
        description: "National Women's Day",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-09-24',
        endDate: '2028-09-24',
        description: 'Heritage Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-09-25',
        endDate: '2028-09-25',
        description: 'Heritage Day (observed)',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-12-16',
        endDate: '2028-12-16',
        description: 'Day of Reconciliation',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-12-25',
        endDate: '2028-12-25',
        description: 'Christmas Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2028-12-26',
        endDate: '2028-12-26',
        description: 'Day of Goodwill',
      },
    ] satisfies readonly PublicCalendarRestriction[],
  },
  {
    name: 'South African Public Holidays',
    year: 2029,
    restrictions: [
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-01-01',
        endDate: '2029-01-01',
        description: "New Year's Day",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-03-21',
        endDate: '2029-03-21',
        description: 'Human Rights Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-03-30',
        endDate: '2029-03-30',
        description: 'Good Friday',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-04-02',
        endDate: '2029-04-02',
        description: 'Family Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-04-27',
        endDate: '2029-04-27',
        description: 'Freedom Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-05-01',
        endDate: '2029-05-01',
        description: "Workers' Day",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-06-16',
        endDate: '2029-06-16',
        description: 'Youth Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-08-09',
        endDate: '2029-08-09',
        description: "National Women's Day",
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-09-24',
        endDate: '2029-09-24',
        description: 'Heritage Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-12-16',
        endDate: '2029-12-16',
        description: 'Day of Reconciliation',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-12-17',
        endDate: '2029-12-17',
        description: 'Day of Reconciliation (observed)',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-12-25',
        endDate: '2029-12-25',
        description: 'Christmas Day',
      },
      {
        type: 'PUBLIC_HOLIDAY',
        startDate: '2029-12-26',
        endDate: '2029-12-26',
        description: 'Day of Goodwill',
      },
    ] satisfies readonly PublicCalendarRestriction[],
  },
] as const;
