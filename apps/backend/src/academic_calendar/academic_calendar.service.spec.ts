/* eslint-disable @typescript-eslint/unbound-method */
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { HttpException } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
import { EventSource } from '../Events/dto/event.types';
import {
  createDbChain,
  mockDbResult,
  mockSequentialResults,
} from '../Testing/Mocks/database.helpers';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  createAcademicCalendar,
  createCalendarRestriction,
  createEvent,
  createGeneratedCalendar,
  createTimetable,
} from '../Testing/Factories';
import { AcademicCalendarGenerationService } from './academic-calendar-generation.service';
import { AcademicCalendarService } from './academic_calendar.service';

const universityId = '20000000-0000-4000-8000-000000000001';
const calendarId = '30000000-0000-4000-8000-000000000001';
const restrictionId = '40000000-0000-4000-8000-000000000001';
const publicCalendarId = '30000000-0000-4000-8000-000000000002';
const createdAt = new Date('2026-01-10T08:00:00.000Z');
const updatedAt = new Date('2026-01-11T09:00:00.000Z');
const calendar = createAcademicCalendar({
  id: calendarId,
  universityId,
  year: 2026,
  createdAt,
  updatedAt,
});

const holiday = createCalendarRestriction({
  id: restrictionId,
  academicCalendarId: calendarId,
  startDate: '2026-04-27',
  endDate: '2026-04-27',
  createdAt,
  updatedAt,
});

async function expectDomainError(
  promise: Promise<unknown>,
  type: new (...args: never[]) => HttpException,
  message: string,
): Promise<void> {
  try {
    await promise;
    throw new Error(`Expected ${message}`);
  } catch (error) {
    expect(error).toBeInstanceOf(type);
    expect((error as Error).message).toContain(message);
  }
}

