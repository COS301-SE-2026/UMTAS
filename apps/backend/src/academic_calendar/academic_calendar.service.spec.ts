/* eslint-disable @typescript-eslint/unbound-method */
import {
  ConflictException,
  NotFoundException,
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { HttpException } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
import {
  createDbChain,
  mockDbResult,
  mockSequentialResults,
} from '../Testing/Mocks/database.helpers';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { AcademicCalendarService } from './academic_calendar.service';

const universityId = '20000000-0000-4000-8000-000000000001';
const otherUniversityId = '20000000-0000-4000-8000-000000000002';
const calendarId = '30000000-0000-4000-8000-000000000001';
const restrictionId = '40000000-0000-4000-8000-000000000001';
const createdAt = new Date('2026-01-10T08:00:00.000Z');
const updatedAt = new Date('2026-01-11T09:00:00.000Z');

const calendar = {
  id: calendarId,
  universityId,
  year: 2026,
  createdAt,
  updatedAt,
};

const holiday = {
  id: restrictionId,
  academicCalendarId: calendarId,
  type: 'PUBLIC_HOLIDAY' as const,
  startDate: '2026-04-27',
  endDate: '2026-04-27',
  description: 'Freedom Day',
  replacementWeekday: null,
  createdAt,
  updatedAt,
};

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
  const service = new AcademicCalendarService({
    db: mockDb,
  } as unknown as DatabaseService);

  afterEach(reset);

  describe('academic calendar CRUD', () => {
    it('creates a calendar and serializes timestamps', async () => {
      mockDbResult(mockDb.select as jest.Mock, []);
      mockDbResult(mockDb.insert as jest.Mock, [calendar]);

      await expect(
        service.createCalendar(universityId, { year: 2026 }),
      ).resolves.toEqual({
        ...calendar,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      });
    });

    it('rejects a duplicate university/year before insertion', async () => {
      mockDbResult(mockDb.select as jest.Mock, [{ id: calendarId }]);

      await expectDomainError(
        service.createCalendar(universityId, { year: 2026 }),
        ConflictException,
        'already exists',
      );
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('gets a calendar in the selected university', async () => {
      mockDbResult(mockDb.select as jest.Mock, [calendar]);

      await expect(
        service.getCalendar(universityId, calendarId),
      ).resolves.toMatchObject({
        id: calendarId,
        createdAt: createdAt.toISOString(),
      });
    });

    it('returns the domain not-found error for an unknown calendar', async () => {
      mockDbResult(mockDb.select as jest.Mock, []);

      await expectDomainError(
        service.getCalendar(universityId, calendarId),
        NotFoundException,
        'Academic calendar not found',
      );
    });

    it('does not update a calendar outside the selected university', async () => {
      mockDbResult(mockDb.select as jest.Mock, []);

      await expect(
        service.updateCalendar(otherUniversityId, calendarId, { year: 2027 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('updates an academic calendar year without changing ownership', async () => {
      const updated = {
        ...calendar,
        year: 2027,
      };
      mockSequentialResults(mockDb.select as jest.Mock, [[calendar], []]);
      mockDbResult(mockDb.update as jest.Mock, [updated]);

      await expect(
        service.updateCalendar(universityId, calendarId, { year: 2027 }),
      ).resolves.toMatchObject({
        id: calendarId,
        universityId,
        year: 2027,
      });
    });

    it('deletes an authorized calendar', async () => {
      mockDbResult(mockDb.select as jest.Mock, [calendar]);
      mockDbResult(mockDb.delete as jest.Mock, [calendar]);

      await expect(
        service.deleteCalendar(universityId, calendarId),
      ).resolves.toEqual({ success: true });
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
            ...holiday,
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString(),
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
      mockSequentialResults(mockDb.select as jest.Mock, [
        [calendar],
        [{ id: restrictionId }],
      ]);

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

    it('does not update a restriction from another calendar', async () => {
      mockSequentialResults(mockDb.select as jest.Mock, [[calendar], []]);

      await expect(
        service.updateRestriction(universityId, calendarId, restrictionId, {
          type: 'PUBLIC_HOLIDAY',
          startDate: '2026-04-27',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('deletes only a restriction belonging to the parent calendar', async () => {
      mockDbResult(mockDb.select as jest.Mock, [calendar]);
      mockDbResult(mockDb.delete as jest.Mock, [holiday]);

      await expect(
        service.deleteRestriction(universityId, calendarId, restrictionId),
      ).resolves.toEqual({ success: true });
    });

    it('returns not found when a scoped restriction delete affects no row', async () => {
      mockDbResult(mockDb.select as jest.Mock, [calendar]);
      mockDbResult(mockDb.delete as jest.Mock, []);

      await expectDomainError(
        service.deleteRestriction(universityId, calendarId, restrictionId),
        NotFoundException,
        'Calendar restriction not found',
      );
    });
  });

  it.each([
    ['generateCalendar', () => service.generateCalendar({} as never)],
    ['getGeneratedCalendar', () => service.getGeneratedCalendar(calendarId)],
  ])('leaves %s explicitly unimplemented', (_name, invoke) => {
    expect(invoke).toThrow(NotImplementedException);
    try {
      void invoke();
    } catch (error) {
      expect((error as Error).message).toBe(
        'Academic calendar generation is not implemented yet',
      );
    }
  });

  it('maps unique-constraint races to the calendar conflict', async () => {
    mockDbResult(mockDb.select as jest.Mock, []);
    (mockDb.insert as jest.Mock).mockReturnValue(
      createDbChain(
        Promise.reject(
          Object.assign(new Error('unique constraint violation'), {
            code: '23505',
          }),
        ),
      ),
    );

    await expect(
      service.createCalendar(universityId, { year: 2026 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
