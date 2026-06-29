import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DatabaseService } from '../db/database.service';
import type { AppDatabase } from '../db/database.service';
import {
  Event,
  EventsToTimetables,
  Timetable,
  UserTimetable,
} from '../entities/index';
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
          .values({ timetableName: dto.timetableName ?? null })
          .returning();

        if (!newTimetable)
          throw new InternalServerErrorException('Timetable was not created');

        const [newUserTimetable] = await tx
          .insert(UserTimetable)
          .values({ 
            UserID: userId, 
            TimetableID: newTimetable.timetableID
          })
          .returning();

        const eventIds: string[] = [];

        if (dto.eventIds?.length) {
          await this.validateEventIds(tx, dto.eventIds);
          await tx
            .insert(EventsToTimetables)
            .values(
              dto.eventIds.map((eventID) => ({
                eventID,
                timetableID: newTimetable.timetableID,
              })),
            )
            .onConflictDoNothing();
          eventIds.push(...dto.eventIds);
        }

        return {
          UserTimetableID: newUserTimetable.UserTimetableID,
          timetable: newTimetable,
          ...(eventIds.length ? { eventIds } : {}),
        };
      },
    );
  } //createTimetable

  async getAllTimetables(userId: string): Promise<TimetableListResponseDto> {

    const rows = await this.databaseService.db
      .select({
        UserTimetable: UserTimetable,
        timetable: Timetable,
        eventID: EventsToTimetables.eventID,
      })
      .from(UserTimetable)
      .innerJoin(
        Timetable,
        eq(Timetable.timetableID, UserTimetable.TimetableID),
      )
      .leftJoin(
        EventsToTimetables,
        eq(EventsToTimetables.timetableID, Timetable.timetableID),
      )
      .where(eq(UserTimetable.UserID, userId));

    const map = new Map<string, {
      timetable: typeof Timetable.$inferSelect;
      UserTimetableID: string;
      eventIds?: string[];
    }>();

    for (const row of rows) {
      const id = row.timetable.timetableID;

      if (!map.has(id))
        map.set(id, {
          timetable: row.timetable,
          UserTimetableID: row.UserTimetable.UserTimetableID,
        });

      if (row.eventID !== null) {
        const entry = map.get(id)!;
        entry.eventIds = entry.eventIds ?? [];
        entry.eventIds.push(row.eventID);
      }
    }//END_row

    return { timetables: Array.from(map.values()) };
  } //getAllTimetables

  async getTimetableById(
    userId: string,
    timetableId: string,
  ): Promise<TimetableResponseDto> {
    return this.fetchTimetableWithEvents(userId, timetableId);
  } //getTimetableById

  async updateTimetable(
    userId: string,
    timetableId: string,
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
        .from(UserTimetable)
        .innerJoin(
          Timetable,
          and(
            eq(UserTimetable.TimetableID, Timetable.timetableID),
            eq(Timetable.timetableID, timetableId),
          ),
        )
        .where(eq(UserTimetable.UserID, userId))
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
              eq(Timetable.timetableID, existing.Timetable.timetableID),
          )
          .returning();

        if (!updated)
          throw new InternalServerErrorException('Timetable was not updated');
      }

      if (hasAdd) {
        await this.validateEventIds(tx, dto.addEventIds!);
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
    timetableId: string,
  ): Promise<DeleteTimetableResponseDto> {

    const [existing] = await this.databaseService.db
      .select()
      .from(UserTimetable)
      .innerJoin(
        Timetable,
        eq(UserTimetable.TimetableID, Timetable.timetableID),
      )
      .where(
        and(
          eq(UserTimetable.UserID, userId),
          eq(Timetable.timetableID, timetableId),
        ),
      )
      .limit(1);

    if (!existing)
      throw new NotFoundException(`Timetable not found for id: ${timetableId}`);

    const [deleted] = await this.databaseService.db
      .delete(Timetable)
      .where(eq(Timetable.timetableID, existing.Timetable.timetableID))
      .returning();

    if (!deleted)
      throw new InternalServerErrorException('Timetable was not deleted');

    return { success: true };
  } //deleteTimetable

  private async fetchTimetableWithEvents(
    userId: string,
    timetableId: string,
  ): Promise<TimetableResponseDto> {

    const rows = await this.databaseService.db
      .select({
        UserTimetable: UserTimetable,
        timetable: Timetable,
        eventID: EventsToTimetables.eventID,
      })
      .from(UserTimetable)
      .innerJoin(
        Timetable,
        eq(Timetable.timetableID, UserTimetable.TimetableID),
      )
      .leftJoin(
        EventsToTimetables,
        eq(EventsToTimetables.timetableID, Timetable.timetableID),
      )
      .where(
        and(
          eq(UserTimetable.UserID, userId),
          eq(Timetable.timetableID, timetableId),
        ),
      );

    if (!rows.length)
      throw new NotFoundException(`Timetable not found for id: ${timetableId}`);

    const UserTT = rows[0].UserTimetable;
    const timetable = rows[0].timetable;
    const eventIds = rows
      .filter((r) => r.eventID !== null)
      .map((r) => r.eventID!);

    return {
      UserTimetableID: UserTT.UserTimetableID,
      timetable,
      ...(eventIds.length ? { eventIds } : {}),
    };
  } //fetchTimetableWithEvents

  //🎅's little helpers
  private async validateEventIds(
    tx: AppDatabase,
    eventIds: string[],
  ): Promise<void> {
    const found = await tx
      .select({ eventID: Event.eventID })
      .from(Event)
      .where(inArray(Event.eventID, eventIds));

    if (found.length !== eventIds.length) {
      const foundSet = new Set(found.map((r) => r.eventID));
      const missing = eventIds.filter((id) => !foundSet.has(id));
      throw new NotFoundException(
        `Events not found or not owned by user: ${missing.join(', ')}`,
      );
    }
  } //validateEventIds
} //TimetableService