describe('AcademicCalendarService', () => {
  const { mockDb, reset } = createMockDatabase();
  const generationService = new AcademicCalendarGenerationService();
  const service = new AcademicCalendarService(
    {
      db: mockDb,
    } as unknown as DatabaseService,
    generationService,
  );

  afterEach(() => {
    reset();
    jest.restoreAllMocks();
  });

  describe('academic calendar CRUD', () => {
    it('creates a calendar without exposing persistence metadata', async () => {
      mockDbResult(mockDb.insert as jest.Mock, [calendar]);

      await expect(
        service.createCalendar(universityId, { year: 2026 }),
      ).resolves.toEqual({
        id: calendarId,
        year: 2026,
        subscriptions: [],
      });
    });

    it('maps a duplicate university/year constraint to a conflict', async () => {
      (mockDb.insert as jest.Mock).mockReturnValue(
        createDbChain(
          Promise.reject(
            Object.assign(new Error('Failed query'), {
              cause: Object.assign(new Error('unique constraint violation'), {
                code: '23505',
              }),
            }),
          ),
        ),
      );

      await expectDomainError(
        service.createCalendar(universityId, { year: 2026 }),
        ConflictException,
        'already exists',
      );
    });

    it('gets a calendar in the selected university', async () => {
      mockDbResult(mockDb.select as jest.Mock, [calendar]);

      await expect(
        service.getCalendar(universityId, calendarId),
      ).resolves.toMatchObject({
        id: calendarId,
        year: 2026,
        subscriptions: [],
      });
    });

    it('lists calendars for the selected university', async () => {
      const olderCalendar = createAcademicCalendar({
        ...calendar,
        id: '30000000-0000-4000-8000-000000000003',
        year: 2025,
      });
      mockDbResult(mockDb.select as jest.Mock, [calendar, olderCalendar]);

      await expect(service.listCalendars(universityId)).resolves.toEqual([
        { id: calendarId, year: 2026, subscriptions: [] },
        { id: olderCalendar.id, year: 2025, subscriptions: [] },
      ]);
    });

    it('lists calendars for a requested academic year', async () => {
      mockDbResult(mockDb.select as jest.Mock, [calendar]);

      await expect(service.listCalendars(universityId, 2026)).resolves.toEqual([
        { id: calendarId, year: 2026, subscriptions: [] },
      ]);
    });

    it('lists public calendars independently of the selected university', async () => {
      const publicCalendar = createAcademicCalendar({
        ...calendar,
        id: publicCalendarId,
        universityId: null,
      });
      mockDbResult(mockDb.select as jest.Mock, [publicCalendar]);

      await expect(service.listPublicCalendars(2026)).resolves.toEqual([
        { id: publicCalendarId, year: 2026, subscriptions: [] },
      ]);
    });

    it('returns the domain not-found error for an unknown calendar', async () => {
      mockDbResult(mockDb.select as jest.Mock, []);

      await expectDomainError(
        service.getCalendar(universityId, calendarId),
        NotFoundException,
        'Academic calendar not found',
      );
    });

    it('deletes an authorized calendar', async () => {
      mockDbResult(mockDb.delete as jest.Mock, [calendar]);

      await expect(
        service.deleteCalendar(universityId, calendarId),
      ).resolves.toEqual({ success: true });
    });
  });

  describe('subscriptions', () => {
    it('rejects an unknown public-calendar ID', async () => {
      mockSequentialResults(mockDb.select as jest.Mock, [[calendar], []]);

      await expectDomainError(
        service.updateSubscriptions(universityId, calendarId, {
          subscriptions: [publicCalendarId],
        }),
        NotFoundException,
        publicCalendarId,
      );
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('rejects a university-owned calendar as a subscription', async () => {
      mockSequentialResults(mockDb.select as jest.Mock, [[calendar], []]);

      await expectDomainError(
        service.updateSubscriptions(universityId, calendarId, {
          subscriptions: [publicCalendarId],
        }),
        NotFoundException,
        'Public academic calendars not found',
      );
    });

    it('rejects a public calendar from a different year', async () => {
      mockSequentialResults(mockDb.select as jest.Mock, [
        [calendar],
        [{ id: publicCalendarId, year: 2027 }],
      ]);

      await expectDomainError(
        service.updateSubscriptions(universityId, calendarId, {
          subscriptions: [publicCalendarId],
        }),
        UnprocessableEntityException,
        'must match academic calendar year 2026',
      );
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('replaces subscriptions and returns the updated calendar', async () => {
      const updated = {
        ...calendar,
        subscriptions: [publicCalendarId],
      };
      mockSequentialResults(mockDb.select as jest.Mock, [
        [calendar],
        [{ id: publicCalendarId, year: 2026 }],
      ]);
      mockDbResult(mockDb.update as jest.Mock, [updated]);

      await expect(
        service.updateSubscriptions(universityId, calendarId, {
          subscriptions: [publicCalendarId],
        }),
      ).resolves.toEqual({
        id: calendarId,
        year: 2026,
        subscriptions: [publicCalendarId],
      });
    });
  });

  describe('restriction CRUD and validation', () => {
    it('lists restrictions in the response envelope', async () => {
      mockSequentialResults(mockDb.select as jest.Mock, [
        [calendar],
        [holiday],
      ]);

      await expect(
        service.getRestrictions(universityId, calendarId),
      ).resolves.toEqual({
        restrictions: [
          {
            id: restrictionId,
            type: 'PUBLIC_HOLIDAY',
            startDate: '2026-04-27',
            endDate: '2026-04-27',
            description: 'Freedom Day',
            replacementWeekday: null,
          },
        ],
      });
    });

    it('creates a restriction with documented defaults', async () => {
      const created = { ...holiday, description: '' };
      mockDbResult(mockDb.select as jest.Mock, [calendar]);
      mockDbResult(mockDb.insert as jest.Mock, [created]);

      await expect(
        service.createRestriction(universityId, calendarId, {
          type: 'PUBLIC_HOLIDAY',
          startDate: '2026-04-27',
        }),
      ).resolves.toMatchObject({
        endDate: '2026-04-27',
        description: '',
        replacementWeekday: null,
      });
    });

    it('rejects restriction dates outside the academic calendar year', async () => {
      mockDbResult(mockDb.select as jest.Mock, [calendar]);

      await expectDomainError(
        service.createRestriction(universityId, calendarId, {
          type: 'PUBLIC_HOLIDAY',
          startDate: '2027-01-01',
        }),
        UnprocessableEntityException,
        'must fall within academic calendar year 2026',
      );
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('rejects an inverted restriction range', async () => {
      mockDbResult(mockDb.select as jest.Mock, [calendar]);

      await expectDomainError(
        service.createRestriction(universityId, calendarId, {
          type: 'RECESS',
          startDate: '2026-04-10',
          endDate: '2026-04-01',
        }),
        UnprocessableEntityException,
        'endDate must be on or after startDate',
      );
    });

    it('requires a single-date replacement weekday for DAY_SWAP', async () => {
      mockDbResult(mockDb.select as jest.Mock, [calendar]);

      await expectDomainError(
        service.createRestriction(universityId, calendarId, {
          type: 'DAY_SWAP',
          startDate: '2026-08-14',
        }),
        UnprocessableEntityException,
        'DAY_SWAP requires replacementWeekday',
      );
    });

    it('rejects a no-op DAY_SWAP', async () => {
      mockDbResult(mockDb.select as jest.Mock, [calendar]);

      await expectDomainError(
        service.createRestriction(universityId, calendarId, {
          type: 'DAY_SWAP',
          startDate: '2026-08-14',
          replacementWeekday: 'FRIDAY',
        }),
        ConflictException,
        'must use a different weekday pattern',
      );
    });

    it('rejects a duplicate DAY_SWAP target', async () => {
      mockDbResult(mockDb.select as jest.Mock, [calendar]);
      (mockDb.insert as jest.Mock).mockReturnValue(
        createDbChain(
          Promise.reject(
            Object.assign(new Error('unique constraint violation'), {
              code: '23505',
            }),
          ),
        ),
      );

      await expectDomainError(
        service.createRestriction(universityId, calendarId, {
          type: 'DAY_SWAP',
          startDate: '2026-08-14',
          replacementWeekday: 'MONDAY',
        }),
        ConflictException,
        'A day swap already exists',
      );
    });

    it('fully replaces a restriction scoped to its parent calendar', async () => {
      const updated = {
        ...holiday,
        type: 'UNIVERSITY_CLOSURE' as const,
        description: 'Campus closed',
      };
      mockSequentialResults(mockDb.select as jest.Mock, [
        [calendar],
        [holiday],
      ]);
      mockDbResult(mockDb.update as jest.Mock, [updated]);

      await expect(
        service.updateRestriction(universityId, calendarId, restrictionId, {
          type: 'UNIVERSITY_CLOSURE',
          startDate: '2026-04-27',
          description: 'Campus closed',
        }),
      ).resolves.toMatchObject({
        id: restrictionId,
        type: 'UNIVERSITY_CLOSURE',
        description: 'Campus closed',
      });
    });

    it('returns not found when a scoped restriction update affects no row', async () => {
      mockSequentialResults(mockDb.select as jest.Mock, [[calendar], []]);
      mockDbResult(mockDb.update as jest.Mock, []);

      await expect(
        service.updateRestriction(universityId, calendarId, restrictionId, {
          type: 'PUBLIC_HOLIDAY',
          startDate: '2026-04-27',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('deletes only a restriction belonging to the parent calendar', async () => {
      mockSequentialResults(mockDb.select as jest.Mock, [
        [calendar],
        [holiday],
      ]);
      mockDbResult(mockDb.delete as jest.Mock, [holiday]);

      await expect(
        service.deleteRestriction(universityId, calendarId, restrictionId),
      ).resolves.toEqual({ success: true });
    });

    it('returns not found when a scoped restriction delete affects no row', async () => {
      mockSequentialResults(mockDb.select as jest.Mock, [[calendar], []]);
      mockDbResult(mockDb.delete as jest.Mock, []);

      await expectDomainError(
        service.deleteRestriction(universityId, calendarId, restrictionId),
        NotFoundException,
        'Calendar restriction not found',
      );
    });

    it('rejects a duplicate semester boundary at write time', async () => {
      const semesterStart = createCalendarRestriction({
        id: '41000000-0000-4000-8000-000000000011',
        academicCalendarId: calendarId,
        type: 'SEMESTER_1_START',
        startDate: '2026-02-09',
        endDate: '2026-02-09',
      });
      mockSequentialResults(mockDb.select as jest.Mock, [
        [calendar],
        [semesterStart],
      ]);

      await expectDomainError(
        service.createRestriction(universityId, calendarId, {
          type: 'SEMESTER_1_START',
          startDate: '2026-02-16',
        }),
        UnprocessableEntityException,
        'exactly one SEMESTER_1_START',
      );
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('rejects out-of-order semester boundaries when the set becomes complete', async () => {
      const existing = [
        createCalendarRestriction({
          id: '41000000-0000-4000-8000-000000000012',
          type: 'SEMESTER_1_START',
          startDate: '2026-02-09',
          endDate: '2026-02-09',
        }),
        createCalendarRestriction({
          id: '41000000-0000-4000-8000-000000000013',
          type: 'SEMESTER_1_END',
          startDate: '2026-06-12',
          endDate: '2026-06-12',
        }),
        createCalendarRestriction({
          id: '41000000-0000-4000-8000-000000000014',
          type: 'SEMESTER_2_START',
          startDate: '2026-07-20',
          endDate: '2026-07-20',
        }),
      ];
      mockSequentialResults(mockDb.select as jest.Mock, [[calendar], existing]);

      await expectDomainError(
        service.createRestriction(universityId, calendarId, {
          type: 'SEMESTER_2_END',
          startDate: '2026-07-01',
        }),
        UnprocessableEntityException,
        'overlap or are out of order',
      );
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('rejects an update that makes complete semester boundaries invalid', async () => {
      const boundaries = [
        createCalendarRestriction({
          id: '41000000-0000-4000-8000-000000000021',
          type: 'SEMESTER_1_START',
          startDate: '2026-02-09',
          endDate: '2026-02-09',
        }),
        createCalendarRestriction({
          id: restrictionId,
          type: 'SEMESTER_1_END',
          startDate: '2026-06-12',
          endDate: '2026-06-12',
        }),
        createCalendarRestriction({
          id: '41000000-0000-4000-8000-000000000022',
          type: 'SEMESTER_2_START',
          startDate: '2026-07-20',
          endDate: '2026-07-20',
        }),
        createCalendarRestriction({
          id: '41000000-0000-4000-8000-000000000023',
          type: 'SEMESTER_2_END',
          startDate: '2026-11-06',
          endDate: '2026-11-06',
        }),
      ];
      mockSequentialResults(mockDb.select as jest.Mock, [
        [calendar],
        boundaries,
      ]);

      await expectDomainError(
        service.updateRestriction(universityId, calendarId, restrictionId, {
          type: 'SEMESTER_1_END',
          startDate: '2026-07-21',
        }),
        UnprocessableEntityException,
        'overlap or are out of order',
      );
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('rejects deleting a boundary from a complete semester set', async () => {
      const boundaries = [
        createCalendarRestriction({
          id: restrictionId,
          type: 'SEMESTER_1_START',
          startDate: '2026-02-09',
          endDate: '2026-02-09',
        }),
        createCalendarRestriction({
          type: 'SEMESTER_1_END',
          startDate: '2026-06-12',
          endDate: '2026-06-12',
        }),
        createCalendarRestriction({
          type: 'SEMESTER_2_START',
          startDate: '2026-07-20',
          endDate: '2026-07-20',
        }),
        createCalendarRestriction({
          type: 'SEMESTER_2_END',
          startDate: '2026-11-06',
          endDate: '2026-11-06',
        }),
      ];
      mockSequentialResults(mockDb.select as jest.Mock, [
        [calendar],
        boundaries,
      ]);

      await expectDomainError(
        service.deleteRestriction(universityId, calendarId, restrictionId),
        UnprocessableEntityException,
        'exactly one SEMESTER_1_START',
      );
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
  });

  describe('calendar generation', () => {
    const timetableId = '50000000-0000-4000-8000-000000000001';
    const userId = '60000000-0000-4000-8000-000000000001';
    const moduleId = '70000000-0000-4000-8000-000000000001';
    const lectureId = '80000000-0000-4000-8000-000000000001';
    const examId = '80000000-0000-4000-8000-000000000002';
    const extraLectureId = '80000000-0000-4000-8000-000000000003';
    const generatedId = '90000000-0000-4000-8000-000000000001';
    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-15T08:00:00.000Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    const restrictions = [
      createCalendarRestriction({
        ...holiday,
        id: '41000000-0000-4000-8000-000000000001',
        type: 'SEMESTER_1_START',
        startDate: '2026-02-09',
        endDate: '2026-02-09',
      }),
      createCalendarRestriction({
        ...holiday,
        id: '41000000-0000-4000-8000-000000000002',
        type: 'SEMESTER_1_END',
        startDate: '2026-06-12',
        endDate: '2026-06-12',
      }),
      createCalendarRestriction({
        ...holiday,
        id: '41000000-0000-4000-8000-000000000003',
        type: 'SEMESTER_2_START',
        startDate: '2026-07-20',
        endDate: '2026-07-20',
      }),
      createCalendarRestriction({
        ...holiday,
        id: '41000000-0000-4000-8000-000000000004',
        type: 'SEMESTER_2_END',
        startDate: '2026-11-06',
        endDate: '2026-11-06',
      }),
      createCalendarRestriction({
        ...holiday,
        id: '41000000-0000-4000-8000-000000000005',
        type: 'TEST_WEEK',
        startDate: '2026-03-09',
        endDate: '2026-03-13',
        description: 'Test week',
      }),
      createCalendarRestriction({
        ...holiday,
        id: '41000000-0000-4000-8000-000000000006',
        type: 'DAY_SWAP',
        startDate: '2026-03-20',
        endDate: '2026-03-20',
        replacementWeekday: 'MONDAY',
        description: 'Use Monday timetable',
      }),
    ];

    const lecture = createEvent(
      EventSource.UNIVERSITY,
      {
        eventID: lectureId,
        eventName: 'Lecture',
        activityCode: 'L1',
        activityType: 'lecture',
        isRecurring: true,
      },
      {
        moduleId,
        dayOfWeek: 'monday',
        startTime: '08:30',
        endTime: '09:20',
      },
    );
    const exam = createEvent(
      EventSource.UNIVERSITY,
      {
        eventID: examId,
        eventName: 'Exam',
        activityType: 'exam',
      },
      {
        moduleId,
        date: '2026-03-10',
        startTime: '09:00',
        endTime: '12:00',
      },
    );
    const oneOffLecture = createEvent(
      EventSource.UNIVERSITY,
      {
        eventID: extraLectureId,
        eventName: 'Special Lecture',
        activityType: 'lecture',
      },
      exam.eventCriteria,
    );

    it("requires the selected university's current-year calendar", async () => {
      mockDbResult(mockDb.select as jest.Mock, []);

      await expectDomainError(
        service.generateCalendar(userId, universityId, { timetableId }),
        NotFoundException,
        'and year 2026',
      );
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('uses an explicitly requested academic year', async () => {
      mockDbResult(mockDb.select as jest.Mock, []);

      await expectDomainError(
        service.generateCalendar(userId, universityId, {
          timetableId,
          year: 2027,
        }),
        NotFoundException,
        'and year 2027',
      );
    });

    it('does not query subscribed restrictions when subscriptions are empty', async () => {
      mockSequentialResults(mockDb.select as jest.Mock, [
        [calendar],
        [
          {
            timetable: createTimetable({
              timetableID: timetableId,
              timetableName: 'My timetable',
            }),
          },
        ],
        restrictions,
        [],
      ]);
      const generated = createGeneratedCalendar({
        id: generatedId,
        academicCalendarId: calendarId,
        timetableId,
      });
      mockDbResult(mockDb.insert as jest.Mock, [generated]);

      await service.generateCalendar(userId, universityId, { timetableId });

      expect(mockDb.select).toHaveBeenCalledTimes(4);
    });

    it('merges subscribed public restrictions into generation input', async () => {
      const subscribedCalendar = {
        ...calendar,
        subscriptions: [publicCalendarId],
      };
      const publicHoliday = createCalendarRestriction({
        id: '41000000-0000-4000-8000-000000000007',
        academicCalendarId: publicCalendarId,
        startDate: '2026-06-16',
        endDate: '2026-06-16',
        description: 'Youth Day',
      });
      mockSequentialResults(mockDb.select as jest.Mock, [
        [subscribedCalendar],
        [
          {
            timetable: createTimetable({
              timetableID: timetableId,
              timetableName: 'My timetable',
            }),
          },
        ],
        restrictions,
        [{ restriction: publicHoliday }],
        [],
      ]);
      const generated = createGeneratedCalendar({
        id: generatedId,
        academicCalendarId: calendarId,
        timetableId,
      });
      mockDbResult(mockDb.insert as jest.Mock, [generated]);
      const build = jest.spyOn(generationService, 'build');

      await service.generateCalendar(userId, universityId, { timetableId });

      expect(build.mock.calls[0][2]).toContainEqual(publicHoliday);
    });

    it('lets own restrictions win over a subscribed duplicate', async () => {
      const subscribedCalendar = {
        ...calendar,
        subscriptions: [publicCalendarId],
      };
      const ownHoliday = createCalendarRestriction({
        ...holiday,
        description: 'University Freedom Day',
      });
      const publicHoliday = createCalendarRestriction({
        ...holiday,
        id: '41000000-0000-4000-8000-000000000008',
        academicCalendarId: publicCalendarId,
        description: 'Public Freedom Day',
      });
      mockSequentialResults(mockDb.select as jest.Mock, [
        [subscribedCalendar],
        [
          {
            timetable: createTimetable({
              timetableID: timetableId,
              timetableName: 'My timetable',
            }),
          },
        ],
        [...restrictions, ownHoliday],
        [{ restriction: publicHoliday }],
        [],
      ]);
      const generated = createGeneratedCalendar({
        id: generatedId,
        academicCalendarId: calendarId,
        timetableId,
      });
      mockDbResult(mockDb.insert as jest.Mock, [generated]);
      const build = jest.spyOn(generationService, 'build');

      await service.generateCalendar(userId, universityId, { timetableId });

      const freedomDays = build.mock.calls[0][2].filter(
        (item) =>
          item.type === 'PUBLIC_HOLIDAY' &&
          item.startDate === '2026-04-27' &&
          item.endDate === '2026-04-27',
      );
      expect(freedomDays).toEqual([ownHoliday]);
    });

    it('filters teaching events, keeps one-off exams, applies day swaps, and persists student colours', async () => {
      mockSequentialResults(mockDb.select as jest.Mock, [
        [calendar],
        [
          {
            timetable: createTimetable({
              timetableID: timetableId,
              timetableName: 'My timetable',
            }),
          },
        ],
        restrictions,
        [
          {
            event: lecture,
            moduleId,
            moduleCode: 'COS301',
            moduleName: 'Software Engineering',
            semester: null,
            styling: { colour: '#123456' },
            venueName: 'IT 4-1',
          },
          {
            event: exam,
            moduleId,
            moduleCode: 'COS301',
            moduleName: 'Software Engineering',
            semester: 'SEMESTER_1',
            styling: { colour: '#123456' },
            venueName: 'Exam Hall',
          },
          {
            event: oneOffLecture,
            moduleId,
            moduleCode: 'COS301',
            moduleName: 'Software Engineering',
            semester: 'SEMESTER_1',
            styling: { colour: '#123456' },
            venueName: 'IT 4-1',
          },
        ],
      ]);
      const generated = createGeneratedCalendar({
        id: generatedId,
        academicCalendarId: calendarId,
        timetableId,
        createdAt,
      });
      const insertChain = createDbChain([generated]);
      (mockDb.insert as jest.Mock).mockReturnValue(insertChain);

      await expect(
        service.generateCalendar(userId, universityId, {
          timetableId,
        }),
      ).resolves.toMatchObject({ id: generatedId });

      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          // Jest asymmetric matchers are typed as any.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          payload: expect.objectContaining({
            recurringEvents: [
              expect.objectContaining({
                moduleColour: '#123456',
                startsOn: '2026-02-09',
                endsOn: '2026-11-02',
                excludedDates: ['2026-03-09'],
                additionalDates: ['2026-03-20'],
              }),
            ],
            oneOffEvents: [
              expect.objectContaining({
                date: '2026-03-10',
                moduleColour: '#123456',
              }),
            ],
            allDayEvents: [
              expect.objectContaining({
                type: 'TEST_WEEK',
                startDate: '2026-03-09',
                endDate: '2026-03-13',
              }),
            ],
          }),
        }),
      );
      expect(insertChain.onConflictDoUpdate).toHaveBeenCalledWith({
        target: expect.any(Array),
        set: expect.objectContaining({
          payload: expect.any(Object),
          createdAt: expect.any(Date),
        }),
      });
    });

    it('requires all four valid semester boundaries', async () => {
      mockSequentialResults(mockDb.select as jest.Mock, [
        [calendar],
        [
          {
            timetable: createTimetable({
              timetableID: timetableId,
              timetableName: null,
            }),
          },
        ],
        restrictions.slice(1),
        [],
      ]);

      await expectDomainError(
        service.generateCalendar(userId, universityId, {
          timetableId,
        }),
        UnprocessableEntityException,
        'exactly one SEMESTER_1_START',
      );
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('returns only snapshots owned by the student in the selected university', async () => {
      const generated = createGeneratedCalendar({
        id: generatedId,
        academicCalendarId: calendarId,
        timetableId,
        payload: {} as never,
        createdAt,
      });
      mockDbResult(mockDb.select as jest.Mock, [{ generated }]);

      await expect(
        service.getGeneratedCalendar(userId, universityId, generatedId),
      ).resolves.toEqual({ id: generatedId, payload: {} });
    });
  });
});
