import { EventServiceV2 } from 'src/Events/eventV2.service';
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

export function createMockEventServiceV2() {
  const mockEventServiceV2: Partial<jest.Mocked<EventServiceV2>> = {
    ...createMockEventService().mockEventService,

    createV2: jest.fn(),
    validateEvent: jest.fn(),
  };

  return {
    mockEventServiceV2,
    reset: () => jest.clearAllMocks(),
  };
}
