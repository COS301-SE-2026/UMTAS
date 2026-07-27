import { EventService } from '../../../Events/event.service';

export function createMockEventService() {
  const mockEventService: Partial<jest.Mocked<EventService>> = {
    create: jest.fn(),
    getAllEvents: jest.fn(),
    getById: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  };

  return {
    mockEventService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockEventService
