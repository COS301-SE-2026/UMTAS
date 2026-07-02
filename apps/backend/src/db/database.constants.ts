import { z } from 'zod';

export const DB_MODES = {
  PGLITE: 'PGLITE',
  DATABASE: 'DATABASE',
} as const;

export type DbMode = (typeof DB_MODES)[keyof typeof DB_MODES];

const dbModeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum([DB_MODES.PGLITE, DB_MODES.DATABASE]));

const seedFlagSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum(['TRUE', 'FALSE', '']));

export function parseDbMode(value: string | undefined): DbMode {
  const result = dbModeSchema.safeParse(value ?? DB_MODES.DATABASE);

  if (result.success) {
    return result.data;
  }

  throw new Error(
    `Invalid DB_MODE: ${String(value)}. Expected one of: ${DB_MODES.PGLITE}, ${DB_MODES.DATABASE}`,
  );
}

export function parseSeedFlag(value: string | undefined): boolean {
  const result = seedFlagSchema.safeParse(value ?? 'FALSE');

  if (!result.success) {
    throw new Error(`Invalid SEED: ${String(value)}. Expected TRUE or FALSE`);
  }

  return result.data === 'TRUE';
}
