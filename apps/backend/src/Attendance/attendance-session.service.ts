import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { DatabaseService, type AppDatabase } from '../db/database.service';
import {
  AttendanceSession,
  type AttendanceSessionEntity,
  Course,
  Event,
  GroupModules,
  ModuleEnrollment,
  ModuleTeaches,
  SessionAttendance,
  type SessionAttendanceCaptureMethodType,
  type SessionAttendanceEntity,
  UniversityEvent,
} from '../entities';
import { EventService } from '../Events/event.service';
import type { UniRole } from '../auth/roles';
import {
  type AttendanceCaptureResultDto,
  type AttendanceSessionFiltersDto,
  type AttendanceSessionListResponseDto,
  type AttendanceSessionResponseDto,
  type CreateAttendanceSessionDto,
  type DeleteAttendanceSessionResponseDto,
  type RecordIdentifiedAttendanceDto,
  type SessionAttendanceResponseDto,
  type SetGuestCountDto,
  type UpdateAttendanceSessionDto,
  type VerifiedAttendanceHistoryResponseDto,
} from './dto/attendance-session.dto';

const CAPTURE_BUFFER_MS = 10 * 60_000;

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

    const schedule = this.validateSchedule(dto);
    await this.assertOperatorForEvent(actor, dto.eventID, tx);
    const existing = await this.findOccurrence(
      dto.eventID,
      schedule.scheduledStartAt,
      tx,
    );
    if (existing) {
      throw new ConflictException(
        'An attendance session already exists for this event occurrence',
      );
    }

    const [session] = await tx
      .insert(AttendanceSession)
      .values({ eventID: dto.eventID, ...schedule })
      .returning();
    return this.toSessionResponse(this.requireSession(session), []);
  }

  async listSessions(
    actor: AttendanceActor,
    filters: AttendanceSessionFiltersDto,
    tx: AppDatabase = this.dbService.db,
  ): Promise<AttendanceSessionListResponseDto> {
    const eventIds = await this.getOperatorEventIds(actor, tx);
    const visibleEventIds = filters.eventID
      ? eventIds.filter((eventId) => eventId === filters.eventID)
      : eventIds;
    if (!visibleEventIds.length) return { sessionList: [] };

    const sessions = await tx
      .select()
      .from(AttendanceSession)
      .where(inArray(AttendanceSession.eventID, visibleEventIds))
      .orderBy(desc(AttendanceSession.scheduledStartAt));
    const sessionList = await Promise.all(
      sessions.map(async (session) =>
        this.toSessionResponse(
          session,
          await this.getAttendanceRows(session.SessionID, tx),
        ),
      ),
    );
    return { sessionList };
  }

  async getSession(
    actor: AttendanceActor,
    sessionId: string,
    tx: AppDatabase = this.dbService.db,
  ): Promise<AttendanceSessionResponseDto> {
    const session = await this.getSessionEntity(sessionId, tx);
    await this.assertCanViewSession(actor, session, tx);
    return this.toSessionResponse(
      session,
      await this.getAttendanceRows(sessionId, tx),
    );
  }

  async updateSession(
    actor: AttendanceActor,
    sessionId: string,
    dto: UpdateAttendanceSessionDto,
    tx?: AppDatabase,
  ): Promise<AttendanceSessionResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.updateSession(actor, sessionId, dto, transaction),
      );
    }

    const current = await this.getLockedSession(sessionId, tx);
    await this.assertOperatorForEvent(actor, current.eventID, tx);
    const eventID = dto.eventID ?? current.eventID;
    if (eventID !== current.eventID) {
      await this.assertOperatorForEvent(actor, eventID, tx);
    }
    const schedule = this.validateSchedule({
      eventID,
      scheduledStartAt:
        dto.scheduledStartAt ?? current.scheduledStartAt.toISOString(),
      scheduledEndAt:
        dto.scheduledEndAt ?? current.scheduledEndAt.toISOString(),
    });
    const duplicate = await this.findOccurrence(
      eventID,
      schedule.scheduledStartAt,
      tx,
    );
    if (duplicate && duplicate.SessionID !== sessionId) {
      throw new ConflictException(
        'An attendance session already exists for this event occurrence',
      );
    }

    const [updated] = await tx
      .update(AttendanceSession)
      .set({ eventID, ...schedule, updatedAt: new Date() })
      .where(eq(AttendanceSession.SessionID, sessionId))
      .returning();
    const session = this.requireSession(updated);
    return this.toSessionResponse(
      session,
      await this.getAttendanceRows(sessionId, tx),
    );
  }

  async deleteSession(
    actor: AttendanceActor,
    sessionId: string,
    tx?: AppDatabase,
  ): Promise<DeleteAttendanceSessionResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.deleteSession(actor, sessionId, transaction),
      );
    }
    const session = await this.getLockedSession(sessionId, tx);
    await this.assertOperatorForEvent(actor, session.eventID, tx);
    const deleted = await tx
      .delete(AttendanceSession)
      .where(eq(AttendanceSession.SessionID, sessionId))
      .returning();
    return { success: deleted.length === 1 };
  }

  async createOrGetOccurrenceSession(
    operator: AttendanceActor,
    eventID: string,
    occurrence: { scheduledStartAt: Date; scheduledEndAt: Date },
    tx?: AppDatabase,
  ): Promise<AttendanceSessionEntity> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.createOrGetOccurrenceSession(
          operator,
          eventID,
          occurrence,
          transaction,
        ),
      );
    }
    if (occurrence.scheduledStartAt >= occurrence.scheduledEndAt) {
      throw new BadRequestException(
        'The event occurrence has an invalid time range',
      );
    }

    const [event] = await tx
      .select({ eventID: Event.eventID })
      .from(Event)
      .where(eq(Event.eventID, eventID))
      .for('update')
      .limit(1);
    if (!event) throw new NotFoundException('Event not found');
    await this.assertOperatorForEvent(operator, eventID, tx);

    const existing = await this.findOccurrence(
      eventID,
      occurrence.scheduledStartAt,
      tx,
      true,
    );
    if (existing) return existing;

    const [session] = await tx
      .insert(AttendanceSession)
      .values({ eventID, ...occurrence })
      .returning();
    return this.requireSession(session);
  }

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
    const session = await this.getLockedSession(sessionId, tx);
    await this.assertOperatorForEvent(actor, session.eventID, tx);
    await this.assertUserEnrolled(dto.UserID, session.eventID, tx);
    return this.insertIdentifiedAttendance(
      sessionId,
      dto.UserID,
      dto.captureMethod,
      tx,
    );
  }

  async recordAuthenticatedAttendance(
    actor: AttendanceActor,
    sessionId: string,
    captureMethod: Exclude<SessionAttendanceCaptureMethodType, 'CAMERA'>,
    tx?: AppDatabase,
  ): Promise<AttendanceCaptureResultDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.recordAuthenticatedAttendance(
          actor,
          sessionId,
          captureMethod,
          transaction,
        ),
      );
    }
    const session = await this.getLockedSession(sessionId, tx);
    this.assertCaptureAvailable(session);
    await this.assertUserEnrolled(actor.userId, session.eventID, tx);
    return this.insertIdentifiedAttendance(
      sessionId,
      actor.userId,
      captureMethod,
      tx,
    );
  }

  async incrementGuestAttendance(
    sessionId: string,
    captureMethod: Exclude<SessionAttendanceCaptureMethodType, 'CAMERA'>,
    tx?: AppDatabase,
  ): Promise<SessionAttendanceResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.incrementGuestAttendance(sessionId, captureMethod, transaction),
      );
    }
    const session = await this.getLockedSession(sessionId, tx);
    this.assertCaptureAvailable(session);
    const existing = await this.getGuestAttendance(sessionId, tx);
    const [attendance] = existing
      ? await tx
          .update(SessionAttendance)
          .set({
            guestCount: (existing.guestCount ?? 0) + 1,
            captureMethod,
            updatedAt: new Date(),
          })
          .where(eq(SessionAttendance.AttendanceID, existing.AttendanceID))
          .returning()
      : await tx
          .insert(SessionAttendance)
          .values({
            SessionID: sessionId,
            UserID: null,
            guestCount: 1,
            captureMethod,
          })
          .returning();
    return this.requireAttendance(attendance);
  }

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
    const session = await this.getLockedSession(sessionId, tx);
    await this.assertOperatorForEvent(actor, session.eventID, tx);
    if (dto.captureMethod === 'CAMERA') this.assertCaptureAvailable(session);
    const existing = await this.getGuestAttendance(sessionId, tx);
    const [attendance] = existing
      ? await tx
          .update(SessionAttendance)
          .set({
            guestCount: dto.guestCount,
            captureMethod: dto.captureMethod,
            updatedAt: new Date(),
          })
          .where(eq(SessionAttendance.AttendanceID, existing.AttendanceID))
          .returning()
      : await tx
          .insert(SessionAttendance)
          .values({
            SessionID: sessionId,
            UserID: null,
            guestCount: dto.guestCount,
            captureMethod: dto.captureMethod,
          })
          .returning();
    return this.requireAttendance(attendance);
  }

  async assertStudentEligible(
    userId: string,
    eventId: string,
    tx: AppDatabase,
  ): Promise<void> {
    return this.assertUserEnrolled(userId, eventId, tx);
  }

  async getOwnVerifiedHistory(
    actor: AttendanceActor,
    tx: AppDatabase = this.dbService.db,
  ): Promise<VerifiedAttendanceHistoryResponseDto> {
    const attendanceList = await tx
      .select()
      .from(SessionAttendance)
      .where(eq(SessionAttendance.UserID, actor.userId))
      .orderBy(desc(SessionAttendance.recordedAt));
    return { attendanceList };
  }

  private async insertIdentifiedAttendance(
    sessionId: string,
    userId: string,
    captureMethod: Exclude<SessionAttendanceCaptureMethodType, 'CAMERA'>,
    tx: AppDatabase,
  ): Promise<AttendanceCaptureResultDto> {
    const [existing] = await tx
      .select()
      .from(SessionAttendance)
      .where(
        and(
          eq(SessionAttendance.SessionID, sessionId),
          eq(SessionAttendance.UserID, userId),
        ),
      )
      .limit(1);
    if (existing) return { status: 'ALREADY_RECORDED', attendance: existing };

    const [attendance] = await tx
      .insert(SessionAttendance)
      .values({
        SessionID: sessionId,
        UserID: userId,
        guestCount: null,
        captureMethod,
      })
      .returning();
    return {
      status: 'RECORDED',
      attendance: this.requireAttendance(attendance),
    };
  }

  private async findOccurrence(
    eventID: string,
    scheduledStartAt: Date,
    tx: AppDatabase,
    lock = false,
  ): Promise<AttendanceSessionEntity | undefined> {
    const query = tx
      .select()
      .from(AttendanceSession)
      .where(
        and(
          eq(AttendanceSession.eventID, eventID),
          eq(AttendanceSession.scheduledStartAt, scheduledStartAt),
        ),
      );
    const rows = lock
      ? await query.for('update').limit(1)
      : await query.limit(1);
    return rows[0];
  }

  private async getSessionEntity(
    sessionId: string,
    tx: AppDatabase,
  ): Promise<AttendanceSessionEntity> {
    const [session] = await tx
      .select()
      .from(AttendanceSession)
      .where(eq(AttendanceSession.SessionID, sessionId))
      .limit(1);
    if (!session) throw new NotFoundException('Attendance session not found');
    return session;
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

  private assertCaptureAvailable(session: AttendanceSessionEntity): void {
    const now = Date.now();
    if (
      now < session.scheduledStartAt.getTime() - CAPTURE_BUFFER_MS ||
      now >= session.scheduledEndAt.getTime() + CAPTURE_BUFFER_MS
    ) {
      throw new BadRequestException(
        'Attendance is outside the event time window',
      );
    }
  }

  private async assertOperatorForEvent(
    actor: AttendanceActor,
    eventID: string,
    tx: AppDatabase,
  ): Promise<void> {
    await this.eventService.getById(eventID, tx);
    const [universityEvent] = await tx
      .select({ moduleID: UniversityEvent.moduleID })
      .from(UniversityEvent)
      .where(eq(UniversityEvent.eventID, eventID))
      .limit(1);
    if (!universityEvent?.moduleID) {
      throw new ForbiddenException(
        'Attendance requires a university module event',
      );
    }

    if (actor.uniRole === 'lecturer') {
      const [teaching] = await tx
        .select({ ModuleID: ModuleTeaches.ModuleID })
        .from(ModuleTeaches)
        .where(
          and(
            eq(ModuleTeaches.ModuleID, universityEvent.moduleID),
            eq(ModuleTeaches.UserID, actor.userId),
          ),
        )
        .limit(1);
      if (teaching) return;
      throw new ForbiddenException(
        'The lecturer is not assigned to this module',
      );
    }

    if (actor.uniRole === 'uni_admin' && actor.uniId) {
      const universityIds = await this.getModuleUniversityIds(
        universityEvent.moduleID,
        tx,
      );
      if (universityIds.includes(actor.uniId)) return;
      throw new ForbiddenException(
        'The event does not belong to the selected university',
      );
    }
    throw new ForbiddenException(
      'Only lecturers and university admins may manage attendance sessions',
    );
  }

  private async assertCanViewSession(
    actor: AttendanceActor,
    session: AttendanceSessionEntity,
    tx: AppDatabase,
  ): Promise<void> {
    if (actor.uniRole === 'student') {
      return this.assertUserEnrolled(actor.userId, session.eventID, tx);
    }
    return this.assertOperatorForEvent(actor, session.eventID, tx);
  }

  private async assertUserEnrolled(
    userId: string,
    eventID: string,
    tx: AppDatabase,
  ): Promise<void> {
    const [universityEvent] = await tx
      .select({ moduleID: UniversityEvent.moduleID })
      .from(UniversityEvent)
      .where(eq(UniversityEvent.eventID, eventID))
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

  private async getOperatorEventIds(
    actor: AttendanceActor,
    tx: AppDatabase,
  ): Promise<string[]> {
    if (!actor.uniId) throw new ForbiddenException('No university selected');
    if (actor.uniRole === 'lecturer') {
      const rows = await tx
        .select({ eventID: UniversityEvent.eventID })
        .from(ModuleTeaches)
        .innerJoin(
          UniversityEvent,
          eq(UniversityEvent.moduleID, ModuleTeaches.ModuleID),
        )
        .innerJoin(
          GroupModules,
          eq(GroupModules.ModuleID, ModuleTeaches.ModuleID),
        )
        .innerJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
        .where(
          and(
            eq(ModuleTeaches.UserID, actor.userId),
            eq(Course.UniversityID, actor.uniId),
          ),
        );
      return [
        ...new Set(rows.flatMap((row) => (row.eventID ? [row.eventID] : []))),
      ];
    }
    if (actor.uniRole === 'uni_admin') {
      const rows = await tx
        .select({ eventID: UniversityEvent.eventID })
        .from(UniversityEvent)
        .innerJoin(
          GroupModules,
          eq(GroupModules.ModuleID, UniversityEvent.moduleID),
        )
        .innerJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
        .where(eq(Course.UniversityID, actor.uniId));
      return [
        ...new Set(rows.flatMap((row) => (row.eventID ? [row.eventID] : []))),
      ];
    }
    throw new ForbiddenException(
      'Only lecturers and university admins may view attendance sessions',
    );
  }

  private async getModuleUniversityIds(
    moduleId: string,
    tx: AppDatabase,
  ): Promise<string[]> {
    const rows = await tx
      .select({ universityId: Course.UniversityID })
      .from(GroupModules)
      .innerJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
      .where(eq(GroupModules.ModuleID, moduleId));
    return [...new Set(rows.map((row) => row.universityId))];
  }

  private getAttendanceRows(
    sessionId: string,
    tx: AppDatabase,
  ): Promise<SessionAttendanceEntity[]> {
    return tx
      .select()
      .from(SessionAttendance)
      .where(eq(SessionAttendance.SessionID, sessionId));
  }

  private async getGuestAttendance(
    sessionId: string,
    tx: AppDatabase,
  ): Promise<SessionAttendanceEntity | undefined> {
    const [attendance] = await tx
      .select()
      .from(SessionAttendance)
      .where(
        and(
          eq(SessionAttendance.SessionID, sessionId),
          isNull(SessionAttendance.UserID),
        ),
      )
      .limit(1);
    return attendance;
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
      attendedCount: identifiedCount + guestCount,
    };
  }

  private requireSession(
    session: AttendanceSessionEntity | undefined,
  ): AttendanceSessionEntity {
    if (!session) {
      throw new InternalServerErrorException('Attendance session write failed');
    }
    return session;
  }

  private requireAttendance(
    attendance: SessionAttendanceEntity | undefined,
  ): SessionAttendanceEntity {
    if (!attendance) {
      throw new InternalServerErrorException('Attendance record write failed');
    }
    return attendance;
  }

  private validateSchedule(dto: CreateAttendanceSessionDto): {
    scheduledStartAt: Date;
    scheduledEndAt: Date;
  } {
    const scheduledStartAt = this.parseDate(
      dto.scheduledStartAt,
      'scheduledStartAt',
    );
    const scheduledEndAt = this.parseDate(dto.scheduledEndAt, 'scheduledEndAt');
    if (scheduledStartAt >= scheduledEndAt) {
      throw new BadRequestException(
        'scheduledStartAt must be before scheduledEndAt',
      );
    }
    return { scheduledStartAt, scheduledEndAt };
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO timestamp`);
    }
    return date;
  }
}
