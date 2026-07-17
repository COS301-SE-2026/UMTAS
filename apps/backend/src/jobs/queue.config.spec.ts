import { buildQueueConfig } from './queue.config';

describe('buildQueueConfig', () => {
  it('uses configured queue names and job options', () => {
    const env = new Map<string, string>([
      ['BULLMQ_REDIS_URL', 'redis://user:pass@redis.internal:6380/2'],
      ['PDF_PARSE_QUEUE_NAME', 'custom.pdf'],
      ['PDF_PARSE_ATTEMPTS', '4'],
      ['PDF_PARSE_BACKOFF_DELAY_MS', '7000'],
      ['TIMETABLE_SOLVE_QUEUE_NAME', 'custom.solve'],
      ['TIMETABLE_SOLVE_ATTEMPTS', '5'],
      ['TIMETABLE_SOLVE_BACKOFF_DELAY_MS', '12000'],
    ]);

    const config = buildQueueConfig((key) => env.get(key));

    expect(config.connection).toMatchObject({
      host: 'redis.internal',
      port: 6380,
      username: 'user',
      password: 'pass',
      db: 2,
      maxRetriesPerRequest: null,
    });
    expect(config.pdfParse.name).toBe('custom.pdf');
    expect(config.pdfParse.defaultJobOptions).toMatchObject({
      attempts: 4,
      backoff: { type: 'exponential', delay: 7000 },
    });
    expect(config.timetableSolve.name).toBe('custom.solve');
    expect(config.timetableSolve.defaultJobOptions).toMatchObject({
      attempts: 5,
      backoff: { type: 'exponential', delay: 12000 },
    });
  });

  it('falls back to phase 1 defaults', () => {
    const config = buildQueueConfig(() => undefined);

    expect(config.connection).toMatchObject({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    });
    expect(config.pdfParse.name).toBe('pdf.parse');
    expect(config.pdfParse.defaultJobOptions).toMatchObject({
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
    expect(config.timetableSolve.name).toBe('timetable.solve');
    expect(config.timetableSolve.defaultJobOptions).toMatchObject({
      attempts: 2,
      backoff: { type: 'exponential', delay: 10000 },
    });
  });
});
