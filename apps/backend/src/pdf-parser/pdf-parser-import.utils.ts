import { createHash } from 'node:crypto';

export function normalizeModuleCode(code: string): string {
  return truncateForColumn(code.trim().toUpperCase(), 10);
}

export function truncateForColumn(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export function hashModuleIds(moduleIds: string[]): string {
  return createHash('sha256')
    .update(JSON.stringify(moduleIds))
    .digest('base64');
}
