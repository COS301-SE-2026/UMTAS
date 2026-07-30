import type {
  ParsedEventCandidate,
  ParsedModuleCandidate,
  PdfParserResult,
} from 'shared-types';

export function createParsedModuleCandidate(
  overrides: Partial<ParsedModuleCandidate> = {},
): ParsedModuleCandidate {
  return {
    code: 'COS101',
    name: 'Computer Science',
    metadata: {},
    warnings: [],
    ...overrides,
  };
}

export function createParsedEventCandidate(
  overrides: Omit<Partial<ParsedEventCandidate>, 'day'> & {
    day?: string | null;
  } = {},
): ParsedEventCandidate {
  return {
    moduleCode: 'COS101',
    title: 'Lecture',
    activityType: 'lecture',
    activityCode: 'L1',
    isRecurring: true,
    day: 'monday',
    date: null,
    startTime: '08:00',
    endTime: '09:00',
    venues: [],
    metadata: {},
    warnings: [],
    ...overrides,
  } as ParsedEventCandidate;
}

export function createPdfParserResult(
  overrides: Partial<PdfParserResult> = {},
): PdfParserResult {
  return {
    modules: [],
    events: [],
    warnings: [],
    ...overrides,
  };
}
