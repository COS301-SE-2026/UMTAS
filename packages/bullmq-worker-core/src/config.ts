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

export function buildCommonWorkerConfig(
  readEnv: EnvReader,
  options: CommonWorkerConfigOptions,
): CommonWorkerConfig {
  const redisUrl =
    readEnv("BULLMQ_REDIS_URL") ??
    readEnv("REDIS_URL") ??
    "redis://localhost:6379";

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

  if (db) {
    config.db = Number(db);
  }

  if (url.protocol === "rediss:") {
    config.tls = {};
  }

  return config;
}

function parseRedisPort(url: URL): number {
  if (!url.port) {
    return 6379;
  }

  return Number(url.port);
}

export function readPositiveInt(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}

export function readBoolean(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}
