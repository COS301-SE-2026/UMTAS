import { resolve } from 'node:path';

process.env.NODE_ENV = 'test';
process.env.DB_MODE = 'PGLITE';
process.env.SEED = 'false';
process.env.MIGRATIONS_PATH ??= resolve(process.cwd(), 'drizzle');
