import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
// import { eq } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';
import { Event } from '../entities/Events/index';
import { CreateEventDto, EventResponseDto } from './dto/EventDto.dto';

@Injectable()
export class EventService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createEvent(
    userId: string,
    dto: CreateEventDto,
  ): Promise<EventResponseDto> {
    if (!userId) throw new BadRequestException('User ID required');

    const [newEvent] = await this.databaseService.db
      .insert(Event)
      .values({
        userID: userId,
        eventCriteria: dto.eventCriteria ?? null,
      })
      .returning();

    if (!newEvent)
      throw new InternalServerErrorException('Event was not created');

    return { event: newEvent };
  } //createEvent
} //EventService
