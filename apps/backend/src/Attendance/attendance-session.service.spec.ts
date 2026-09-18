import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../db/database.service';
import { EventService } from '../Events/event.service';
import {
  createAttendanceSession,
  createAttendanceSessionDto,
  createSessionAttendance,
} from '../Testing/Factories';
import {
  mockSequentialResults,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { AttendanceSessionService } from './attendance-session.service';

describe('AttendanceSessionService', () => {
  const { mockDb, reset } = createMockDatabase();
  const eventService = { getById: jest.fn() };
  const actor = {
    userId: '11111111-1111-4111-8111-111111111111',
    uniRole: 'lecturer' as const,
    uniId: '22222222-2222-4222-8222-222222222222',
  };
  const moduleId = '33333333-3333-4333-8333-333333333333';
  let service: AttendanceSessionService;

  const currentSession = () => {
    const now = Date.now();
    return createAttendanceSession({
      scheduledStartAt: new Date(now - 60_000),
      scheduledEndAt: new Date(now + 60_000),
    });
  };

  const operatorChecks = () => [
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

  it('creates a dated occurrence after checking operator authority', async () => {
    const dto = createAttendanceSessionDto();
    const session = createAttendanceSession({ eventID: dto.eventID });
    mockTransaction(mockDb, {
      select: [...operatorChecks(), []],
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
        ...operatorChecks(),
        [createAttendanceSession({ eventID: dto.eventID })],
      ],
    });
    await expect(service.createSession(actor, dto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('records an enrolled attendee once', async () => {
    const session = currentSession();
    const attendance = createSessionAttendance({
      SessionID: session.SessionID,
      UserID: actor.userId,
      captureMethod: 'NFC',
    });
    mockTransaction(mockDb, {
      select: [
        [session],
        [{ moduleID: moduleId }],
        [{ UserID: actor.userId }],
        [],
      ],
      insert: [[attendance]],
    });

    const result = await service.recordAuthenticatedAttendance(
      actor,
      session.SessionID,
      'NFC',
    );

    expect(result).toEqual({ status: 'RECORDED', attendance });
  });

  it('rejects identified capture outside the event buffer', async () => {
    const session = createAttendanceSession({
      scheduledStartAt: new Date(Date.now() - 30 * 60_000),
      scheduledEndAt: new Date(Date.now() - 20 * 60_000),
    });
    mockTransaction(mockDb, { select: [[session]] });

    await expect(
      service.recordAuthenticatedAttendance(actor, session.SessionID, 'NFC'),
    ).rejects.toThrow(BadRequestException);
  });

  it('increments the single anonymous row', async () => {
    const session = currentSession();
    const existing = createSessionAttendance({
      SessionID: session.SessionID,
      UserID: null,
      guestCount: 3,
      captureMethod: 'NFC',
    });
    mockTransaction(mockDb, {
      select: [[session], [existing]],
      update: [[{ ...existing, guestCount: 4 }]],
    });

    const result = await service.incrementGuestAttendance(
      session.SessionID,
      'NFC',
    );

    expect(result.guestCount).toBe(4);
    expect(mockDb.update.mock.calls).toHaveLength(1);
  });

  it('replaces the camera headcount during the event window', async () => {
    const session = currentSession();
    const attendance = createSessionAttendance({
      SessionID: session.SessionID,
      UserID: null,
      guestCount: 7,
      captureMethod: 'CAMERA',
    });
    mockTransaction(mockDb, {
      select: [[session], ...operatorChecks(), []],
      insert: [[attendance]],
    });

    const result = await service.setGuestCount(actor, session.SessionID, {
      guestCount: 7,
      captureMethod: 'CAMERA',
    });

    expect(result).toEqual(attendance);
  });

  it('allows a manual historical count correction', async () => {
    const session = createAttendanceSession();
    const existing = createSessionAttendance({
      SessionID: session.SessionID,
      UserID: null,
      guestCount: 2,
    });
    mockTransaction(mockDb, {
      select: [[session], ...operatorChecks(), [existing]],
      update: [[{ ...existing, guestCount: 5 }]],
    });

    const result = await service.setGuestCount(actor, session.SessionID, {
      guestCount: 5,
      captureMethod: 'MANUAL',
    });

    expect(result.guestCount).toBe(5);
  });

  it('returns identified and guest attendance as one total', async () => {
    const session = createAttendanceSession();
    const rows = [
      createSessionAttendance({ SessionID: session.SessionID }),
      createSessionAttendance({
        SessionID: session.SessionID,
        UserID: null,
        guestCount: 4,
      }),
    ];
    mockSequentialResults(mockDb.select, [
      [session],
      ...operatorChecks(),
      rows,
    ]);

    const result = await service.getSession(actor, session.SessionID, mockDb);

    expect(result.identifiedCount).toBe(1);
    expect(result.guestCount).toBe(4);
    expect(result.attendedCount).toBe(5);
  });

  it('rejects manual recording by an unrelated lecturer', async () => {
    const session = createAttendanceSession();
    mockTransaction(mockDb, {
      select: [[session], [{ moduleID: moduleId }], []],
    });

    await expect(
      service.recordIdentifiedAttendance(actor, session.SessionID, {
        UserID: actor.userId,
        captureMethod: 'MANUAL',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
