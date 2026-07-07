import type { JobsOptions, QueueOptions } from 'bullmq';
import type { RedisOptions } from 'ioredis';
import { z } from 'zod';

export interface QueueRuntimeConfig {
  name: string;
  defaultJobOptions: JobsOptions;
}

export interface BackendQueueConfig {
  connection: RedisOptions;
  pdfParse: QueueRuntimeConfig;
  timetableSolve: QueueRuntimeConfig;
}

export type EnvReader = (key: string) => string | undefined;

interface QueueEnvConfig {
  nameEnvKey: string;
  defaultName: string;
  attemptsEnvKey: string;
  defaultAttempts: number;
  backoffDelayEnvKey: string;
  defaultBackoffDelayMs: number;
}

const DEFAULT_REDIS_URL = 'redis://localhost:6379';
const DEFAULT_REDIS_PORT = 6379;
const ONE_DAY_SECONDS = 86_400;
const ONE_WEEK_SECONDS = 604_800;
const COMPLETED_JOB_LIMIT = 1_000;
const FAILED_JOB_LIMIT = 5_000;
const positiveIntSchema = z.coerce.number().int().positive();

const pdfParseQueueEnvConfig: QueueEnvConfig = {
  nameEnvKey: 'PDF_PARSE_QUEUE_NAME',
  defaultName: 'pdf.parse',
  attemptsEnvKey: 'PDF_PARSE_ATTEMPTS',
  defaultAttempts: 3,
  backoffDelayEnvKey: 'PDF_PARSE_BACKOFF_DELAY_MS',
  defaultBackoffDelayMs: 5_000,
};

const timetableSolveQueueEnvConfig: QueueEnvConfig = {
  nameEnvKey: 'TIMETABLE_SOLVE_QUEUE_NAME',
  defaultName: 'timetable.solve',
  attemptsEnvKey: 'TIMETABLE_SOLVE_ATTEMPTS',
  defaultAttempts: 2,
  backoffDelayEnvKey: 'TIMETABLE_SOLVE_BACKOFF_DELAY_MS',
  defaultBackoffDelayMs: 10_000,
};

export function buildQueueConfig(readEnv: EnvReader): BackendQueueConfig {
  const redisUrl = readFirstConfiguredValue(
    readEnv,
    ['BULLMQ_REDIS_URL', 'REDIS_URL'],
    DEFAULT_REDIS_URL,
  );

  return {
    connection: parseRedisUrl(redisUrl),
    pdfParse: buildQueueRuntimeConfig(readEnv, pdfParseQueueEnvConfig),
    timetableSolve: buildQueueRuntimeConfig(
      readEnv,
      timetableSolveQueueEnvConfig,
    ),
  };
}

export function buildBullRootOptions(config: BackendQueueConfig): QueueOptions {
  return {
    connection: config.connection,
  };
}

function parseRedisUrl(redisUrl: string): RedisOptions {
  const url = new URL(redisUrl);
  const db = url.pathname.replace('/', '');

  const config: RedisOptions = {
    host: url.hostname,
    port: url.port ? Number(url.port) : DEFAULT_REDIS_PORT,
    maxRetriesPerRequest: null,
  };

  if (url.username) {
    config.username = decodeURIComponent(url.username);
  }

  if (url.password) {
    config.password = decodeURIComponent(url.password);
  }

  if (db) {
    config.db = Number(db);
  }

  if (url.protocol === 'rediss:') {
    config.tls = {};
  }

  return config;
}

function buildQueueRuntimeConfig(
  readEnv: EnvReader,
  queueEnvConfig: QueueEnvConfig,
): QueueRuntimeConfig {
  const attempts = readPositiveInt(
    readEnv(queueEnvConfig.attemptsEnvKey),
    queueEnvConfig.defaultAttempts,
  );
  const backoffDelay = readPositiveInt(
    readEnv(queueEnvConfig.backoffDelayEnvKey),
    queueEnvConfig.defaultBackoffDelayMs,
  );

  return {
    name: readEnv(queueEnvConfig.nameEnvKey) ?? queueEnvConfig.defaultName,
    defaultJobOptions: buildDefaultJobOptions(attempts, backoffDelay),
  };
}

function buildDefaultJobOptions(
  attempts: number,
  backoffDelay: number,
): JobsOptions {
  return {
    attempts,
    backoff: {
      type: 'exponential',
      delay: backoffDelay,
    },
    removeOnComplete: {
      age: ONE_DAY_SECONDS,
      count: COMPLETED_JOB_LIMIT,
    },
    removeOnFail: {
      age: ONE_WEEK_SECONDS,
      count: FAILED_JOB_LIMIT,
    },
  };
}

function readFirstConfiguredValue(
  readEnv: EnvReader,
  keys: string[],
  fallback: string,
): string {
  for (const key of keys) {
    const value = readEnv(key);
    if (typeof value === 'string') {
      return value;
    }
  }

  return fallback;
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const result = positiveIntSchema.safeParse(value);
  return result.success ? result.data : fallback;
}
