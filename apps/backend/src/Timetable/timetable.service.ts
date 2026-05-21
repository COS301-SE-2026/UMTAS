import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DatabaseService } from '../db/database.service';
import type { AppDatabase } from '../db/database.service';
import { Event, EventsToTimetables, Timetable } from '../entities/index';
import {
  CreateTimetableDto,
  DeleteTimetableResponseDto,
  TimetableListResponseDto,
  TimetableResponseDto,
  UpdateTimetableDto,
} from './dto/timetable.dto';

@Injectable()
export class TimetableService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createTimetable(
    userId: string,
    dto: CreateTimetableDto,
  ): Promise<TimetableResponseDto> {
    return await this.databaseService.db.transaction(
      async (tx: AppDatabase) => {
        const [newTimetable] = await tx
          .insert(Timetable)
          .values({ userID: userId, timetableName: dto.timetableName ?? null })
          .returning();

        if (!newTimetable)
          throw new InternalServerErrorException('Timetable was not created');

        const eventIds: number[] = [];

        if (dto.eventIds?.length) {
          await this.validateEventIds(tx, userId, dto.eventIds);
          await tx.insert(EventsToTimetables).values(
            dto.eventIds.map((eventID) => ({
              eventID,
              timetableID: newTimetable.timetableID,
            })),
          );
          eventIds.push(...dto.eventIds);
        }

        return {
          timetable: newTimetable,
          ...(eventIds.length ? { eventIds } : {}),
        };
      },
    );
  } //createTimetable

  async getAllTimetables(userId: string): Promise<TimetableListResponseDto> {
    const rows = await this.databaseService.db
      .select({ timetable: Timetable, eventID: EventsToTimetables.eventID })
      .from(Timetable)
      .leftJoin(
        EventsToTimetables,
        eq(EventsToTimetables.timetableID, Timetable.timetableID),
      )
      .where(eq(Timetable.userID, userId));

    const map = new Map<number, TimetableResponseDto>();

    for (const row of rows) {
      const id = row.timetable.timetableID;
      if (!map.has(id)) map.set(id, { timetable: row.timetable });
      if (row.eventID !== null) {
        const entry = map.get(id)!;
        entry.eventIds = entry.eventIds ?? [];
        entry.eventIds.push(row.eventID);
      }
    }

    return { timetables: Array.from(map.values()) };
  } //getAllTimetables

  async getTimetableById(
    userId: string,
    timetableId: number,
  ): Promise<TimetableResponseDto> {
    return this.fetchTimetableWithEvents(userId, timetableId);
  } //getTimetableById

  async updateTimetable(
    userId: string,
    timetableId: number,
    dto: UpdateTimetableDto,
  ): Promise<TimetableResponseDto> {
    const hasName = dto.timetableName !== undefined;
    const hasAdd = !!dto.addEventIds?.length;
    const hasRemove = !!dto.removeEventIds?.length;

    if (!hasName && !hasAdd && !hasRemove)
      throw new BadRequestException('At least one update field required');

    await this.databaseService.db.transaction(async (tx: AppDatabase) => {
      const [existing] = await tx
        .select()
        .from(Timetable)
        .where(
          and(
            eq(Timetable.timetableID, timetableId),
            eq(Timetable.userID, userId),
          ),
        )
        .limit(1);

      if (!existing)
        throw new NotFoundException(
          `Timetable not found for id: ${timetableId}`,
        );

      if (hasName) {
        const [updated] = await tx
          .update(Timetable)
          .set({ timetableName: dto.timetableName! })
          .where(
            and(
              eq(Timetable.timetableID, timetableId),
              eq(Timetable.userID, userId),
            ),
          )
          .returning();

        if (!updated)
          throw new InternalServerErrorException('Timetable was not updated');
      }

      if (hasAdd) {
        await this.validateEventIds(tx, userId, dto.addEventIds!);
        await tx
          .insert(EventsToTimetables)
          .values(
            dto.addEventIds!.map((eventID) => ({
              eventID,
              timetableID: timetableId,
            })),
          )
          .onConflictDoNothing();
      }

      if (hasRemove) {
        await tx
          .delete(EventsToTimetables)
          .where(
            and(
              eq(EventsToTimetables.timetableID, timetableId),
              inArray(EventsToTimetables.eventID, dto.removeEventIds!),
            ),
          );
      }
    });

    return this.fetchTimetableWithEvents(userId, timetableId);
  } //updateTimetable

  async deleteTimetable(
    userId: string,
    timetableId: number,
  ): Promise<DeleteTimetableResponseDto> {
    const [existing] = await this.databaseService.db
      .select()
      .from(Timetable)
      .where(
        and(
          eq(Timetable.timetableID, timetableId),
          eq(Timetable.userID, userId),
        ),
      )
      .limit(1);

    if (!existing)
      throw new NotFoundException(`Timetable not found for id: ${timetableId}`);

    const [deleted] = await this.databaseService.db
      .delete(Timetable)
      .where(
        and(
          eq(Timetable.timetableID, timetableId),
          eq(Timetable.userID, userId),
        ),
      )
      .returning();

    if (!deleted)
      throw new InternalServerErrorException('Timetable was not deleted');

    return { success: true };
  } //deleteTimetable

  private async fetchTimetableWithEvents(
    userId: string,
    timetableId: number,
  ): Promise<TimetableResponseDto> {
    const rows = await this.databaseService.db
      .select({ timetable: Timetable, eventID: EventsToTimetables.eventID })
      .from(Timetable)
      .leftJoin(
        EventsToTimetables,
        eq(EventsToTimetables.timetableID, Timetable.timetableID),
      )
      .where(
        and(
          eq(Timetable.timetableID, timetableId),
          eq(Timetable.userID, userId),
        ),
      );

    if (!rows.length)
      throw new NotFoundException(`Timetable not found for id: ${timetableId}`);

    const timetable = rows[0].timetable;
    const eventIds = rows
      .filter((r) => r.eventID !== null)
      .map((r) => r.eventID!);

    return {
      timetable,
      ...(eventIds.length ? { eventIds } : {}),
    };
  } //fetchTimetableWithEvents

  private async validateEventIds(
    tx: AppDatabase,
    userId: string,
    eventIds: number[],
  ): Promise<void> {
    const found = await tx
      .select({ eventID: Event.eventID })
      .from(Event)
      .where(and(inArray(Event.eventID, eventIds), eq(Event.userID, userId)));

    if (found.length !== eventIds.length) {
      const foundSet = new Set(found.map((r) => r.eventID));
      const missing = eventIds.filter((id) => !foundSet.has(id));
      throw new NotFoundException(
        `Events not found or not owned by user: ${missing.join(', ')}`,
      );
    }
  } //validateEventIds
} //TimetableService
