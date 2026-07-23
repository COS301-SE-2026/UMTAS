import { SolverFingerprintService } from './solver-fingerprint.service';

describe('SolverFingerprintService', () => {
  const service = new SolverFingerprintService();

  it('canonicalizes event, venue, heuristic, and object-key order', () => {
    const first = request();
    const second = request();
    second.solverInput.schedulingProblem.events.reverse();
    second.solverInput.schedulingProblem.events[0]?.venues.reverse();
    second.solverInput.preferences.heuristics.reverse();

    expect(service.compute(first)).toEqual(service.compute(second));
  });

  it('changes when events or preferences change', () => {
    const baseline = service.compute(request());
    const changedEvent = request();
    changedEvent.solverInput.schedulingProblem.events[0].startTime = '09:00';
    const changedEventSet = request();
    changedEventSet.solverInput.schedulingProblem.events.pop();
    const changedPreference = request();
    changedPreference.solverInput.preferences.heuristics[0].weight = 2;

    expect(service.compute(changedEvent)).not.toBe(baseline);
    expect(service.compute(changedEventSet)).not.toBe(baseline);
    expect(service.compute(changedPreference)).not.toBe(baseline);
  });

  it('returns one versioned deduplication key', () => {
    expect(service.compute(request())).toMatch(
      /^solver-semantic-sha256-v2:[0-9a-f]{64}$/,
    );
  });
});

function request() {
  return {
    solveMode: 'optimization' as const,
    engine: 'auto' as const,
    solverInput: {
      schedulingProblem: {
        events: [
          event('b', [
            { id: 'v2', name: 'Two' },
            { id: 'v1', name: 'One' },
          ]),
          event('a', []),
        ],
      },
      preferences: {
        heuristics: [
          { key: 'preferred-start-time', weight: 1 },
          { key: 'compact-days' },
        ],
      },
    },
  };
}

function event(eventId: string, venues: Array<{ id: string; name: string }>) {
  return {
    eventId,
    moduleCode: 'CS101',
    activityType: 'lecture' as const,
    activityCode: eventId,
    requiredSelections: 1,
    dayOfWeek: 'monday' as const,
    startTime: '08:00',
    endTime: '09:00',
    venues,
  };
}
