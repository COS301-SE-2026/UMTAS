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

  //Create attendance record
  async createAttendance(
    userId: string,
    dto: CreateAttendanceDto,
    tx?: AppDatabase,
  ): Promise<AttendanceSingleResponse> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.createAttendance(userId, dto, t);
      }); //END_transaction
    } //END_transaction precencer check

    const eventId = dto.eventID;
    const date = dto.eventDate;
    const state = dto.state;

    //Check if attendance record already exists - return early
    const existingAttendance = await this.findAttendance(
      userId,
      eventId,
      date,
      tx,
    );
    if (existingAttendance) return existingAttendance;

    //Check that event actually exists - will throw if doesnt exist
    await this.eventService.getById(eventId, tx);

    //Create attendance record
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
  } //END_createAttendance

  //get all attendance records
  //No filters - default to userId
  async getAllAttendanceRecords(
    userId: string,
    filters?: AttendanceFilters,
    tx?: AppDatabase,
  ): Promise<AttendanceListResponse> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.getAllAttendanceRecords(userId, filters, t);
      }); //END_transaction
    } //END_transaction precencer check

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

    //get all Attendance records
    const attendance = await tx
      .select()
      .from(EventAttendance)
      .where(and(...conditions));

    return {
      attendanceList: attendance,
    };
  } //END_getAllAttendanceRecords

  //basically getById
  //get specific attendance record
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
  } //END_getSpecificAttendance

  //update attendance record
  async updateAttendanceRecord(
    eventAttendanceId: string,
    dto: UpdateAttendanceDto,
    tx?: AppDatabase,
  ): Promise<AttendanceSingleResponse> {
    if (!tx) {
      return this.dbService.db.transaction(async (t: AppDatabase) => {
        return this.updateAttendanceRecord(eventAttendanceId, dto, t);
      }); //END_transaction
    } //END_transaction precencer check

    //Get + check that attendance record exists
    const oldAttendance = await this.getById(eventAttendanceId, tx);

    const updateFields: Partial<typeof EventAttendance.$inferSelect> = {};
    if (dto.eventDate && dto.eventDate !== oldAttendance.eventDate)
      updateFields.eventDate = dto.eventDate;
    if (dto.state && dto.state !== oldAttendance.state)
      updateFields.state = dto.state;

    //if nothing to update - return early - exception?
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
  } //END_updateAttendanceRecord

  //delete attendance record - basically NOT_STATED
  async deleteAttendance(
    eventAttendanceId: string,
    tx?: AppDatabase,
  ): Promise<deleteAttendanceResponse> {
    const db = tx ?? this.dbService.db;

    //Delete attendance record
    const [result] = await db
      .delete(EventAttendance)
      .where(eq(EventAttendance.AttendanceID, eventAttendanceId))
      .returning();

    return {
      success: !!result,
    };
  } //END_deleteAttendance

  //🎅's Little Helpers

  /**
   * Retrieve a specific attendance record for a user at a given event and date.
   *
   * @param userId - ID of the user to verify
   * @param eventId - ID of the event to check
   * @param date - Date of the attendance entry
   * @param tx - Optional transaction instance
   *
   * @returns An AttendanceSingleResponse object if found, otherwise undefined
   *
   * @remarks
   * Limits the query to one record. Useful for checking a single attendance entry.
   *
   * @example
   * ```ts
   * const existing = await findAttendance("user123", "event456", "2026-07-26");
   * console.log(existing); // AttendanceSingleResponse or undefined
   * ```
   */
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
  } //END_getSpecificAttendance
} //END_AttendanceService
