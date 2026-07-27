import type { AppDatabase } from '../../../src/db/database.service';
import type { UniRole } from '../../../src/auth/roles';
import type { SessionData } from '../../../src/auth/session.decorator';
import type { HttpTestClient, TestActor } from './http-test-client';
import type { FlowState } from './flow-state';
import type { SeedCollector, SeedManifest } from './seed/seed-manifest';

export type StepDiagnostic = Readonly<Record<string, unknown>>;

export type StepExecution = {
  readonly index: number;
  readonly name: string;
  readonly elapsedMs: number;
  readonly status: 'passed' | 'failed';
};

export interface FlowRuntime {
  readonly database: AppDatabase;
  readonly http: HttpTestClient;
  createActor(name: string): TestActor;
  authenticateMockActor?(
    actor: TestActor,
    session: SessionData,
    universityRoles?: Readonly<Record<string, UniRole>>,
  ): TestActor;
  initialize?(): Promise<void>;
  diagnostics?(): Promise<StepDiagnostic>;
  close(): Promise<void>;
}

export type SeedDeclarationContext<TPlan> = {
  readonly plan: TPlan;
  readonly seed: SeedCollector;
};

export type StepContext<TPlan> = {
  readonly plan: TPlan;
  readonly runtime: FlowRuntime;
  readonly state: FlowState;
  readonly stepName: string;
  readonly stepIndex: number;
  actor(name: string): TestActor;
  require<T>(key: string): T;
};

export interface IntegrationStep<TPlan, TOutput = void> {
  readonly name: string;
  readonly outputKey?: string;
  baseSeed(context: SeedDeclarationContext<TPlan>): void | Promise<void>;
  run(context: StepContext<TPlan>): Promise<TOutput>;
  diagnostics?(): StepDiagnostic | Promise<StepDiagnostic>;
}

export type FlowDefinition<TPlan> = {
  readonly name: string;
  readonly plan: TPlan;
  readonly steps: readonly IntegrationStep<TPlan, unknown>[];
};

export type FlowRunResult = {
  readonly flowName: string;
  readonly seedManifest: SeedManifest;
  readonly executions: readonly StepExecution[];
  readonly outputs: Readonly<Record<string, { producer: string }>>;
};

export class FlowStepError extends Error {
  cleanupFailure?: unknown;

  constructor(
    readonly flowName: string,
    readonly stepName: string,
    readonly stepIndex: number,
    readonly cause: unknown,
    readonly details: StepDiagnostic,
  ) {
    super(
      `Flow "${flowName}" failed at step ${stepIndex + 1} "${stepName}": ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause },
    );
    this.name = FlowStepError.name;
  }
}
