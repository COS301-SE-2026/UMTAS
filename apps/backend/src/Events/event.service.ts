import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';
import { Event, LectureEv, modules } from '../entities/index';
import {
  CreateEventDto,
  EventResponseDto,
  EventType,
  EventListResponseDto,
  UpdateEventDto,
} from './dto/EventDto.dto';

import { AppDatabase } from '../db/database.service';

@Injectable()
export class EventService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createEvent(
    userId: string,
    dto: CreateEventDto,
  ): Promise<EventResponseDto> {
    if (!userId) throw new BadRequestException('User ID required');

    const criteria = dto.eventCriteria;

    this.validateEventTypeCriteria(criteria);

    return await this.databaseService.db.transaction(async (tx) => {
      const [newEvent] = await tx
        .insert(Event)
        .values({
          userID: userId,
          eventCriteria: dto.eventCriteria ?? null,
        })
        .returning();

      if (!newEvent)
        throw new InternalServerErrorException('Event was not created');

      if (criteria.type !== EventType.LECTURE) return { event: newEvent };

      const lecture = await this.createLectureForEvent(
        tx,
        newEvent.eventID,
        criteria,
      );

      return { event: newEvent, lecture };
    });
  } //createEvent

  //getAllEvents
  async getAllEvents(userId: string): Promise<EventListResponseDto> {
    const r = await this.databaseService.db
      .select({
        event: Event,
        lecture: LectureEv,
      })
      .from(Event)
      .leftJoin(LectureEv, eq(LectureEv.eventID, Event.eventID))
      .where(eq(Event.userID, userId));

    return {
      events: r.map((r) => ({
        event: r.event as EventResponseDto['event'],
        ...(r.lecture ? { lecture: r.lecture } : {}),
      })),
    };
  } //getAllEvents

  //getById
  async getById(userId: string, eventId: number): Promise<EventResponseDto> {
    const [row] = await this.databaseService.db
      .select({
        event: Event,
        lecture: LectureEv,
      })
      .from(Event)
      .leftJoin(LectureEv, eq(LectureEv.eventID, Event.eventID))
      .where(and(eq(Event.eventID, eventId), eq(Event.userID, userId)))
      .limit(1);

    if (!row) throw new NotFoundException(`Event not found for id: ${eventId}`);

    return {
      event: row.event as EventResponseDto['event'],
      ...(row.lecture ? { lecture: row.lecture } : {}),
    };
  } //getById

  async updateEvent(
    userId: string,
    eventId: number,
    dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    if (!dto.eventCriteria || Object.keys(dto.eventCriteria).length === 0)
      throw new BadRequestException(
        'At least one eventCriteria  field required',
      );

    return await this.databaseService.db.transaction(async (tx) => {
      const [exRow] = await tx
        .select({
          event: Event,
          lecture: LectureEv,
        })
        .from(Event)
        .leftJoin(LectureEv, eq(LectureEv.eventID, Event.eventID))
        .where(and(eq(Event.eventID, eventId), eq(Event.userID, userId)))
        .limit(1);

      if (!exRow)
        throw new NotFoundException(`Event not found for eventId: ${eventId}`);

      const exCriteria = exRow.event.eventCriteria ?? {};

      const mergedCriteria = {
        ...exCriteria,
        ...dto.eventCriteria,
      };

      if (mergedCriteria.type === null) delete mergedCriteria.type;

      this.validateEventTypeCriteria(mergedCriteria);

      const [updatedEvent] = await tx
        .update(Event)
        .set({ eventCriteria: mergedCriteria })
        .where(and(eq(Event.eventID, eventId), eq(Event.userID, userId)))
        .returning();

      if (!updatedEvent)
        throw new InternalServerErrorException('Event not updated');

      const lecture = await this.syncSubtypeForEvent(
        tx,
        updatedEvent.eventID,
        mergedCriteria,
        exRow.lecture,
      );

      return {
        event: updatedEvent,
        ...(lecture ? { lecture } : {}),
      };
    });
  } //udpate

  //=======================================================
  //Helpers
  private async createLectureForEvent(
    tx: AppDatabase,
    eventID: number,
    criteria: NonNullable<CreateEventDto['eventCriteria']>,
  ) {
    const [mod] = await tx
      .select()
      .from(modules)
      .where(eq(modules.moduleCode, criteria.moduleCode!))
      .limit(1);

    if (!mod)
      throw new NotFoundException(
        `Module not found for code: ${criteria.moduleCode}`,
      );

    const [lec] = await tx
      .insert(LectureEv)
      .values({
        moduleID: mod.moduleID,
        eventID: eventID,
        venue: criteria.venue ?? null,
      })
      .returning();

    if (!lec) throw new InternalServerErrorException('Lecture not created');

    return lec;
  } //createLectureForEvent

  private validateEventTypeCriteria(
    criteria: Partial<CreateEventDto['eventCriteria']>,
  ) {
    if (!criteria) throw new BadRequestException('Criteria required');

    if (!criteria.type) return;

    switch (criteria.type) {
      case EventType.LECTURE:
        if (!criteria.moduleCode)
          throw new BadRequestException('Lecture events need a moduleCode');
        return;

      default:
        throw new BadRequestException(`Unsupported event type`);
    }
  } //validateEvetTypeCriteria

  private async syncSubtypeForEvent(
    tx: typeof this.databaseService.db,
    eventID: number,
    criteria: NonNullable<CreateEventDto['eventCriteria']>,
    existingLecture?: typeof LectureEv.$inferSelect | null,
  ) {
    if (!criteria.type) {
      if (existingLecture)
        await tx.delete(LectureEv).where(eq(LectureEv.eventID, eventID));

      return undefined;
    } //END_type

    switch (criteria.type) {
      case EventType.LECTURE:
        return await this.upsertLectureForEvent(
          tx,
          eventID,
          criteria,
          existingLecture,
        );

      default:
        throw new BadRequestException(`Unsupported event type`);
    }
  } //sync

  private async upsertLectureForEvent(
    tx: AppDatabase,
    eventID: number,
    criteria: NonNullable<CreateEventDto['eventCriteria']>,
    exLecture?: typeof LectureEv.$inferSelect | null,
  ) {
    if (!criteria.moduleCode)
      throw new BadRequestException('Lecture events need moduleCode');

    const [mod] = await tx
      .select()
      .from(modules)
      .where(eq(modules.moduleCode, criteria.moduleCode))
      .limit(1);

    if (!mod) throw new NotFoundException(`Module not found for code`);

    if (exLecture) {
      const [lecture] = await tx
        .update(LectureEv)
        .set({
          moduleID: mod.moduleID,
          venue: criteria.venue ?? null,
        })
        .where(eq(LectureEv.eventID, eventID))
        .returning();

      if (!lecture)
        throw new InternalServerErrorException('Lecture was not updated');

      return lecture;
    } //END_exLecture

    const [lecture] = await tx
      .insert(LectureEv)
      .values({
        moduleID: mod.moduleID,
        eventID,
        venue: criteria.venue ?? null,
      })
      .returning();

    if (!lecture)
      throw new InternalServerErrorException('Lecture was not created');

    return lecture;
  } //upsertLecture
} //EventService
