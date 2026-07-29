process.env.DB_MODE = 'PGLITE';
process.env.BETTER_AUTH_SECRET = 'test-secret-key-32-chars-minimum!!';
process.env.BETTER_AUTH_URL = 'http://localhost:3001';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.WORKER_CALLBACK_TOKEN = 'secret';

jest.mock('better-auth', () => {
  class APIError extends Error {
    constructor(
      public code: string,
      options?: { message?: string },
    ) {
      super(options?.message ?? code);
    }
  }

  return {
    APIError,
    betterAuth: jest.fn((config: unknown) => ({
      handler: jest.fn(),
      api: {
        getSession: jest.fn(),
      },
      config,
    })),
  };
});

jest.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: jest.fn((db: unknown, options: unknown) => ({
    db,
    options,
  })),
}));

jest.mock('better-auth/plugins/admin', () => ({
  admin: jest.fn(() => ({ name: 'admin-plugin' })),
}));

jest.mock('better-auth/plugins/admin/access', () => ({
  defaultStatements: {
    user: ['create', 'update', 'delete', 'view'],
    session: ['revoke'],
  },
  adminAc: {
    statements: {
      user: ['create', 'update', 'delete', 'view'],
      session: ['revoke'],
    },
  },
}));

jest.mock('better-auth/plugins/access', () => ({
  createAccessControl: jest.fn((statements: Record<string, unknown>) => ({
    statements,
    newRole: jest.fn(
      (roleStatements: Record<string, unknown>) => roleStatements,
    ),
  })),
}));

jest.mock('@better-auth/redis-storage', () => ({
  redisStorage: jest.fn((options: unknown) => options),
}));

jest.mock('better-auth/node', () => ({
  toNodeHandler: jest.fn((handler: unknown) => handler),
}));

jest.mock('better-auth/crypto', () => ({
  hashPassword: jest.fn((value: string) => Promise.resolve(`hashed:${value}`)),
  verifyPassword: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('shared-types', () => ({
  ActivityType: {
    LECTURE: 'lecture',
    TUTORIAL: 'tutorial',
    PRAC: 'prac',
    TEST: 'test',
    EXAM: 'exam',
  },
  ActivityTypeSchema: {
    options: ['lecture', 'tutorial', 'prac', 'test', 'exam'],
    parse: (data: any) => data,
    safeParse: (data: any) => ({ success: true, data }),
  },
  EventSource: {
    UNIVERSITY: 'university',
    PERSONAL: 'personal',
  },
  SolverPreferences: {
    parse: (data: any) => data,
  },
  SolverInput: {
    parse: (data: any) => data,
  },
  SolverResult: {
    parse: (data: any) => data,
  },
  PdfParserResult: {
    parse: (data: any) => data,
  },
  PdfParseJobData: {
    parse: (data: any) => data,
  },
  TimetableSolveJobData: {
    parse: (data: any) => data,
  },
  WorkerCallbackError: {
    parse: (data: any) => data,
  },
  ParsedEventCandidate: {
    parse: (data: any) => data,
  },
  ParsedModuleCandidate: {
    parse: (data: any) => data,
  },
  PdfParserCallbackPayload: {
    parse: (data: any) => data,
  },
  SolverCallbackPayload: {
    parse: (data: any) => data,
  },
  PdfStreamFingerprintResult: {
    parse: (data: any) => data,
  },
  Sha256Hash: {
    parse: (data: any) => data,
  },
  computePdfStreamFingerprint: jest.fn(),
  PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION: '1',
  PdfParserCallbackPayloadSchema: {
    parse: (data: any) => data,
  },
  SolverCallbackPayloadSchema: {
    parse: (data: any) => data,
  },
  SolverPreferencesSchema: {
    parse: (data: any) => data,
  },
  SolverInputSchema: {
    parse: (data: any) => data,
  },
  SolverEngine: {
    CP_SAT: 'CP_SAT',
    GA: 'GA',
  },
  DayOfWeek: {
    MONDAY: 'monday',
    TUESDAY: 'tuesday',
    WEDNESDAY: 'wednesday',
    THURSDAY: 'thursday',
    FRIDAY: 'friday',
    SATURDAY: 'saturday',
    SUNDAY: 'sunday',
  },
}));

export {};
