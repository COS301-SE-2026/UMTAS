import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import { join, resolve } from 'node:path';
import 'dotenv/config';

async function runMigrations() {
  const dbMode = (process.env.DB_MODE ?? 'DATABASE').trim().toUpperCase();
  const configuredMigrationsPath = process.env.MIGRATIONS_PATH;

  const migrationsFolder = configuredMigrationsPath
    ? resolve(configuredMigrationsPath)
    : join(process.cwd(), 'drizzle');

  console.log(`Starting database migrations from: ${migrationsFolder}`);
  console.log(`Mode: ${dbMode}`);

  if (dbMode === 'PGLITE') {
    const pglite = new PGlite();
    const db = drizzlePglite(pglite);
    await migratePglite(db, { migrationsFolder });
    process.exit(0);
  } else {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is required');

    const pool = new Pool({ connectionString: databaseUrl, max: 1 });
    const db = drizzle(pool);

    try {
      await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
      await migrate(db, { migrationsFolder });
      console.log('Postgres migrations completed successfully!');
    } catch (error) {
      console.error('Migration failed!', error);
      process.exit(1);
    } finally {
      await pool.end();
    }
  }
}

runMigrations();
