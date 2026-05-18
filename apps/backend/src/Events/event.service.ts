import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
import { CreateEventDto, EventType } from './dto/Event.dto';

export class EventService {
  constructor(private readonly dbService: DatabaseService) {}

  async create(dto: CreateEventDto) {
    if (!dto.type) {
      throw new BadRequestException(
        `Type not specified for event | type: ${dto.type}`,
      );
    }

    const [createdEvent] = await this.dbService.db
      .insert(EventTable)
      .values({
        title: dto.title,
        type: dto.type,
        start: dto.start,
        end: dto.end,
        color: dto.color,
        moduleId: dto.moduleId,
      })
      .returning();

    if (!createdEvent)
      throw new InternalServerErrorException('Event could not be created');

    let createdLecture = null;

    if (dto.type == EventType.Lecture) {
      [createdLecture] = await this.dbService.db
        .insert(LectureTable)
        .values({
          moduleId: dto.moduleId,
        })
        .returning();

      if (!createdLecture)
        throw new InternalServerErrorException('Lecture not created');
    } //END_type check

    return {
      event: createdEvent,
      lecture: createdLecture,
    };
  } //create
} //EventService
