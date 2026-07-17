import { z } from "zod";

export type EnvReader = (key: string) => string | undefined;

export interface WorkerRedisConnectionConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: Record<string, never>;
  maxRetriesPerRequest: null;
}

export interface CommonWorkerConfig {
  queueName: string;
  concurrency: number;
  timeoutMs: number;
  callbackToken: string;
  keepFailedTemp: boolean;
  tempRoot?: string;
  connection: WorkerRedisConnectionConfig;
}

export interface CommonWorkerConfigOptions {
  queueNameEnv: string;
  defaultQueueName: string;
  concurrencyEnv: string;
  defaultConcurrency: number;
  timeoutEnv: string;
  defaultTimeoutMs: number;
  callbackTokenEnv?: string;
  tempRootEnv?: string;
}

const DEFAULT_REDIS_URL = "redis://localhost:6379";
const DEFAULT_REDIS_PORT = 6379;
const positiveIntSchema = z.coerce.number().int().positive();
const nonNegativeIntSchema = z.coerce.number().int().nonnegative();
const truthyStringSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.enum(["1", "true", "yes", "on"]));

export function buildCommonWorkerConfig(
  readEnv: EnvReader,
  options: CommonWorkerConfigOptions,
): CommonWorkerConfig {
  const redisUrl =
    readEnv("BULLMQ_REDIS_URL") ?? readEnv("REDIS_URL") ?? DEFAULT_REDIS_URL;

  const tempRoot = readEnv(options.tempRootEnv ?? "WORKER_TEMP_ROOT");

  const config: CommonWorkerConfig = {
    queueName: readEnv(options.queueNameEnv) ?? options.defaultQueueName,
    concurrency: readPositiveInt(
      readEnv(options.concurrencyEnv),
      options.defaultConcurrency,
    ),
    timeoutMs: readPositiveInt(
      readEnv(options.timeoutEnv),
      options.defaultTimeoutMs,
    ),
    callbackToken:
      readEnv(options.callbackTokenEnv ?? "WORKER_CALLBACK_TOKEN") ?? "",
    keepFailedTemp: readBoolean(readEnv("WORKER_KEEP_FAILED_TEMP"), false),
    connection: parseRedisUrl(redisUrl),
  };

  if (tempRoot) {
    config.tempRoot = tempRoot;
  }

  return config;
}

export function parseRedisUrl(redisUrl: string): WorkerRedisConnectionConfig {
  const url = new URL(redisUrl);
  const db = url.pathname.replace("/", "");

  const config: WorkerRedisConnectionConfig = {
    host: url.hostname,
    port: parseRedisPort(url),
    maxRetriesPerRequest: null,
  };

  if (url.username) {
    config.username = decodeURIComponent(url.username);
  }

  if (url.password) {
    config.password = decodeURIComponent(url.password);
  }

  const parsedDb = nonNegativeIntSchema.safeParse(db);
  if (parsedDb.success) {
    config.db = parsedDb.data;
  }

  if (url.protocol === "rediss:") {
    config.tls = {};
  }

  return config;
}

function parseRedisPort(url: URL): number {
  const parsedPort = positiveIntSchema.safeParse(url.port);
  return parsedPort.success ? parsedPort.data : DEFAULT_REDIS_PORT;
}

export function readPositiveInt(
  value: string | undefined,
  fallback: number,
): number {
  const result = positiveIntSchema.safeParse(value);
  return result.success ? result.data : fallback;
}

export function readBoolean(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (!value) {
    return fallback;
  }

  return truthyStringSchema.safeParse(value).success;
}
