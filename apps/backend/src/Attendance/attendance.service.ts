import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
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
  ): Promise<AttendanceSingleResponse> {
    const eventId = dto.eventID;
    const date = dto.eventDate;
    const state = dto.state;
    //Check if attendance record already exists
    if (await this.checkIfAttendanceExists(userId, eventId, date))
      throw new ConflictException(
        `Attendance record already exists | User[${userId}] | event[${eventId}] | date[${date}]`,
      );

    //Check that event actually exists - will throw if doesnt exist
    await this.eventService.getById(eventId);

    //Create attendance record
    const [attendance] = await this.dbService.db
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
  ): Promise<AttendanceListResponse> {
    const conditions: SQL[] = [];

    if (
      filters === undefined ||
      (filters !== undefined && Object.keys(filters).length === 0)
    ) {
      //No filters to apply
      //default to filter by userId
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
    const attendance = await this.dbService.db
      .select()
      .from(EventAttendance)
      .where(and(...conditions));

    return {
      attendanceList: attendance,
    };
  } //END_getAllAttendanceRecords

  //basically getById
  //get specific attendance record
  async getById(eventAttendanceId: string): Promise<AttendanceSingleResponse> {
    const [attendance] = await this.dbService.db
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
  ): Promise<AttendanceSingleResponse> {
    //Get + check that attendance record exists
    const oldAttendance = await this.getById(eventAttendanceId);

    const updateFields: Partial<typeof EventAttendance.$inferSelect> = {};
    if (dto.eventDate && dto.eventDate !== oldAttendance.eventDate)
      updateFields.eventDate = dto.eventDate;
    if (dto.state && dto.state !== oldAttendance.state)
      updateFields.state = dto.state;

    //if nothing to update - return early - exception?
    if (Object.keys(updateFields).length === 0) return oldAttendance;

    const [newAttendance] = await this.dbService.db
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
  ): Promise<deleteAttendanceResponse> {
    //Get + check that attendance record exists
    await this.getById(eventAttendanceId);

    //Delete attendance record
    await this.dbService.db
      .delete(EventAttendance)
      .where(eq(EventAttendance.AttendanceID, eventAttendanceId));

    return {
      success: true,
    };
  } //END_deleteAttendance

  //🎅's Little Helpers

  //Get a specific attendance record by userid, eventid and the date
  private async findAttendance(
    userId: string,
    eventId: string,
    date: string,
  ): Promise<AttendanceSingleResponse> {
    const [attendance] = await this.dbService.db
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

  //check if attendance record exists
  private async checkIfAttendanceExists(
    userId: string,
    eventId: string,
    date: string,
  ): Promise<boolean> {
    const attendance = await this.findAttendance(eventId, userId, date);

    return !!attendance;
  } //END_checkIfAttendanceExists
} //END_AttendanceService
