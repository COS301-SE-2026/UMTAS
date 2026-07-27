import {
  FlowStepError,
  type FlowDefinition,
  type FlowRunResult,
  type FlowRuntime,
  type StepContext,
  type StepDiagnostic,
  type StepExecution,
} from './contracts';
import { FlowState } from './flow-state';
import { SeedCollector } from './seed/seed-manifest';

export async function runIntegrationFlow<TPlan>(
  definition: FlowDefinition<TPlan>,
  runtime: FlowRuntime,
): Promise<FlowRunResult> {
  const state = new FlowState();
  const actors = new Map<string, ReturnType<FlowRuntime['createActor']>>();
  const executions: StepExecution[] = [];
  const collector = new SeedCollector();
  let primaryFailure: unknown;

  try {
    validateStepNames(definition);
    await runtime.initialize?.();
    for (const step of definition.steps) {
      await step.baseSeed({ plan: definition.plan, seed: collector });
    }
    const manifest = collector.manifest();
    manifest.validateStepProducers(definition.steps.map((step) => step.name));
    manifest.validateStepOutputs(definition.steps);
    const seeded = await manifest.persist(runtime.database);
    for (const [key, value] of seeded) state.publish(key, value, 'seed');

    for (const [index, step] of definition.steps.entries()) {
      const startedAt = performance.now();
      const context: StepContext<TPlan> = {
        plan: definition.plan,
        runtime,
        state,
        stepName: step.name,
        stepIndex: index,
        actor(name) {
          let actor = actors.get(name);
          if (!actor) {
            actor = runtime.createActor(name);
            actors.set(name, actor);
          }
          return actor;
        },
        require<T>(key: string): T {
          return state.require<T>(key, step.name);
        },
      };

      try {
        const output = await step.run(context);
        if (step.outputKey) {
          state.publish(step.outputKey, output, step.name);
        }
        executions.push({
          index,
          name: step.name,
          elapsedMs: performance.now() - startedAt,
          status: 'passed',
        });
      } catch (error) {
        executions.push({
          index,
          name: step.name,
          elapsedMs: performance.now() - startedAt,
          status: 'failed',
        });
        throw new FlowStepError(definition.name, step.name, index, error, {
          executions,
          outputs: state.snapshot(),
          seedManifest: manifest.summary(),
          step: await collectDiagnostics('step', step.diagnostics),
          runtime: await collectDiagnostics('runtime', runtime.diagnostics),
          actors: Object.fromEntries(
            [...actors].map(([name, actor]) => [
              name,
              actor.request.lastExchange(),
            ]),
          ),
        });
      }
    }

    return {
      flowName: definition.name,
      seedManifest: collector.manifest(),
      executions,
      outputs: state.snapshot(),
    };
  } catch (error) {
    primaryFailure = error;
    throw error;
  } finally {
    state.clear();
    try {
      await runtime.close();
    } catch (cleanupFailure) {
      if (primaryFailure === undefined) throw cleanupFailure;
      attachCleanupFailure(primaryFailure, cleanupFailure);
    }
  }
}

function validateStepNames<TPlan>(definition: FlowDefinition<TPlan>): void {
  const names = new Set<string>();
  for (const step of definition.steps) {
    if (!step.name.trim()) {
      throw new Error(`Flow "${definition.name}" contains an unnamed step`);
    }
    if (names.has(step.name)) {
      throw new Error(
        `Flow "${definition.name}" contains duplicate step name "${step.name}"`,
      );
    }
    names.add(step.name);
  }
}

async function collectDiagnostics(
  source: string,
  collect: (() => StepDiagnostic | Promise<StepDiagnostic>) | undefined,
): Promise<StepDiagnostic | undefined> {
  if (!collect) return undefined;
  try {
    return await collect();
  } catch (error) {
    return {
      collectionFailure: {
        source,
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

function attachCleanupFailure(
  primaryFailure: unknown,
  cleanupFailure: unknown,
): void {
  if (primaryFailure instanceof FlowStepError) {
    primaryFailure.cleanupFailure = cleanupFailure;
    return;
  }
  if (primaryFailure instanceof Error) {
    Object.defineProperty(primaryFailure, 'cleanupFailure', {
      configurable: true,
      enumerable: true,
      value: cleanupFailure,
    });
  }
}
