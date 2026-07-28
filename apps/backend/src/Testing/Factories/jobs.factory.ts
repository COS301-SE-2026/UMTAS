import { randomUUID } from 'node:crypto';
import { parseJob, solverJob } from '../../entities';

export function createParseJob(
  overrides: Partial<typeof parseJob.$inferInsert> = {},
): typeof parseJob.$inferInsert {
  return {
    JobID: randomUUID(),
    UserID: randomUUID(),
    UniversityID: randomUUID(),
    AdapterKey: 'up',
    PdfStreamHash: '0'.repeat(64),
    FingerprintAlgorithm: 'pdf-stream-payload-sha256-v1',
    StreamCount: 1,
    Status: 'queued',
    Result: null,
    ...overrides,
  };
}

export function createSolverJob(
  overrides: Partial<typeof solverJob.$inferInsert> = {},
): typeof solverJob.$inferInsert {
  return {
    JobID: randomUUID(),
    UserID: randomUUID(),
    SolveMode: 'feasibility',
    RequestedEngine: 'auto',
    DeduplicationKey: `integration-${randomUUID()}`,
    AttemptToken: randomUUID(),
    Input: {
      schedulingProblem: { events: [] },
      preferences: { heuristics: [] },
    },
    Status: 'queued',
    Result: null,
    ...overrides,
  };
}
