import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EventSource } from '../Events/dto/event.types';
import { DatabaseService } from '../db/database.service';
import {
  createAttendanceSession,
  createSessionAttendance,
} from '../Testing/Factories';
import { mockTransaction } from '../Testing/Mocks/database.helpers';
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { AttendanceCaptureService } from './attendance-capture.service';
import { AttendanceSessionService } from './attendance-session.service';
import { NfcAttendanceService } from './nfc-attendance.service';

describe('AttendanceCaptureService', () => {
  const { mockDb, reset } = createMockDatabase();
  const sessionService = {
    assertStudentEligible: jest.fn(),
    createOrGetOccurrenceSession: jest.fn(),
    incrementGuestAttendance: jest.fn(),
    recordAuthenticatedAttendance: jest.fn(),
    recordIdentifiedAttendance: jest.fn(),
    setGuestCount: jest.fn(),
  };
  const nfcService = { authenticateTag: jest.fn() };
  const operator = {
    userId: '11111111-1111-4111-8111-111111111111',
    uniId: '22222222-2222-4222-8222-222222222222',
    uniRole: 'lecturer' as const,
  };
  const now = Date.now();
  const occurrence = {
    eventID: '33333333-3333-4333-8333-333333333333',
    eventName: 'Current lecture',
    moduleID: '44444444-4444-4444-8444-444444444444',
    moduleCode: 'COS301',
    moduleName: 'Software Engineering',
    eventCriteria: {
      eventSource: EventSource.UNIVERSITY,
      startTime: '08:00',
      endTime: '09:00',
    },
    isRecurring: false,
    scheduledStartAt: new Date(now - 60_000),
    scheduledEndAt: new Date(now + 60_000),
    venue: null,
  };
  const tag = {
    tagId: '55555555-5555-4555-8555-555555555555',
    ownerUserId: operator.userId,
    universityId: operator.uniId,
    tokenHash: 'a'.repeat(64),
    registeredAt: new Date(now),
    updatedAt: new Date(now),
  };
  let service: AttendanceCaptureService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AttendanceCaptureService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: AttendanceSessionService, useValue: sessionService },
        { provide: NfcAttendanceService, useValue: nfcService },
      ],
    }).compile();
    service = module.get(AttendanceCaptureService);
    Object.defineProperty(service, 'getOperator', {
      value: jest.fn().mockResolvedValue(operator),
    });
    Object.defineProperty(service, 'findOperatorOccurrences', {
      value: jest.fn().mockResolvedValue([occurrence]),
    });
    mockTransaction(mockDb, {});
    nfcService.authenticateTag.mockResolvedValue(tag);
  });

  afterEach(() => {
    reset();
    jest.clearAllMocks();
  });

  it('finds or creates a session and records an enrolled user', async () => {
    const actor = { ...operator, uniRole: 'student' as const };
    const session = createAttendanceSession({
      eventID: occurrence.eventID,
      scheduledStartAt: occurrence.scheduledStartAt,
      scheduledEndAt: occurrence.scheduledEndAt,
    });
    const attendance = createSessionAttendance({
      SessionID: session.SessionID,
      UserID: actor.userId,
      captureMethod: 'NFC',
    });
    sessionService.createOrGetOccurrenceSession.mockResolvedValue(session);
    sessionService.recordAuthenticatedAttendance.mockResolvedValue({
      status: 'RECORDED',
      attendance,
    });

    const result = await service.recordAttendance(actor, {
      captureMethod: 'NFC',
      tagId: tag.tagId,
      token: 'x'.repeat(32),
    });

    expect(result.status).toBe('RECORDED');
    expect(sessionService.createOrGetOccurrenceSession).toHaveBeenCalledWith(
      operator,
      occurrence.eventID,
      occurrence,
      mockDb,
    );
  });

  it('increments guest attendance when no user is signed in', async () => {
    const session = createAttendanceSession({ eventID: occurrence.eventID });
    const attendance = createSessionAttendance({
      SessionID: session.SessionID,
      UserID: null,
      guestCount: 1,
      captureMethod: 'NFC',
    });
    sessionService.createOrGetOccurrenceSession.mockResolvedValue(session);
    sessionService.incrementGuestAttendance.mockResolvedValue(attendance);

    const result = await service.recordAttendance(undefined, {
      captureMethod: 'NFC',
      tagId: tag.tagId,
      token: 'x'.repeat(32),
    });

    expect(result.status).toBe('RECORDED');
    expect(sessionService.incrementGuestAttendance).toHaveBeenCalledWith(
      session.SessionID,
      'NFC',
      mockDb,
    );
    expect(sessionService.assertStudentEligible).not.toHaveBeenCalled();
  });

  it('throws the enrolment error before creating a session', async () => {
    sessionService.assertStudentEligible.mockRejectedValue(
      new ForbiddenException('not enrolled'),
    );

    await expect(
      service.recordAttendance(
        { ...operator, uniRole: 'student' },
        {
          captureMethod: 'NFC',
          tagId: tag.tagId,
          token: 'x'.repeat(32),
        },
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(sessionService.createOrGetOccurrenceSession).not.toHaveBeenCalled();
  });

  it('records a barcode against the automatically resolved session', async () => {
    const session = createAttendanceSession({ eventID: occurrence.eventID });
    const result = {
      status: 'RECORDED',
      attendance: createSessionAttendance({ captureMethod: 'BARCODE' }),
    };
    sessionService.createOrGetOccurrenceSession.mockResolvedValue(session);
    sessionService.recordIdentifiedAttendance.mockResolvedValue(result);

    await expect(
      service.recordBarcodeAttendance(operator, {
        UserID: '66666666-6666-4666-8666-666666666666',
      }),
    ).resolves.toEqual(result);
  });

  it('replaces the camera count for the automatically resolved session', async () => {
    const session = createAttendanceSession({ eventID: occurrence.eventID });
    const attendance = createSessionAttendance({
      UserID: null,
      guestCount: 21,
      captureMethod: 'CAMERA',
    });
    sessionService.createOrGetOccurrenceSession.mockResolvedValue(session);
    sessionService.setGuestCount.mockResolvedValue(attendance);

    await expect(
      service.recordCameraAttendance(operator, { guestCount: 21 }),
    ).resolves.toEqual(attendance);
  });
});
