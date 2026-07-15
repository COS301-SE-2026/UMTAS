import { EventSource } from './dto/event.types';
import { EventImportFingerprintService } from './event-import-fingerprint.service';

describe('EventImportFingerprintService', () => {
  const service = new EventImportFingerprintService();
  const eventCriteria = {
    eventSource: EventSource.UNIVERSITY,
    moduleId: 'module-1',
    dayOfWeek: 'monday' as const,
    startTime: '08:30',
    endTime: '09:20',
  };

  it('is stable regardless of venue input order', () => {
    const first = service.buildForModuleEvent({
      activityType: 'lecture',
      activityCode: 'L1',
      eventCriteria,
      moduleId: 'module-1',
      venueNames: ['Room B', 'Room A'],
    });
    const second = service.buildForModuleEvent({
      activityType: 'lecture',
      activityCode: 'L1',
      eventCriteria,
      moduleId: 'module-1',
      venueNames: ['Room A', 'Room B'],
    });
    expect(first).toBe(second);
  });

  it('does not create fingerprints for personal events', () => {
    expect(
      service.buildForEvent({
        activityCode: null,
        eventCriteria: {
          eventSource: EventSource.PERSONAL,
          date: '2026-07-10',
          startTime: '09:00',
          endTime: '10:00',
        },
      }),
    ).toBeNull();
  });
});
