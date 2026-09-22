import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AppDatabase, DatabaseService } from '../db/database.service';
import { eq, and, SQL } from 'drizzle-orm';

import { EventService } from '../Events/event.service';
import { EventAttendance } from '../entities';
import {
  CreateAttendanceDto,
  AttendanceSingleResponse,
  AttendanceFilters,
  AttendanceListResponse,
  UpdateAttendanceDto,
  deleteAttendanceResponse,
} from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly eventService: EventService,
  ) {}

  async createAttendance(
    userId: string,
    dto: CreateAttendanceDto,
    tx?: AppDatabase,
  ): Promise<AttendanceSingleResponse> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.createAttendance(userId, dto, t);
      });
    }

    const eventId = dto.eventID;
    const date = dto.eventDate;
    const state = dto.state;

    const existingAttendance = await this.findAttendance(
      userId,
      eventId,
      date,
      tx,
    );
    if (existingAttendance) return existingAttendance;

    await this.eventService.getById(eventId, tx);

    const [attendance] = await tx
      .insert(EventAttendance)
      .values({
        eventID: eventId,
        UserID: userId,
        eventDate: date,
        state,
      })
      .returning();

    if (!attendance)
      throw new InternalServerErrorException(
        `Failed to create new attendance record`,
      );

    return attendance;
  }

  async getAllAttendanceRecords(
    userId: string,
    filters?: AttendanceFilters,
    tx?: AppDatabase,
  ): Promise<AttendanceListResponse> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.getAllAttendanceRecords(userId, filters, t);
      });
    }

    const conditions: SQL[] = [];

    const hasAnyFilter =
      !!filters?.eventID ||
      !!filters?.eventDate ||
      !!filters?.state ||
      !!filters?.AlsoFilterByUser;

    if (!hasAnyFilter) {
      conditions.push(eq(EventAttendance.UserID, userId));
    } else {
      if (filters.eventID)
        conditions.push(eq(EventAttendance.eventID, filters.eventID));
      if (filters.eventDate)
        conditions.push(eq(EventAttendance.eventDate, filters.eventDate));
      if (filters.state)
        conditions.push(eq(EventAttendance.state, filters.state));
      if (filters.AlsoFilterByUser)
        conditions.push(eq(EventAttendance.UserID, userId));
    }

    const attendance = await tx
      .select()
      .from(EventAttendance)
      .where(and(...conditions));

    return {
      attendanceList: attendance,
    };
  }

  async getById(
    eventAttendanceId: string,
    tx?: AppDatabase,
  ): Promise<AttendanceSingleResponse> {
    const db = tx ?? this.dbService.db;

    const [attendance] = await db
      .select()
      .from(EventAttendance)
      .where(eq(EventAttendance.AttendanceID, eventAttendanceId))
      .limit(1);

    if (!attendance)
      throw new NotFoundException(
        `Attendance record not found | attendanceID[${eventAttendanceId}]`,
      );

    return attendance;
  }

  async updateAttendanceRecord(
    eventAttendanceId: string,
    dto: UpdateAttendanceDto,
    tx?: AppDatabase,
  ): Promise<AttendanceSingleResponse> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.updateAttendanceRecord(eventAttendanceId, dto, t);
      });
    }

    const oldAttendance = await this.getById(eventAttendanceId, tx);

    const updateFields: Partial<typeof EventAttendance.$inferSelect> = {};
    if (dto.eventDate && dto.eventDate !== oldAttendance.eventDate)
      updateFields.eventDate = dto.eventDate;
    if (dto.state && dto.state !== oldAttendance.state)
      updateFields.state = dto.state;

    if (Object.keys(updateFields).length === 0) return oldAttendance;

    const [newAttendance] = await tx
      .update(EventAttendance)
      .set(updateFields)
      .where(eq(EventAttendance.AttendanceID, eventAttendanceId))
      .returning();

    if (!newAttendance)
      throw new InternalServerErrorException(
        `Failed to update attendance for: AttendanceID[${eventAttendanceId}]`,
      );

    return newAttendance;
  }

  async deleteAttendance(
    eventAttendanceId: string,
    tx?: AppDatabase,
  ): Promise<deleteAttendanceResponse> {
    const db = tx ?? this.dbService.db;

    const [result] = await db
      .delete(EventAttendance)
      .where(eq(EventAttendance.AttendanceID, eventAttendanceId))
      .returning();

    return {
      success: !!result,
    };
  }

  private async findAttendance(
    userId: string,
    eventId: string,
    date: string,
    tx?: AppDatabase,
  ): Promise<AttendanceSingleResponse> {
    const db = tx ?? this.dbService.db;

    const [attendance] = await db
      .select()
      .from(EventAttendance)
      .where(
        and(
          eq(EventAttendance.UserID, userId),
          eq(EventAttendance.eventID, eventId),
          eq(EventAttendance.eventDate, date),
        ),
      )
      .limit(1);

    return attendance;
  }
}
