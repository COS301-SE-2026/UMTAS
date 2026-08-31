import type { Config } from 'drizzle-kit';

export default {
  schema: './src/entities/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  verbose: true,
} satisfies Config;
