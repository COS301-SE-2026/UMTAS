import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEventDto } from './EventDto.dto';
import { EventSource } from './event.types';

describe('CreateEventDto', () => {
  it('requires activityType for a module-backed university event', async () => {
    const dto = plainToInstance(CreateEventDto, {
      eventCriteria: {
        eventSource: EventSource.UNIVERSITY,
        moduleId: '33333333-3333-4333-8333-333333333333',
        dayOfWeek: 'monday',
        startTime: '08:00',
        endTime: '09:00',
      },
      isRecurring: true,
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'activityType',
          constraints: expect.objectContaining({
            isDefined: expect.any(String),
          }),
        }),
      ]),
    );
  });

  it('allows a personal event without activityType', async () => {
    const dto = plainToInstance(CreateEventDto, {
      eventCriteria: {
        eventSource: EventSource.PERSONAL,
        date: '2026-07-14',
        startTime: '08:00',
        endTime: '09:00',
      },
      isRecurring: false,
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });
});
