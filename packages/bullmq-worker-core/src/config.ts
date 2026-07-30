export interface WorkerRedisConnectionConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: Record<string, never>;
  maxRetriesPerRequest: null;
}

export function parseRedisUrl(redisUrl: string): WorkerRedisConnectionConfig {
  const url = new URL(redisUrl);
  const db = url.pathname.slice(1);
  const connection: WorkerRedisConnectionConfig = {
    host: url.hostname,
    port: Number(url.port || 6379),
    maxRetriesPerRequest: null,
  };

  if (url.username) connection.username = decodeURIComponent(url.username);
  if (url.password) connection.password = decodeURIComponent(url.password);
  if (db) connection.db = Number(db);
  if (url.protocol === "rediss:") connection.tls = {};

  return connection;
}
