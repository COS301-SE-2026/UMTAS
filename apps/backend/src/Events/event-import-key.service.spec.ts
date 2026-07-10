import { EventType } from './dto/event.types';
import { EventImportKeyService } from './event-import-key.service';

describe('EventImportKeyService', () => {
  let service: EventImportKeyService;

  beforeEach(() => {
    service = new EventImportKeyService();
  });

  it('builds the same key for the same module event identity', () => {
    const firstKey = service.buildForEvent({
      eventName: 'COS101 Lecture',
      eventCode: 'L1',
      eventCriteria: {
        type: EventType.UNIVERSITY,
        date: 'Monday',
        startTime: '08:30',
        endTime: '09:20',
        moduleID: 'module-1',
        venue: 'IT 2-26',
      },
    });
    const secondKey = service.buildForEvent({
      eventName: 'COS101 Lecture',
      eventCode: 'L1',
      eventCriteria: {
        type: EventType.UNIVERSITY,
        date: 'Monday',
        startTime: '08:30',
        endTime: '09:20',
        moduleID: 'module-1',
        venue: 'IT 2-26',
      },
    });

    expect(firstKey).toBe(secondKey);
  });

  it('does not build a key for personal events without a module', () => {
    const key = service.buildForEvent({
      eventName: 'Study block',
      eventCode: null,
      eventCriteria: {
        type: EventType.PERSONAL,
        date: '2026-07-03',
        startTime: '08:30',
        endTime: '09:20',
      },
    });

    expect(key).toBeNull();
  });

  it('keeps different event identities separate', () => {
    const firstKey = service.buildForModuleEvent({
      moduleId: 'AB',
      eventName: 'C',
      eventCode: '',
      eventCriteria: {
        type: EventType.UNIVERSITY,
        date: 'Monday',
        startTime: '08:30',
        endTime: '09:20',
      },
    });
    const secondKey = service.buildForModuleEvent({
      moduleId: 'A',
      eventName: 'BC',
      eventCode: '',
      eventCriteria: {
        type: EventType.UNIVERSITY,
        date: 'Monday',
        startTime: '08:30',
        endTime: '09:20',
      },
    });

    expect(firstKey).not.toBe(secondKey);
  });
});
