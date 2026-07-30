import assert from 'node:assert/strict';
import type { StepContext } from '../framework/contracts';
import type { HttpResponse, TestActor } from '../framework/http-test-client';

export type ActorResolver<TPlan> = (
  context: StepContext<TPlan>,
) => TestActor | Promise<TestActor>;

export function expectStatus(
  response: HttpResponse,
  expected: number | readonly number[],
  operation: string,
): void {
  const statuses = Array.isArray(expected) ? expected : [expected];
  assert.ok(
    statuses.includes(response.status),
    `${operation} expected HTTP ${statuses.join(' or ')}, received ${response.status}: ${response.text}`,
  );
}

export function expectObject(
  value: unknown,
  operation: string,
): asserts value is Record<string, unknown> {
  assert.ok(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    `${operation} expected an object response`,
  );
}

export function expectString(
  value: unknown,
  field: string,
): asserts value is string {
  assert.ok(typeof value === 'string', `${field} must be a string`);
  assert.ok(value.length > 0, `${field} must not be empty`);
}

export function sorted(values: readonly string[]): string[] {
  return [...values].sort();
}
