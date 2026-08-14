import type { NewCalendarRestrictionRecord } from '../../../entities';

export const AcademicCalendarSeed = {
  universityName: 'University of Pretoria',
  year: 2026,
  restrictions: [
    {
      type: 'SEMESTER_1_START',
      startDate: '2026-02-09',
      endDate: '2026-02-09',
      description: 'Semester 1 starts',
    },
    {
      type: 'SEMESTER_1_END',
      startDate: '2026-06-12',
      endDate: '2026-06-12',
      description: 'Semester 1 ends',
    },
    {
      type: 'RECESS',
      startDate: '2026-03-28',
      endDate: '2026-04-06',
      description: 'Autumn recess',
    },
    {
      type: 'PUBLIC_HOLIDAY',
      startDate: '2026-04-27',
      endDate: '2026-04-27',
      description: 'Freedom Day',
    },
    {
      type: 'SEMESTER_2_START',
      startDate: '2026-07-20',
      endDate: '2026-07-20',
      description: 'Semester 2 starts',
    },
    {
      type: 'DAY_SWAP',
      startDate: '2026-08-14',
      endDate: '2026-08-14',
      description: 'Use the Monday teaching pattern',
      replacementWeekday: 'MONDAY',
    },
    {
      type: 'SEMESTER_2_END',
      startDate: '2026-11-06',
      endDate: '2026-11-06',
      description: 'Semester 2 ends',
    },
  ] satisfies readonly Omit<
    NewCalendarRestrictionRecord,
    'academicCalendarId'
  >[],
} as const;
