import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { and, eq, gte, inArray, lt } from 'drizzle-orm';
import { DatabaseService, type AppDatabase } from '../db/database.service';
import {
  AttendanceSession,
  Course,
  Event,
  EventVenue,
  GroupModules,
  ModuleTeaches,
  SessionAttendance,
  UniversityEvent,
  UniversityRole,
  Venue,
  modules,
} from '../entities';
import type { EventCriteria } from '../Events/dto/event.types';
import type { AttendanceActor } from './attendance-session.service';
import { AttendancePreferenceService } from './attendance-preference.service';
import { AttendanceSessionService } from './attendance-session.service';
import {
  AttendanceRecordStatus,
  type AttendanceRecordResponseDto,
  type RecordBarcodeAttendanceDto,
  type RecordCameraAttendanceDto,
  type RecordAttendanceDto,
  type AttendanceCaptureResultDto,
  type SessionAttendanceResponseDto,
} from './dto/attendance-session.dto';
import type {
  OperatorAttendanceSlotDto,
  OperatorAttendanceSlotsResponseDto,
  SelectPreferredEventDto,
} from './dto/nfc-attendance.dto';
import {
  attendanceAvailable,
  localDateAt,
  localDayBounds,
  occurrenceOnLocalDate,
} from './attendance-occurrence';
import { NfcAttendanceService } from './nfc-attendance.service';

const ATTENDANCE_TIME_ZONE =
  process.env.ATTENDANCE_TIME_ZONE ?? 'Africa/Johannesburg';

interface EventOccurrenceRow {
  eventID: string;
  eventName: string;
  moduleID: string;
  moduleCode: string;
  moduleName: string;
  eventCriteria: EventCriteria;
  isRecurring: boolean;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  venue: string | null;
}

