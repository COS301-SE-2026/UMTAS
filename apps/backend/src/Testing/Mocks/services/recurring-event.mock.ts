import { RecurringEventService } from 'src/Events/recurring-event.service';

export function createMockRecurringEventService() {
  const mockRecurringEventService: Partial<jest.Mocked<RecurringEventService>> =
    {
      occursOnDate: jest.fn(),
      resolveNextOccurrence: jest.fn(),
      resolveOccurrenceOnDate: jest.fn(),
    };

  return {
    mockRecurringEventService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockRecurringEventService
