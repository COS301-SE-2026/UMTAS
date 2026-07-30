import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import type { SolverResult } from 'shared-types';
import { solverJob } from '../../../src/entities';
import {
  flowKey,
  type FlowKey,
  type OutputIntegrationStep,
} from '../framework/contracts';
import { pollUntil } from '../framework/http-test-client';
import {
  expectObject,
  expectStatus,
  expectString,
  sorted,
  type ActorResolver,
} from './step-support';

export const SOLVER_STEP_NAME = 'solve conflicting timetable';

export type SolverStepPlan = {
  readonly eventIdsKey: FlowKey<
    | readonly string[]
    | { readonly eventIds: readonly string[] }
    | { readonly eligibleEventIds: readonly string[] }
  >;
  readonly timeoutMs?: number;
  readonly assertFallbackLog?: (jobId: string) => Promise<void>;
};

export type SolverStepOutput = {
  readonly jobId: string;
  readonly result: SolverResult;
  readonly selectedEventIds: readonly string[];
  readonly conflicts: readonly Readonly<Record<string, unknown>>[];
};

export function solverStep<TPlan>(
  select: (plan: TPlan) => SolverStepPlan,
  actor: ActorResolver<TPlan>,
): OutputIntegrationStep<TPlan, SolverStepOutput> {
  return {
    name: SOLVER_STEP_NAME,
    outputKey: flowKey<SolverStepOutput>('solver.result'),
    async run(context) {
      const plan = select(context.plan);
      const eventIdsInput = context.require(plan.eventIdsKey);
      const eventIds =
        'eventIds' in eventIdsInput
          ? eventIdsInput.eventIds
          : 'eligibleEventIds' in eventIdsInput
            ? eventIdsInput.eligibleEventIds
            : eventIdsInput;
      const student = await actor(context);
      const submission = await student.request.post('/solver/jobs', {
        json: {
          eventIds,
          solveMode: 'optimization',
          engine: 'auto',
          preferences: { heuristics: [] },
        },
      });
      expectStatus(submission, 202, 'submit solver job');
      expectObject(submission.body, 'submit solver job');
      expectString(submission.body.jobId, 'solver jobId');
      const jobId = submission.body.jobId;
      assert.equal(submission.body.accepted, true);
      assert.equal(submission.body.status, 'queued');

      await pollUntil(
        async () => {
          const response = await student.request.get(`/solver/jobs/${jobId}`);
          expectStatus(response, 200, 'poll solver job');
          expectObject(response.body, 'poll solver job');
          return response.body;
        },
        (value) => value.status === 'completed',
        {
          timeoutMs: plan.timeoutMs ?? 330_000,
          intervalMs: 250,
          fail: (value) =>
            value.status === 'failed'
              ? `Solver job failed: ${JSON.stringify(value)}`
              : undefined,
        },
      );

      const resultResponse = await student.request.get(
        `/solver/jobs/${jobId}/result`,
      );
      expectStatus(resultResponse, 200, 'retrieve solver result');
      expectObject(resultResponse.body, 'retrieve solver result');
      const result = resultResponse.body as unknown as SolverResult;
      assert.equal(result.engine, 'ga');
      assert.equal(result.outcome, 'best-effort');
      assert.deepEqual(
        sorted(result.timetableSolution.selectedEventIds),
        sorted(eventIds),
      );
      assert.equal(result.metadata.conflictCount, 1);
      assert.equal(result.metadata.conflicts.length, 1);
      assert.deepEqual(
        sorted(result.metadata.conflicts[0].eventIds),
        sorted(eventIds),
      );

      const persisted = await context.runtime.database
        .select()
        .from(solverJob)
        .where(eq(solverJob.JobID, jobId.replace(/^solve-/, '')));
      assert.equal(persisted.length, 1);
      assert.equal(persisted[0].Status, 'completed');
      await plan.assertFallbackLog?.(jobId);

      return {
        jobId,
        result,
        selectedEventIds: result.timetableSolution.selectedEventIds,
        conflicts: result.metadata.conflicts,
      };
    },
  };
}
