import assert from "node:assert/strict";
import test from "node:test";
import type { SolverInput, SolverResult } from "shared-types";
import { SolverProcessor } from "../solver.processor.js";
import type { SolverExecutor, SolverInputClient } from "../contracts.js";

const input: SolverInput = {
  schedulingProblem: { events: [] },
  preferences: { heuristics: [] },
};

const cpSatResult: SolverResult = {
  engine: "cp-sat",
  timetableSolution: { selectedEventIds: [] },
  heuristicScores: [],
  metadata: {},
};

test("SolverProcessor stages input and runs CP-SAT for an auto job", async () => {
  const calls: string[] = [];
  const processor = new SolverProcessor({
    inputClient: inputClient(calls),
    solverExecutor: executor(calls, {
      status: "feasible",
      result: cpSatResult,
    }),
    writeInputFile: async (filePath, content) => {
      calls.push(`write:${filePath}:${content}`);
    },
  });

  const payload = await processor.process(context("auto"));

  assert.deepEqual(calls, [
    "input:solve-1",
    'write:/tmp/solve-1/input.json:{"schedulingProblem":{"events":[]},"preferences":{"heuristics":[]}}',
    "solve:cp-sat:/tmp/solve-1/input.json:/tmp/solve-1/output.json",
  ]);
  assert.deepEqual(payload, { status: "completed", result: cpSatResult });
});

test("SolverProcessor falls back to GA only after CP-SAT is infeasible", async () => {
  const calls: string[] = [];
  const gaResult: SolverResult = {
    engine: "ga",
    timetableSolution: { selectedEventIds: [] },
    heuristicScores: [],
    metadata: {},
  };
  const outcomes = [
    { status: "infeasible" } as const,
    { status: "feasible", result: gaResult } as const,
  ];
  const processor = new SolverProcessor({
    inputClient: inputClient(calls),
    solverExecutor: {
      solve: async (request) => {
        calls.push(`solve:${request.engine}`);
        const outcome = outcomes.shift();
        assert.ok(outcome);
        return outcome;
      },
    },
    writeInputFile: async () => {},
  });

  const payload = await processor.process(context("auto"));

  assert.deepEqual(calls, ["input:solve-1", "solve:cp-sat", "solve:ga"]);
  assert.deepEqual(payload, { status: "completed", result: gaResult });
});

function inputClient(calls: string[]): SolverInputClient {
  return {
    getInput: async (jobId) => {
      calls.push(`input:${jobId}`);
      return input;
    },
  };
}

function executor(
  calls: string[],
  outcome: Awaited<ReturnType<SolverExecutor["solve"]>>,
): SolverExecutor {
  return {
    solve: async (request) => {
      calls.push(
        `solve:${request.engine}:${request.inputPath}:${request.outputPath}`,
      );
      return outcome;
    },
  };
}

function context(engine: "auto" | "cp-sat" | "ga") {
  return {
    data: {
      jobId: "solve-1",
      solverProfileKey: "default",
      solveMode: "optimization" as const,
      engine,
    },
    tempDir: "/tmp/solve-1",
    logger: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    },
    abortSignal: new AbortController().signal,
  };
}
