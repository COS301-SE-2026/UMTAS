import { createSolverEvent, createSolverInput } from '../Testing/Factories';
import { SolverFingerprintService } from './solver-fingerprint.service';

describe('SolverFingerprintService', () => {
  const service = new SolverFingerprintService();

  it('canonicalizes event, venue, heuristic, and object-key order', () => {
    const first = createRequest();
    const second = createRequest();
    second.solverInput.schedulingProblem.events.reverse();
    second.solverInput.schedulingProblem.events[0]?.venues.reverse();
    second.solverInput.preferences.heuristics.reverse();

    expect(service.compute(first)).toEqual(service.compute(second));
  });

  it('changes when events or preferences change', () => {
    const baseline = service.compute(createRequest());
    const changedEvent = createRequest();
    changedEvent.solverInput.schedulingProblem.events[0].startTime = '09:00';
    const changedEventSet = createRequest();
    changedEventSet.solverInput.schedulingProblem.events.pop();
    const changedPreference = createRequest();
    changedPreference.solverInput.preferences.heuristics[0].parameters = {
      'minutes-After-midnight': 421,
    };

    expect(service.compute(changedEvent)).not.toBe(baseline);
    expect(service.compute(changedEventSet)).not.toBe(baseline);
    expect(service.compute(changedPreference)).not.toBe(baseline);
  });

  it('returns one versioned deduplication key', () => {
    expect(service.compute(createRequest())).toMatch(
      /^solver-semantic-sha256-v2:[0-9a-f]{64}$/,
    );
  });

  it('handles empty collections and optional event fields deterministically', () => {
    const empty = {
      solveMode: 'feasibility' as const,
      engine: 'cp-sat' as const,
      solverInput: {
        schedulingProblem: { events: [] },
        preferences: { heuristics: [] },
      },
    };
    const withoutOptionalFields = createRequest();
    delete withoutOptionalFields.solverInput.schedulingProblem.events[0]
      ?.dayOfWeek;
    expect(service.compute(empty)).toMatch(
      /^solver-semantic-sha256-v2:[0-9a-f]{64}$/,
    );
    expect(service.compute(withoutOptionalFields)).toBe(
      service.compute(structuredClone(withoutOptionalFields)),
    );
  });
});

function createRequest() {
  return {
    solveMode: 'optimization' as const,
    engine: 'auto' as const,
    solverInput: createSolverInput({
      schedulingProblem: {
        events: [
          createSolverEvent({
            eventId: 'b',
            activityCode: 'b',
            venues: [
              { id: 'v2', name: 'Two' },
              { id: 'v1', name: 'One' },
            ],
          }),
          createSolverEvent({ eventId: 'a', activityCode: 'a' }),
        ],
      },
      preferences: {
        heuristics: [
          {
            key: 'preferred-start-time',
            parameters: { 'minutes-After-midnight': 420 },
          },
          { key: 'small-gaps' },
        ],
      },
    }),
  };
}
