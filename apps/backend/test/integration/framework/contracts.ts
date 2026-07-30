import type { AppDatabase } from '../../../src/db/database.service';
import type { TestActor } from './http-test-client';

declare const flowKeyValue: unique symbol;

export type FlowKey<T> = {
  readonly name: string;
  readonly [flowKeyValue]?: T;
};

export function flowKey<T>(name: string): FlowKey<T> {
  return { name };
}

export interface FlowRuntime {
  readonly database: AppDatabase;
  createActor(name: string): TestActor;
  reset(): Promise<void>;
}

export type FlowSeedContext<TPlan> = {
  readonly plan: TPlan;
  readonly database: AppDatabase;
  publish<T>(key: FlowKey<T>, value: T): T;
};

export type StepContext<TPlan> = {
  readonly plan: TPlan;
  readonly runtime: FlowRuntime;
  actor(name: string): TestActor;
  require<T>(key: FlowKey<T>): T;
};

export interface IntegrationStep<TPlan, TOutput = void> {
  readonly name: string;
  readonly outputKey?: FlowKey<TOutput>;
  run(context: StepContext<TPlan>): Promise<TOutput>;
}

export type OutputIntegrationStep<TPlan, TOutput> = IntegrationStep<
  TPlan,
  TOutput
> & {
  readonly outputKey: FlowKey<TOutput>;
};

export type FlowDefinition<TPlan> = {
  readonly name: string;
  readonly plan: TPlan;
  readonly seed?: (context: FlowSeedContext<TPlan>) => void | Promise<void>;
  readonly steps: readonly IntegrationStep<TPlan, unknown>[];
};

export class FlowStepError extends Error {
  constructor(
    readonly flowName: string,
    readonly stepName: string,
    readonly stepIndex: number,
    readonly cause: unknown,
  ) {
    super(
      `Flow "${flowName}" failed at step ${stepIndex + 1} "${stepName}": ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause },
    );
    this.name = FlowStepError.name;
  }
}
