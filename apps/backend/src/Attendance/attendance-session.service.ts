import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { DatabaseService, AppDatabase } from '../db/database.service';
import {
  AttendanceSession,
  AttendanceSessionEntity,
  AttendanceSessionStateType,
  Course,
  GroupModules,
  ModuleEnrollment,
  ModuleTeaches,
  SessionAttendance,
  SessionAttendanceEntity,
  UniversityEvent,
} from '../entities';
import {
  AttendanceSessionResponseDto,
  AttendanceCaptureResultDto,
  CreateAttendanceSessionDto,
  RecordIdentifiedAttendanceDto,
  SessionAttendanceResponseDto,
  SetGuestCountDto,
  VerifiedAttendanceHistoryResponseDto,
} from './dto/attendance-session.dto';
import { EventService } from '../Events/event.service';
import type { UniRole } from '../auth/roles';

export interface AttendanceActor {
  userId: string;
  uniRole?: UniRole;
  uniId?: string;
}

@Injectable()
export class AttendanceSessionService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly eventService: EventService,
  ) {}

  async createSession(
    actor: AttendanceActor,
    dto: CreateAttendanceSessionDto,
    tx?: AppDatabase,
  ): Promise<AttendanceSessionResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.createSession(actor, dto, transaction),
      );
    }

    const dates = this.validateSchedule(dto);
    await this.assertOperatorForEvent(actor, dto.eventID, tx);

    const [existing] = await tx
      .select({ SessionID: AttendanceSession.SessionID })
      .from(AttendanceSession)
      .where(
        and(
          eq(AttendanceSession.eventID, dto.eventID),
          eq(AttendanceSession.scheduledStartAt, dates.scheduledStartAt),
        ),
      )
      .limit(1);
    if (existing) {
      throw new ConflictException(
        'An attendance session already exists for this event occurrence',
      );
    }

    const [session] = await tx
      .insert(AttendanceSession)
      .values({
        eventID: dto.eventID,
        ...dates,
        captureMode: dto.captureMode,
      })
      .returning();

    if (!session) {
      throw new InternalServerErrorException(
        'Failed to create attendance session',
      );
    }

    return this.toSessionResponse(session, []);
  }

  async getSession(
    actor: AttendanceActor,
    sessionId: string,
    tx?: AppDatabase,
  ): Promise<AttendanceSessionResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.getSession(actor, sessionId, transaction),
      );
    }

    let session = await this.getLockedSession(sessionId, tx);
    await this.assertCanViewSession(actor, session, tx);
    session = await this.reconcileExpiry(session, tx);
    const rows = await this.getAttendanceRows(session.SessionID, tx);
    return this.toSessionResponse(session, rows);
  }

  async openSession(
    actor: AttendanceActor,
    sessionId: string,
    tx?: AppDatabase,
  ): Promise<AttendanceSessionResponseDto> {
    return this.transitionSession(actor, sessionId, 'OPEN', tx);
  }

  async closeSession(
    actor: AttendanceActor,
    sessionId: string,
    tx?: AppDatabase,
  ): Promise<AttendanceSessionResponseDto> {
    return this.transitionSession(actor, sessionId, 'CLOSED', tx);
  }

  async cancelSession(
    actor: AttendanceActor,
    sessionId: string,
    tx?: AppDatabase,
  ): Promise<AttendanceSessionResponseDto> {
    return this.transitionSession(actor, sessionId, 'CANCELLED', tx);
  }

  /**
   * Generic manual identified capture. Protocol adapters can call this later
   * after resolving a protocol payload to an existing user ID.
   */
  async recordIdentifiedAttendance(
    actor: AttendanceActor,
    sessionId: string,
    dto: RecordIdentifiedAttendanceDto,
    tx?: AppDatabase,
  ): Promise<AttendanceCaptureResultDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.recordIdentifiedAttendance(actor, sessionId, dto, transaction),
      );
    }

    let session = await this.getLockedSession(sessionId, tx);
    await this.assertOperatorForEvent(actor, session.eventID, tx);
    session = await this.reconcileExpiry(session, tx);
    this.assertCaptureAllowed(session);
    if (session.captureMode !== 'IDENTIFIED') {
      throw new BadRequestException(
        'This session accepts aggregate attendance, not identified attendees',
      );
    }
    await this.assertUserEnrolled(dto.UserID, session.eventID, tx);

    const [existing] = await tx
      .select()
      .from(SessionAttendance)
      .where(
        and(
          eq(SessionAttendance.SessionID, session.SessionID),
          eq(SessionAttendance.UserID, dto.UserID),
        ),
      )
      .limit(1);
    if (existing) return { status: 'ALREADY_RECORDED', attendance: existing };

    const [attendance] = await tx
      .insert(SessionAttendance)
      .values({
        SessionID: session.SessionID,
        UserID: dto.UserID,
        captureMethod: 'MANUAL',
        guestCount: null,
      })
      .returning();
    if (!attendance) {
      throw new InternalServerErrorException(
        'Failed to record identified attendance',
      );
    }
    return { status: 'RECORDED', attendance };
  }

  /** Generic manual replacement of the one aggregate guest count row. */
  async setGuestCount(
    actor: AttendanceActor,
    sessionId: string,
    dto: SetGuestCountDto,
    tx?: AppDatabase,
  ): Promise<SessionAttendanceResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.setGuestCount(actor, sessionId, dto, transaction),
      );
    }

    let session = await this.getLockedSession(sessionId, tx);
    await this.assertOperatorForEvent(actor, session.eventID, tx);
    session = await this.reconcileExpiry(session, tx);
    this.assertCaptureAllowed(session);
    if (session.captureMode !== 'AGGREGATE') {
      throw new BadRequestException(
        'This session accepts identified attendance, not an aggregate count',
      );
    }

    const [existing] = await tx
      .select()
      .from(SessionAttendance)
      .where(
        and(
          eq(SessionAttendance.SessionID, session.SessionID),
          isNull(SessionAttendance.UserID),
        ),
      )
      .limit(1);

    const [attendance] = existing
      ? await tx
          .update(SessionAttendance)
          .set({
            guestCount: dto.guestCount,
            captureMethod: 'MANUAL',
            updatedAt: new Date(),
          })
          .where(eq(SessionAttendance.AttendanceID, existing.AttendanceID))
          .returning()
      : await tx
          .insert(SessionAttendance)
          .values({
            SessionID: session.SessionID,
            UserID: null,
            guestCount: dto.guestCount,
            captureMethod: 'MANUAL',
          })
          .returning();

    if (!attendance) {
      throw new InternalServerErrorException('Failed to set guest count');
    }
    return attendance;
  }

  async getOwnVerifiedHistory(
    actor: AttendanceActor,
    tx?: AppDatabase,
  ): Promise<VerifiedAttendanceHistoryResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.getOwnVerifiedHistory(actor, transaction),
      );
    }

    const attendance = await tx
      .select()
      .from(SessionAttendance)
      .where(eq(SessionAttendance.UserID, actor.userId))
      .orderBy(desc(SessionAttendance.recordedAt));
    return { attendanceList: attendance };
  }

  private async transitionSession(
    actor: AttendanceActor,
    sessionId: string,
    target: Extract<
      AttendanceSessionStateType,
      'OPEN' | 'CLOSED' | 'CANCELLED'
    >,
    tx?: AppDatabase,
  ): Promise<AttendanceSessionResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.transitionSession(actor, sessionId, target, transaction),
      );
    }

    let session = await this.getLockedSession(sessionId, tx);
    await this.assertOperatorForEvent(actor, session.eventID, tx);
    session = await this.reconcileExpiry(session, tx);
    const now = new Date();

    if (target === 'OPEN') {
      if (session.state === 'OPEN') {
        const rows = await this.getAttendanceRows(session.SessionID, tx);
        return this.toSessionResponse(session, rows);
      }
      if (session.state !== 'SCHEDULED') {
        throw new BadRequestException(
          `Cannot open a ${session.state.toLowerCase()} attendance session`,
        );
      }
      if (now >= session.captureClosesAt) {
        throw new BadRequestException('The capture window has already closed');
      }
      const [updated] = await tx
        .update(AttendanceSession)
        .set({ state: 'OPEN', openedAt: now, updatedAt: now })
        .where(eq(AttendanceSession.SessionID, session.SessionID))
        .returning();
      session = this.requireUpdatedSession(updated);
    } else if (target === 'CLOSED') {
      if (session.state === 'CLOSED') {
        const rows = await this.getAttendanceRows(session.SessionID, tx);
        return this.toSessionResponse(session, rows);
      }
      if (session.state !== 'OPEN') {
        throw new BadRequestException(
          `Cannot close a ${session.state.toLowerCase()} attendance session`,
        );
      }
      const [updated] = await tx
        .update(AttendanceSession)
        .set({ state: 'CLOSED', closedAt: now, updatedAt: now })
        .where(eq(AttendanceSession.SessionID, session.SessionID))
        .returning();
      session = this.requireUpdatedSession(updated);
    } else {
      if (session.state === 'CANCELLED') {
        const rows = await this.getAttendanceRows(session.SessionID, tx);
        return this.toSessionResponse(session, rows);
      }
      if (session.state === 'CLOSED') {
        throw new BadRequestException('A closed session cannot be cancelled');
      }
      const [updated] = await tx
        .update(AttendanceSession)
        .set({ state: 'CANCELLED', closedAt: now, updatedAt: now })
        .where(eq(AttendanceSession.SessionID, session.SessionID))
        .returning();
      session = this.requireUpdatedSession(updated);
    }

    const rows = await this.getAttendanceRows(session.SessionID, tx);
    return this.toSessionResponse(session, rows);
  }

  private async getLockedSession(
    sessionId: string,
    tx: AppDatabase,
  ): Promise<AttendanceSessionEntity> {
    const [session] = await tx
      .select()
      .from(AttendanceSession)
      .where(eq(AttendanceSession.SessionID, sessionId))
      .for('update')
      .limit(1);
    if (!session) throw new NotFoundException('Attendance session not found');
    return session;
  }

  private async reconcileExpiry(
    session: AttendanceSessionEntity,
    tx: AppDatabase,
  ): Promise<AttendanceSessionEntity> {
    if (session.state !== 'OPEN' || new Date() < session.captureClosesAt) {
      return session;
    }
    const now = new Date();
    const [closed] = await tx
      .update(AttendanceSession)
      .set({ state: 'CLOSED', closedAt: now, updatedAt: now })
      .where(
        and(
          eq(AttendanceSession.SessionID, session.SessionID),
          eq(AttendanceSession.state, 'OPEN'),
        ),
      )
      .returning();
    return (
      closed ?? { ...session, state: 'CLOSED', closedAt: now, updatedAt: now }
    );
  }

  private assertCaptureAllowed(session: AttendanceSessionEntity): void {
    const now = new Date();
    if (session.state !== 'OPEN') {
      throw new BadRequestException(
        `Attendance capture is unavailable while the session is ${session.state.toLowerCase()}`,
      );
    }
    if (now < session.captureOpensAt || now >= session.captureClosesAt) {
      throw new BadRequestException('Attendance capture is outside its window');
    }
  }

  private async assertOperatorForEvent(
    actor: AttendanceActor,
    eventId: string,
    tx: AppDatabase,
  ): Promise<string | null> {
    await this.eventService.getById(eventId, tx);

    const [universityEvent] = await tx
      .select({ moduleID: UniversityEvent.moduleID })
      .from(UniversityEvent)
      .where(eq(UniversityEvent.eventID, eventId))
      .limit(1);
    const moduleId = universityEvent?.moduleID;
    const role = actor.uniRole;

    if (!moduleId) {
      throw new ForbiddenException(
        'Attendance sessions require a university module event',
      );
    }

    if (role === 'lecturer') {
      const [teaching] = await tx
        .select({ ModuleID: ModuleTeaches.ModuleID })
        .from(ModuleTeaches)
        .where(
          and(
            eq(ModuleTeaches.ModuleID, moduleId),
            eq(ModuleTeaches.UserID, actor.userId),
          ),
        )
        .limit(1);
      if (!teaching) {
        throw new ForbiddenException(
          'The lecturer is not assigned to this module',
        );
      }
      return moduleId;
    }

    if (role === 'uni_admin') {
      if (!actor.uniId) {
        throw new ForbiddenException('No active university selected');
      }
      const universityIds = await this.getModuleUniversityIds(moduleId, tx);
      if (!universityIds.includes(actor.uniId)) {
        throw new ForbiddenException(
          'The event does not belong to the selected university',
        );
      }
      return moduleId;
    }

    throw new ForbiddenException(
      'Only lecturers and university admins may operate attendance sessions',
    );
  }

  private async assertCanViewSession(
    actor: AttendanceActor,
    session: AttendanceSessionEntity,
    tx: AppDatabase,
  ): Promise<void> {
    const role = actor.uniRole;
    if (role === 'lecturer' || role === 'uni_admin') {
      await this.assertOperatorForEvent(actor, session.eventID, tx);
      return;
    }
    if (role === 'student') {
      await this.assertUserEnrolled(actor.userId, session.eventID, tx);
      return;
    }
    throw new ForbiddenException('You may not view this attendance session');
  }

  private async assertUserEnrolled(
    userId: string,
    eventId: string,
    tx: AppDatabase,
  ): Promise<void> {
    const [universityEvent] = await tx
      .select({ moduleID: UniversityEvent.moduleID })
      .from(UniversityEvent)
      .where(eq(UniversityEvent.eventID, eventId))
      .limit(1);
    if (!universityEvent?.moduleID) {
      throw new ForbiddenException('The event is not attached to a module');
    }
    const [enrollment] = await tx
      .select({ UserID: ModuleEnrollment.UserID })
      .from(ModuleEnrollment)
      .where(
        and(
          eq(ModuleEnrollment.ModuleID, universityEvent.moduleID),
          eq(ModuleEnrollment.UserID, userId),
        ),
      )
      .limit(1);
    if (!enrollment) {
      throw new ForbiddenException(
        'The attendee is not enrolled in this event module',
      );
    }
  }

  private async getModuleUniversityIds(
    moduleId: string,
    tx: AppDatabase,
  ): Promise<string[]> {
    const courseLinks = await tx
      .select({ universityId: Course.UniversityID })
      .from(GroupModules)
      .innerJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
      .where(eq(GroupModules.ModuleID, moduleId));
    return Array.from(
      new Set(courseLinks.map(({ universityId }) => universityId)),
    );
  }

  private async getAttendanceRows(
    sessionId: string,
    tx: AppDatabase,
  ): Promise<SessionAttendanceEntity[]> {
    return tx
      .select()
      .from(SessionAttendance)
      .where(eq(SessionAttendance.SessionID, sessionId));
  }

  private toSessionResponse(
    session: AttendanceSessionEntity,
    rows: SessionAttendanceEntity[],
  ): AttendanceSessionResponseDto {
    const identifiedCount = rows.filter((row) => row.UserID !== null).length;
    const guestCount = rows.find((row) => row.UserID === null)?.guestCount ?? 0;
    return {
      ...session,
      identifiedCount,
      guestCount,
      attendedCount:
        session.captureMode === 'AGGREGATE' ? guestCount : identifiedCount,
    };
  }

  private requireUpdatedSession(
    session: AttendanceSessionEntity | undefined,
  ): AttendanceSessionEntity {
    if (!session) {
      throw new InternalServerErrorException(
        'Attendance session update returned no row',
      );
    }
    return session;
  }

  private validateSchedule(dto: CreateAttendanceSessionDto): {
    scheduledStartAt: Date;
    scheduledEndAt: Date;
    captureOpensAt: Date;
    captureClosesAt: Date;
  } {
    const dates = {
      scheduledStartAt: this.parseDate(
        dto.scheduledStartAt,
        'scheduledStartAt',
      ),
      scheduledEndAt: this.parseDate(dto.scheduledEndAt, 'scheduledEndAt'),
      captureOpensAt: this.parseDate(dto.captureOpensAt, 'captureOpensAt'),
      captureClosesAt: this.parseDate(dto.captureClosesAt, 'captureClosesAt'),
    };
    if (dates.scheduledStartAt >= dates.scheduledEndAt) {
      throw new BadRequestException(
        'scheduledStartAt must be before scheduledEndAt',
      );
    }
    if (dates.captureOpensAt >= dates.captureClosesAt) {
      throw new BadRequestException(
        'captureOpensAt must be before captureClosesAt',
      );
    }
    return dates;
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO timestamp`);
    }
    return date;
  }
}
