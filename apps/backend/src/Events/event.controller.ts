import { HttpCode } from '@nestjs/common';
import { EventService } from './event.service';

export class EventController {
  constructor(private readonly service: EventService) {}

  @Post()
  createEvent(@Body() dto: CreateEventDto) {
    return this.service.create(dto);
  }
} //EventController
