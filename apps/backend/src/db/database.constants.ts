export const DB_MODES = {
  PGLITE: 'PGLITE',
  DATABASE: 'DATABASE',
} as const;

export type DbMode = (typeof DB_MODES)[keyof typeof DB_MODES];

export function parseDbMode(value: string | undefined): DbMode {
  const normalized = (value ?? DB_MODES.DATABASE).trim().toUpperCase();

  if (normalized === DB_MODES.PGLITE || normalized === DB_MODES.DATABASE) {
    return normalized;
  }

  throw new Error(
    `Invalid DB_MODE: ${String(value)}. Expected one of: ${DB_MODES.PGLITE}, ${DB_MODES.DATABASE}`,
  );
}

export function parseSeedFlag(value: string | undefined): boolean {
  const normalized = (value ?? 'FALSE').trim().toUpperCase();

  if (normalized === 'TRUE') {
    return true;
  }

  if (normalized === 'FALSE' || normalized.length === 0) {
    return false;
  }

  throw new Error(`Invalid SEED: ${String(value)}. Expected TRUE or FALSE`);
}
