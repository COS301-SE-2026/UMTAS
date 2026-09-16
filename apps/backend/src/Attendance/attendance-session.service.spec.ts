import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../db/database.service';
import { EventService } from '../Events/event.service';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { mockTransaction } from '../Testing/Mocks/database.helpers';
import {
  createAttendanceSession,
  createAttendanceSessionDto,
  createSessionAttendance,
} from '../Testing/Factories';
import { AttendanceSessionService } from './attendance-session.service';

describe('AttendanceSessionService', () => {
  const { mockDb, reset } = createMockDatabase();
  const eventService = { getById: jest.fn() };
  let service: AttendanceSessionService;
  const actor = {
    userId: '11111111-1111-4111-8111-111111111111',
    uniRole: 'lecturer' as const,
    uniId: '22222222-2222-4222-8222-222222222222',
  };
  const moduleId = '33333333-3333-4333-8333-333333333333';
  const teachingSelects = (session = createAttendanceSession()) => [
    [session],
    [{ moduleID: moduleId }],
    [{ ModuleID: moduleId }],
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AttendanceSessionService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: EventService, useValue: eventService },
      ],
    }).compile();
    service = module.get(AttendanceSessionService);
    eventService.getById.mockResolvedValue({ event: {} });
  });

  afterEach(() => {
    reset();
    eventService.getById.mockReset();
  });

  it('creates an occurrence after confirming lecturer authority', async () => {
    const dto = createAttendanceSessionDto();
    const session = createAttendanceSession({ eventID: dto.eventID });
    mockTransaction(mockDb, {
      select: [[{ moduleID: moduleId }], [{ ModuleID: moduleId }], []],
      insert: [[session]],
    });

    const result = await service.createSession(actor, dto);
    expect(result.SessionID).toBe(session.SessionID);
    expect(result.attendedCount).toBe(0);
    expect(eventService.getById).toHaveBeenCalledWith(dto.eventID, mockDb);
  });

  it.each([
    {
      scheduledStartAt: '2026-09-15T10:00:00.000Z',
      scheduledEndAt: '2026-09-15T08:00:00.000Z',
    },
    {
      captureOpensAt: '2026-09-15T10:00:00.000Z',
      captureClosesAt: '2026-09-15T08:00:00.000Z',
    },
    { scheduledStartAt: 'invalid' },
  ])('rejects an invalid occurrence schedule: %j', async (override) => {
    mockTransaction(mockDb, {});
    await expect(
      service.createSession(actor, createAttendanceSessionDto(override)),
    ).rejects.toThrow(BadRequestException);
    expect(eventService.getById).not.toHaveBeenCalled();
  });

  it('rejects a duplicate event occurrence', async () => {
    const dto = createAttendanceSessionDto();
    mockTransaction(mockDb, {
      select: [
        [{ moduleID: moduleId }],
        [{ ModuleID: moduleId }],
        [{ SessionID: '55555555-5555-4555-8555-555555555555' }],
      ],
    });
    await expect(service.createSession(actor, dto)).rejects.toThrow(
      ConflictException,
    );
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('inserts the first aggregate count', async () => {
    const now = Date.now();
    const session = createAttendanceSession({
      state: 'OPEN',
      captureMode: 'AGGREGATE',
      captureOpensAt: new Date(now - 60_000),
      captureClosesAt: new Date(now + 60_000),
    });
    const attendance = createSessionAttendance({
      SessionID: session.SessionID,
      UserID: null,
      guestCount: 7,
    });
    mockTransaction(mockDb, {
      select: [...teachingSelects(session), []],
      insert: [[attendance]],
    });
    const result = await service.setGuestCount(actor, session.SessionID, {
      guestCount: 7,
    });
    expect(result.guestCount).toBe(7);
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('replaces an existing aggregate count without adding another row', async () => {
    const now = Date.now();
    const session = createAttendanceSession({
      state: 'OPEN',
      captureMode: 'AGGREGATE',
      captureOpensAt: new Date(now - 60_000),
      captureClosesAt: new Date(now + 60_000),
    });
    const oldAttendance = createSessionAttendance({
      SessionID: session.SessionID,
      UserID: null,
      guestCount: 4,
    });
    mockTransaction(mockDb, {
      select: [...teachingSelects(session), [oldAttendance]],
      update: [[{ ...oldAttendance, guestCount: 9 }]],
    });
    const result = await service.setGuestCount(actor, session.SessionID, {
      guestCount: 9,
    });
    expect(result.guestCount).toBe(9);
    expect(mockDb.update).toHaveBeenCalledTimes(1);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('returns the current user’s verified identified rows', async () => {
    const attendance = createSessionAttendance({ UserID: actor.userId });
    mockTransaction(mockDb, { select: [[attendance]] });
    const result = await service.getOwnVerifiedHistory(actor);
    expect(result.attendanceList).toEqual([attendance]);
  });

  it('auto-closes an expired open session when read', async () => {
    const now = Date.now();
    const session = createAttendanceSession({
      state: 'OPEN',
      captureClosesAt: new Date(now - 60_000),
    });
    const closed = {
      ...session,
      state: 'CLOSED' as const,
      closedAt: new Date(now),
    };
    mockTransaction(mockDb, {
      select: [...teachingSelects(session), []],
      update: [[closed]],
    });
    const result = await service.getSession(actor, session.SessionID);
    expect(result.state).toBe('CLOSED');
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['closeSession', 'OPEN', 'CLOSED'],
    ['cancelSession', 'SCHEDULED', 'CANCELLED'],
  ] as const)('%s transitions %s to %s', async (method, current, target) => {
    const session = createAttendanceSession({
      state: current,
      captureClosesAt: new Date(Date.now() + 60_000),
    });
    const updated = { ...session, state: target };
    mockTransaction(mockDb, {
      select: [...teachingSelects(session), []],
      update: [[updated]],
    });
    const result = await service[method](actor, session.SessionID);
    expect(result.state).toBe(target);
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['openSession', 'OPEN'],
    ['closeSession', 'CLOSED'],
    ['cancelSession', 'CANCELLED'],
  ] as const)('%s is idempotent in %s state', async (method, state) => {
    const session = createAttendanceSession({
      state,
      captureClosesAt: new Date(Date.now() + 60_000),
    });
    mockTransaction(mockDb, { select: [...teachingSelects(session), []] });
    const result = await service[method](actor, session.SessionID);
    expect(result.state).toBe(state);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('rejects a lecturer unrelated to the module before opening', async () => {
    const session = createAttendanceSession({ state: 'SCHEDULED' });
    mockTransaction(mockDb, {
      select: [
        [session],
        [{ moduleID: '33333333-3333-4333-8333-333333333333' }],
        [],
      ],
    });

    await expect(service.openSession(actor, session.SessionID)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('rejects an admin whose selected university does not own the module', async () => {
    const session = createAttendanceSession({ state: 'SCHEDULED' });
    mockTransaction(mockDb, {
      select: [
        [session],
        [{ moduleID: '33333333-3333-4333-8333-333333333333' }],
        [{ universityId: '99999999-9999-4999-8999-999999999999' }],
        [],
      ],
    });

    await expect(
      service.openSession(
        { ...actor, uniRole: 'uni_admin' },
        session.SessionID,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('rejects capture before the session is open', async () => {
    const session = createAttendanceSession({ state: 'SCHEDULED' });
    mockTransaction(mockDb, {
      select: [
        [session],
        [{ moduleID: '33333333-3333-4333-8333-333333333333' }],
        [{ ModuleID: '33333333-3333-4333-8333-333333333333' }],
      ],
    });

    await expect(
      service.recordIdentifiedAttendance(actor, session.SessionID, {
        UserID: '44444444-4444-4444-8444-444444444444',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('returns ALREADY_RECORDED without inserting a second user row', async () => {
    const now = Date.now();
    const session = createAttendanceSession({
      state: 'OPEN',
      captureOpensAt: new Date(now - 60_000),
      captureClosesAt: new Date(now + 60_000),
    });
    const attendance = createSessionAttendance({
      SessionID: session.SessionID,
    });
    mockTransaction(mockDb, {
      select: [
        [session],
        [{ moduleID: '33333333-3333-4333-8333-333333333333' }],
        [{ ModuleID: '33333333-3333-4333-8333-333333333333' }],
        [{ moduleID: '33333333-3333-4333-8333-333333333333' }],
        [{ UserID: attendance.UserID }],
        [attendance],
      ],
    });

    const result = await service.recordIdentifiedAttendance(
      actor,
      session.SessionID,
      { UserID: attendance.UserID! },
    );
    expect(result.status).toBe('ALREADY_RECORDED');
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
