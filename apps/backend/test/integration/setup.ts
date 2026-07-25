import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'test';
process.env.DB_MODE = 'PGLITE';
process.env.SEED = 'false';
process.env.MIGRATIONS_PATH ??= fileURLToPath(
  new URL('../../drizzle', import.meta.url),
);
