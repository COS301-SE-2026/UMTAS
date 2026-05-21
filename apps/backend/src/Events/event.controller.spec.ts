import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import {
  EventType,
  EventCriteriaDto,
  UpdateEventDto,
  EventResponseDto,
  CreateEventDto,
} from './dto/EventDto.dto';
import { SessionData } from '../auth/session.decorator';

const mockSession = { user: { id: 'user-1' } } as SessionData;

// Mock factory for event criteria
function makeEventCriteria(
  overrides: Partial<EventCriteriaDto> = {},
): EventCriteriaDto {
  return {
    type: undefined,
    day: 'Monday',
    startTime: '08:30',
    endTime: '10:20',
    ...overrides,
  };
}

const mockService = {
  createEvent: jest.fn(),
  getAllEvents: jest.fn(),
  getById: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
};

describe('EventController', () => {
  let controller: EventController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [{ provide: EventService, useValue: mockService }],
    }).compile();

    controller = module.get<EventController>(EventController);
  });

  describe('createEvent', () => {
    it('delegates to service with session userId and dto', async () => {
      const dto: CreateEventDto = {
        eventCriteria: makeEventCriteria({
          type: EventType.LECTURE,
          moduleCode: 'CS101',
        }),
      };
      const expected = { event: { eventID: 1 } } as EventResponseDto;
      mockService.createEvent.mockResolvedValue(expected);

      const result = await controller.createEvent(mockSession, dto);

      expect(mockService.createEvent).toHaveBeenCalledWith('user-1', dto);
      expect(result).toBe(expected);
    });

    it('propagates service errors', async () => {
      mockService.createEvent.mockRejectedValue(new Error('service error'));
      const dto: CreateEventDto = { eventCriteria: makeEventCriteria() };
      await expect(controller.createEvent(mockSession, dto)).rejects.toThrow(
        'service error',
      );
    });
  });

  describe('getAllEvents', () => {
    it('delegates to service with session userId', async () => {
      const expected = { events: [] };
      mockService.getAllEvents.mockResolvedValue(expected);

      const result = await controller.getAllEvents(mockSession);

      expect(mockService.getAllEvents).toHaveBeenCalledWith('user-1');
      expect(result).toBe(expected);
    });
  });

  describe('getById', () => {
    it('delegates to service with session userId and id', async () => {
      const expected = { event: { eventID: 1 } } as EventResponseDto;
      mockService.getById.mockResolvedValue(expected);

      const result = await controller.getById(mockSession, 1);

      expect(mockService.getById).toHaveBeenCalledWith('user-1', 1);
      expect(result).toBe(expected);
    });
  });

  describe('updateEvent', () => {
    it('delegates to service with session userId, id, and dto', async () => {
      const dto: UpdateEventDto = { eventCriteria: { venue: 'Lab 1' } };
      const expected = { event: { eventID: 3 } } as EventResponseDto;
      mockService.updateEvent.mockResolvedValue(expected);

      const result = await controller.updateEvent(mockSession, 3, dto);

      expect(mockService.updateEvent).toHaveBeenCalledWith('user-1', 3, dto);
      expect(result).toBe(expected);
    });

    it('propagates service errors', async () => {
      mockService.updateEvent.mockRejectedValue(new Error('not updated'));
      await expect(controller.updateEvent(mockSession, 3, {})).rejects.toThrow(
        'not updated',
      );
    });
  });

  describe('deleteEvent', () => {
    it('delegates to service with session userId and id', async () => {
      const expected = { success: true };
      mockService.deleteEvent.mockResolvedValue(expected);

      const result = await controller.deleteEvent(mockSession, 1);

      expect(mockService.deleteEvent).toHaveBeenCalledWith('user-1', 1);
      expect(result).toBe(expected);
    });
  });
});
