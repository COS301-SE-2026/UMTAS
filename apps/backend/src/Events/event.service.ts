import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';
import { Event, LectureEv, modules } from '../entities/index';
import {
  CreateEventDto,
  EventResponseDto,
  EventType,
} from './dto/EventDto.dto';

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

  //Helpers
  private async createLectureForEvent(
    tx: typeof this.databaseService.db,
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

  private validateEventTypeCriteria(criteria: CreateEventDto['eventCriteria']) {
    if (!criteria)
      throw new BadRequestException('Criteria required to create event');

    if (!criteria.type) return;

    if (criteria.type !== EventType.LECTURE)
      throw new BadRequestException('Only lectures right now');

    if (!criteria.moduleCode)
      throw new BadRequestException('Lecture Events need a moduleCode');
  } //validateEvetTypeCriteria
} //EventService
