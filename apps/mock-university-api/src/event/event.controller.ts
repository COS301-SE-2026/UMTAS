import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Events')
@Controller('api/events')
export class EventController {
  @Get()
  @ApiOperation({ summary: 'Get all events' })
  getEvents() {
    return [
      {
        event_id: 'EVT001',
        course_id: 'COS301',
        title: 'Requirements Engineering Lecture',
        start_time: '2026-08-17T08:00:00',
        end_time: '2026-08-17T10:00:00',
        location: 'IT Building 2-10',
      },
      {
        event_id: 'EVT002',
        course_id: 'COS326',
        title: 'Database Lecture',
        start_time: '2026-08-17T10:00:00',
        end_time: '2026-08-17T12:00:00',
        location: 'IT Building 3-4',
      },
    ];
  }
}
