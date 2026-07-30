import {
  FlowStepError,
  type FlowDefinition,
  type FlowKey,
  type FlowRuntime,
  type StepContext,
} from './contracts';
import type { TestActor } from './http-test-client';

export async function runIntegrationFlow<TPlan>(
  definition: FlowDefinition<TPlan>,
  runtime: FlowRuntime,
): Promise<void> {
  const outputs = new Map<object, unknown>();
  const actors = new Map<string, TestActor>();
  let primaryFailure: Error | undefined;

  try {
    validateSteps(definition);
    const seed = definition.seed;
    if (seed) {
      await runtime.database.transaction(
        async (database: FlowRuntime['database']) => {
          await seed({
            plan: definition.plan,
            database,
            publish: <T>(key: FlowKey<T>, value: T) =>
              publishOutput(outputs, key, value),
          });
        },
      );
    }

    for (const [index, step] of definition.steps.entries()) {
      const context: StepContext<TPlan> = {
        plan: definition.plan,
        runtime,
        actor(name) {
          let actor = actors.get(name);
          if (!actor) {
            actor = runtime.createActor(name);
            actors.set(name, actor);
          }
          return actor;
        },
        require<T>(key: FlowKey<T>): T {
          if (!outputs.has(key)) {
            throw new Error(
              `Step "${step.name}" requires missing flow output "${key.name}"`,
            );
          }
          return outputs.get(key) as T;
        },
      };

      try {
        const output = await step.run(context);
        if (step.outputKey) {
          publishOutput(outputs, step.outputKey, output);
        }
      } catch (error) {
        throw new FlowStepError(definition.name, step.name, index, error);
      }
    }
  } catch (error) {
    primaryFailure = errorFromUnknown(error);
  }

  try {
    await runtime.reset();
  } catch (cleanupFailure) {
    const resetFailure = errorFromUnknown(cleanupFailure);
    if (!primaryFailure) throw resetFailure;
    throw new AggregateError(
      [primaryFailure, resetFailure],
      `${primaryFailure.message}; flow reset failed: ${resetFailure.message}`,
      { cause: primaryFailure },
    );
  }

  if (primaryFailure) throw primaryFailure;
}

function publishOutput<T>(
  outputs: Map<object, unknown>,
  key: FlowKey<T>,
  value: T,
): T {
  if (outputs.has(key)) {
    throw new Error(`Flow output "${key.name}" was published more than once`);
  }
  outputs.set(key, value);
  return value;
}

function validateSteps<TPlan>(definition: FlowDefinition<TPlan>): void {
  for (const step of definition.steps) {
    if (!step.name.trim()) {
      throw new Error(`Flow "${definition.name}" contains an unnamed step`);
    }
  }
}

function errorFromUnknown(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
