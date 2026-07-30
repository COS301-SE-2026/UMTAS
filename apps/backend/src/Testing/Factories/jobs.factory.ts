import { randomUUID } from 'node:crypto';
import type {
  PdfParseJobData,
  SolverInput,
  TimetableSolveJobData,
} from 'shared-types';
import type { ParseJob, SolverJob } from '../../entities';
import type { SolverJobRecord } from '../../solver/solver-job-store.service';
import type { SolverSubmissionInput } from '../../solver/solver-submission.service';

export function createParseJob(overrides: Partial<ParseJob> = {}): ParseJob {
  const now = new Date();

  return {
    JobID: randomUUID(),
    UserID: randomUUID(),
    UniversityID: randomUUID(),
    AdapterKey: 'up',
    FileKey: 'uploads/test.pdf',
    ClientPdfStreamHash: null,
    PdfStreamHash: '0'.repeat(64),
    FingerprintAlgorithm: 'pdf-stream-payload-sha256-v1',
    StreamCount: 1,
    GroupID: null,
    Status: 'queued',
    Result: null,
    ErrorCode: null,
    ErrorMessage: null,
    ErrorDetails: null,
    CreatedAt: now,
    UpdatedAt: now,
    CompletedAt: null,
    FailedAt: null,
    ...overrides,
  };
}

export function createSolverJob(overrides: Partial<SolverJob> = {}): SolverJob {
  const now = new Date();

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
    ErrorCode: null,
    ErrorMessage: null,
    ErrorDetails: null,
    CreatedAt: now,
    UpdatedAt: now,
    EnqueuedAt: null,
    CompletedAt: null,
    FailedAt: null,
    ...overrides,
  };
}

export function createSolverInput(
  overrides: Partial<SolverInput> = {},
): SolverInput {
  return {
    schedulingProblem: { events: [] },
    preferences: { heuristics: [] },
    ...overrides,
  };
}

type SolverEvent = SolverInput['schedulingProblem']['events'][number];

export function createSolverEvent(
  overrides: Partial<SolverEvent> = {},
): SolverEvent {
  return {
    eventId: randomUUID(),
    moduleCode: 'COS101',
    activityType: 'lecture',
    activityCode: 'L1',
    requiredSelections: 1,
    dayOfWeek: 'monday',
    startTime: '08:00',
    endTime: '09:00',
    venues: [],
    ...overrides,
  };
}

export function createSolverJobRecord(
  overrides: Partial<SolverJobRecord> = {},
): SolverJobRecord {
  const input = overrides.input ?? createSolverInput();
  const jobId = overrides.jobId ?? `solve-${randomUUID()}`;

  return {
    jobId,
    userId: randomUUID(),
    solveMode: 'optimization',
    requestedEngine: 'auto',
    deduplicationKey: `solver-semantic-sha256-v2:${'0'.repeat(64)}`,
    attemptToken: randomUUID(),
    input,
    preferences: input.preferences,
    status: 'queued',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createSolverSubmissionInput(
  overrides: Partial<SolverSubmissionInput> = {},
): SolverSubmissionInput {
  return {
    userId: randomUUID(),
    eventIds: [randomUUID()],
    solveMode: 'optimization',
    engine: 'auto',
    preferences: { heuristics: [] },
    ...overrides,
  };
}

export function createPdfParseJobData(
  overrides: Partial<PdfParseJobData> = {},
): PdfParseJobData {
  return {
    jobId: `pdf-parse-${randomUUID()}`,
    fileKey: 'uploads/test.pdf',
    adapterKey: 'up',
    ...overrides,
  };
}

export function createTimetableSolveJobData(
  overrides: Partial<TimetableSolveJobData> = {},
): TimetableSolveJobData {
  return {
    jobId: `solve-${randomUUID()}`,
    attemptToken: randomUUID(),
    solveMode: 'optimization',
    engine: 'auto',
    ...overrides,
  };
}