@Injectable()
export class AttendanceCaptureService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly attendanceSessionService: AttendanceSessionService,
    private readonly attendancePreferenceService: AttendancePreferenceService,
    private readonly nfcService: NfcAttendanceService,
  ) {}

  async getOperatorSlots(
    actor: AttendanceActor,
    date = localDateAt(new Date(), ATTENDANCE_TIME_ZONE),
    tx: AppDatabase = this.dbService.db,
  ): Promise<OperatorAttendanceSlotsResponseDto> {
    this.assertOperator(actor);
    if (!actor.uniId) {
      throw new ForbiddenException(
        'Select a university to view attendance slots',
      );
    }

    const occurrences = await this.findOperatorOccurrences(
      actor.userId,
      actor.uniId,
      actor.uniRole === 'uni_admin',
      date,
      tx,
    );
    const eventIds = [...new Set(occurrences.map((row) => row.eventID))];
    const bounds = localDayBounds(date, ATTENDANCE_TIME_ZONE);
    const sessions =
      eventIds.length && bounds
        ? await tx
            .select()
            .from(AttendanceSession)
            .where(
              and(
                inArray(AttendanceSession.eventID, eventIds),
                gte(AttendanceSession.scheduledStartAt, bounds.start),
                lt(AttendanceSession.scheduledStartAt, bounds.end),
              ),
            )
        : [];
    const sessionByOccurrence = new Map(
      sessions.map((session) => [
        this.occurrenceKey(session.eventID, session.scheduledStartAt),
        session,
      ]),
    );
    const sessionIds = sessions.map((session) => session.SessionID);
    const attendanceRows = sessionIds.length
      ? await tx
          .select({
            SessionID: SessionAttendance.SessionID,
            UserID: SessionAttendance.UserID,
            guestCount: SessionAttendance.guestCount,
          })
          .from(SessionAttendance)
          .where(inArray(SessionAttendance.SessionID, sessionIds))
      : [];
    const counts = new Map<string, number>();
    for (const row of attendanceRows) {
      counts.set(
        row.SessionID,
        (counts.get(row.SessionID) ?? 0) +
          (row.UserID ? 1 : (row.guestCount ?? 0)),
      );
    }

    const now = new Date();
    const slotList = occurrences.map(
      (occurrence): OperatorAttendanceSlotDto => {
        const session = sessionByOccurrence.get(
          this.occurrenceKey(occurrence.eventID, occurrence.scheduledStartAt),
        );
        return {
          eventID: occurrence.eventID,
          eventName: occurrence.eventName,
          moduleID: occurrence.moduleID,
          moduleCode: occurrence.moduleCode,
          moduleName: occurrence.moduleName,
          venue: occurrence.venue,
          scheduledStartAt: occurrence.scheduledStartAt,
          scheduledEndAt: occurrence.scheduledEndAt,
          sessionId: session?.SessionID ?? null,
          state: attendanceAvailable(occurrence, now)
            ? 'AVAILABLE'
            : now < occurrence.scheduledStartAt
              ? 'UPCOMING'
              : 'ENDED',
          attendanceCount: session ? (counts.get(session.SessionID) ?? 0) : 0,
        };
      },
    );
    const availableOccurrences = occurrences.filter((occurrence) =>
      attendanceAvailable(occurrence, now),
    );
    const preference = await this.attendancePreferenceService.getPreference(
      actor.userId,
      actor.uniId,
      tx,
    );
    const resolvedOccurrence = this.resolveOccurrence(
      availableOccurrences,
      preference?.preferredEventId ?? null,
    );
    const resolvedSlot = resolvedOccurrence
      ? (slotList.find(
          (slot) =>
            this.occurrenceKey(
              slot.eventID,
              new Date(slot.scheduledStartAt),
            ) ===
            this.occurrenceKey(
              resolvedOccurrence.eventID,
              resolvedOccurrence.scheduledStartAt,
            ),
        ) ?? null)
      : null;
    return {
      slotList,
      currentSlot: resolvedSlot,
      preferredEventId: preference?.preferredEventId ?? null,
      requiresSelection:
        availableOccurrences.length > 1 && resolvedOccurrence === null,
    };
  }

  async selectPreferredEvent(
    actor: AttendanceActor,
    dto: SelectPreferredEventDto,
    tx?: AppDatabase,
  ): Promise<OperatorAttendanceSlotDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.selectPreferredEvent(actor, dto, transaction),
      );
    }
    this.assertOperator(actor);
    if (!actor.uniId) throw new ForbiddenException('No university selected');

    const date = localDateAt(new Date(), ATTENDANCE_TIME_ZONE);
    const occurrences = await this.findOperatorOccurrences(
      actor.userId,
      actor.uniId,
      actor.uniRole === 'uni_admin',
      date,
      tx,
    );
    const selected = occurrences.find(
      (occurrence) => occurrence.eventID === dto.eventID,
    );
    if (!selected) {
      throw new ForbiddenException(
        'This attendance slot is not assigned to the current operator',
      );
    }
    const now = new Date();
    if (
      !attendanceAvailable(selected, now) &&
      now >= selected.scheduledStartAt
    ) {
      throw new BadRequestException('This attendance event has ended');
    }

    await this.attendancePreferenceService.setPreferredEvent(
      actor.userId,
      actor.uniId,
      selected.eventID,
      tx,
    );
    const overview = await this.getOperatorSlots(actor, date, tx);
    const slot = overview.slotList.find(
      (candidate) =>
        candidate.eventID === selected.eventID &&
        new Date(candidate.scheduledStartAt).getTime() ===
          selected.scheduledStartAt.getTime(),
    );
    if (!slot) throw new BadRequestException('Attendance slot unavailable');
    return slot;
  }

  async clearPreferredEvent(
    actor: AttendanceActor,
    tx: AppDatabase = this.dbService.db,
  ): Promise<void> {
    this.assertOperator(actor);
    if (!actor.uniId) throw new ForbiddenException('No university selected');
    await this.attendancePreferenceService.clearPreference(
      actor.userId,
      actor.uniId,
      tx,
    );
  }

  async recordAttendance(
    actor: AttendanceActor | undefined,
    dto: RecordAttendanceDto,
    tx?: AppDatabase,
  ): Promise<AttendanceRecordResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.recordAttendance(actor, dto, transaction),
      );
    }

    const tag = await this.nfcService.authenticateTag(dto, tx);
    if (!tag) {
      return {
        status: AttendanceRecordStatus.INVALID_TAG,
        message: 'This sticker is unknown or has been replaced.',
      };
    }
    const operator = await this.getOperator(
      tag.ownerUserId,
      tag.universityId,
      tx,
    );
    if (!operator) {
      return {
        status: AttendanceRecordStatus.INVALID_TAG,
        message:
          'This sticker is no longer registered to an attendance operator.',
      };
    }

    const occurrences = await this.findOperatorOccurrences(
      operator.userId,
      tag.universityId,
      operator.uniRole === 'uni_admin',
      localDateAt(new Date(), ATTENDANCE_TIME_ZONE),
      tx,
    );
    const available = occurrences.filter((occurrence) =>
      attendanceAvailable(occurrence),
    );
    if (!available.length) {
      return {
        status: AttendanceRecordStatus.NO_CURRENT_EVENT,
        message: 'There is no attendance slot available for this sticker.',
      };
    }
    const preference = await this.attendancePreferenceService.getPreference(
      operator.userId,
      tag.universityId,
      tx,
    );
    const occurrence = this.resolveOccurrence(
      available,
      preference?.preferredEventId ?? null,
    );
    if (!occurrence) {
      return {
        status: AttendanceRecordStatus.AMBIGUOUS_EVENT,
        message:
          'The lecturer must choose the current class on their attendance page.',
      };
    }
    if (actor) {
      await this.attendanceSessionService.assertStudentEligible(
        actor.userId,
        occurrence.eventID,
        tx,
      );
    }

    const session =
      await this.attendanceSessionService.createOrGetOccurrenceSession(
        operator,
        occurrence.eventID,
        occurrence,
        tx,
      );
    if (!actor) {
      const attendance =
        await this.attendanceSessionService.incrementGuestAttendance(
          session.SessionID,
          dto.captureMethod,
          tx,
        );
      return {
        status: AttendanceRecordStatus.RECORDED,
        message: 'Guest attendance recorded.',
        sessionId: session.SessionID,
        recordedAt: attendance.updatedAt,
      };
    }

    const result =
      await this.attendanceSessionService.recordAuthenticatedAttendance(
        actor,
        session.SessionID,
        dto.captureMethod,
        tx,
      );
    return {
      status:
        result.status === 'RECORDED'
          ? AttendanceRecordStatus.RECORDED
          : AttendanceRecordStatus.ALREADY_RECORDED,
      message:
        result.status === 'RECORDED'
          ? 'Attendance recorded.'
          : 'Your attendance was already recorded.',
      sessionId: session.SessionID,
      recordedAt: result.attendance.recordedAt,
    };
  }

  async recordBarcodeAttendance(
    actor: AttendanceActor,
    dto: RecordBarcodeAttendanceDto,
    tx?: AppDatabase,
  ): Promise<AttendanceCaptureResultDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.recordBarcodeAttendance(actor, dto, transaction),
      );
    }
    const occurrence = await this.getAvailableOperatorOccurrence(actor, tx);
    const session =
      await this.attendanceSessionService.createOrGetOccurrenceSession(
        actor,
        occurrence.eventID,
        occurrence,
        tx,
      );
    return this.attendanceSessionService.recordIdentifiedAttendance(
      actor,
      session.SessionID,
      { UserID: dto.UserID, captureMethod: 'BARCODE' },
      tx,
    );
  }

  async recordCameraAttendance(
    actor: AttendanceActor,
    dto: RecordCameraAttendanceDto,
    tx?: AppDatabase,
  ): Promise<SessionAttendanceResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction((transaction: AppDatabase) =>
        this.recordCameraAttendance(actor, dto, transaction),
      );
    }
    const occurrence = await this.getAvailableOperatorOccurrence(
      actor,
      tx,
      dto.eventID,
    );
    const session =
      await this.attendanceSessionService.createOrGetOccurrenceSession(
        actor,
        occurrence.eventID,
        occurrence,
        tx,
      );
    return this.attendanceSessionService.setGuestCount(
      actor,
      session.SessionID,
      { guestCount: dto.guestCount, captureMethod: 'CAMERA' },
      tx,
    );
  }

  private assertOperator(actor: AttendanceActor): void {
    if (actor.uniRole !== 'lecturer' && actor.uniRole !== 'uni_admin') {
      throw new ForbiddenException(
        'Only lecturers and university admins may manage attendance',
      );
    }
  }

  private async getAvailableOperatorOccurrence(
    actor: AttendanceActor,
    tx: AppDatabase,
    eventID?: string,
  ): Promise<EventOccurrenceRow> {
    this.assertOperator(actor);
    if (!actor.uniId) throw new ForbiddenException('No university selected');
    const occurrences = await this.findOperatorOccurrences(
      actor.userId,
      actor.uniId,
      actor.uniRole === 'uni_admin',
      localDateAt(new Date(), ATTENDANCE_TIME_ZONE),
      tx,
    );
    let available = occurrences.filter((occurrence) =>
      attendanceAvailable(occurrence),
    );

    if (eventID) {
      available = available.filter(
        (occurrence) => occurrence.eventID === eventID,
      );
    }

    if (!available.length) {
      throw new BadRequestException('There is no attendance slot available');
    }
    const preference = await this.attendancePreferenceService.getPreference(
      actor.userId,
      actor.uniId,
      tx,
    );
    const occurrence = this.resolveOccurrence(
      available,
      preference?.preferredEventId ?? null,
    );
    if (!occurrence) {
      throw new BadRequestException(
        'The lecturer has more than one attendance slot available',
      );
    }
    return occurrence;
  }

  private resolveOccurrence(
    available: EventOccurrenceRow[],
    preferredEventId: string | null,
  ): EventOccurrenceRow | null {
    if (available.length === 1) return available[0];
    if (available.length <= 1 || !preferredEventId) return null;

    const preferred = available.filter(
      (occurrence) => occurrence.eventID === preferredEventId,
    );
    return preferred.length === 1 ? preferred[0] : null;
  }

  private async getOperator(
    userId: string,
    universityId: string,
    tx: AppDatabase,
  ): Promise<AttendanceActor | null> {
    const [role] = await tx
      .select({ role: UniversityRole.role })
      .from(UniversityRole)
      .where(
        and(
          eq(UniversityRole.UserID, userId),
          eq(UniversityRole.UniversityID, universityId),
        ),
      )
      .limit(1);
    if (role?.role === 'UNIVERSITY_ADMIN') {
      return { userId, uniId: universityId, uniRole: 'uni_admin' };
    }
    if (role?.role === 'LECTURER') {
      return { userId, uniId: universityId, uniRole: 'lecturer' };
    }
    if ((await this.getTaughtModuleIds(userId, universityId, tx)).length) {
      return { userId, uniId: universityId, uniRole: 'lecturer' };
    }
    return null;
  }

  private async findOperatorOccurrences(
    userId: string,
    universityId: string,
    isAdmin: boolean,
    date: string,
    tx: AppDatabase,
  ): Promise<EventOccurrenceRow[]> {
    const moduleIds = isAdmin
      ? await this.getUniversityModuleIds(universityId, tx)
      : await this.getTaughtModuleIds(userId, universityId, tx);
    if (!moduleIds.length) return [];

    const rows = await tx
      .select({
        eventID: Event.eventID,
        eventName: Event.eventName,
        moduleID: modules.moduleID,
        moduleCode: modules.moduleCode,
        moduleName: modules.moduleName,
        eventCriteria: Event.eventCriteria,
        isRecurring: Event.isRecurring,
      })
      .from(UniversityEvent)
      .innerJoin(Event, eq(Event.eventID, UniversityEvent.eventID))
      .innerJoin(modules, eq(modules.moduleID, UniversityEvent.moduleID))
      .where(
        and(
          inArray(UniversityEvent.moduleID, moduleIds),
          eq(Event.validated, true),
        ),
      );
    const occurrences = rows.flatMap((row) => {
      const occurrence = occurrenceOnLocalDate(row, date, ATTENDANCE_TIME_ZONE);
      return occurrence ? [{ ...row, ...occurrence }] : [];
    });
    if (!occurrences.length) return [];

    const eventIds = [...new Set(occurrences.map((row) => row.eventID))];
    const venueRows = await tx
      .select({ eventID: EventVenue.EventID, venue: Venue.VenueName })
      .from(EventVenue)
      .innerJoin(Venue, eq(Venue.VenueID, EventVenue.VenueID))
      .where(inArray(EventVenue.EventID, eventIds));
    const venues = new Map<string, string | null>();
    for (const row of venueRows) {
      if (!venues.has(row.eventID)) venues.set(row.eventID, row.venue ?? null);
    }
    return occurrences
      .map((row) => ({ ...row, venue: venues.get(row.eventID) ?? null }))
      .sort(
        (a, b) => a.scheduledStartAt.getTime() - b.scheduledStartAt.getTime(),
      );
  }

  private async getTaughtModuleIds(
    userId: string,
    universityId: string,
    tx: AppDatabase,
  ): Promise<string[]> {
    const rows = await tx
      .select({ moduleId: ModuleTeaches.ModuleID })
      .from(ModuleTeaches)
      .innerJoin(
        GroupModules,
        eq(GroupModules.ModuleID, ModuleTeaches.ModuleID),
      )
      .innerJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
      .where(
        and(
          eq(ModuleTeaches.UserID, userId),
          eq(Course.UniversityID, universityId),
        ),
      );
    return [...new Set(rows.map((row) => row.moduleId))];
  }

  private async getUniversityModuleIds(
    universityId: string,
    tx: AppDatabase,
  ): Promise<string[]> {
    const rows = await tx
      .select({ moduleId: GroupModules.ModuleID })
      .from(GroupModules)
      .innerJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
      .where(eq(Course.UniversityID, universityId));
    return [...new Set(rows.map((row) => row.moduleId))];
  }

  private occurrenceKey(eventID: string, startAt: Date): string {
    return `${eventID}:${startAt.getTime()}`;
  }
}
