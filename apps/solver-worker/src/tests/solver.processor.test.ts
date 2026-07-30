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
  outcome: "conflict-free",
  timetableSolution: { selectedEventIds: [] },
  heuristicScores: [],
  metadata: { conflictCount: 0, conflicts: [], solveMode: "optimization" },
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
    "solve:cp-sat:/tmp/solve-1/input.json:/tmp/solve-1/output.json:optimization",
  ]);
  assert.deepEqual(payload, { status: "completed", result: cpSatResult });
});

test("SolverProcessor passes feasibility mode to the selected engine", async () => {
  const calls: string[] = [];
  const feasibilityResult: SolverResult = {
    engine: "cp-sat",
    outcome: "conflict-free",
    timetableSolution: { selectedEventIds: [] },
    heuristicScores: [],
    metadata: { conflictCount: 0, conflicts: [], solveMode: "feasibility" },
  };
  const processor = new SolverProcessor({
    inputClient: inputClient(calls),
    solverExecutor: executor(calls, {
      status: "feasible",
      result: feasibilityResult,
    }),
    writeInputFile: async () => {},
  });

  const payload = await processor.process(context("cp-sat", "feasibility"));

  assert.match(calls.at(-1) ?? "", /:feasibility$/);
  assert.deepEqual(payload, { status: "completed", result: feasibilityResult });
});

test("SolverProcessor falls back to GA only after CP-SAT is infeasible", async () => {
  const calls: string[] = [];
  const logs: Array<{ message: string; metadata?: Record<string, unknown> }> =
    [];
  const gaResult: SolverResult = {
    engine: "ga",
    outcome: "best-effort",
    timetableSolution: { selectedEventIds: [] },
    heuristicScores: [],
    metadata: {
      conflictCount: 1,
      conflicts: [{ eventIds: ["event-a", "event-b"] }],
      solveMode: "optimization",
    },
  };
  const outcomes = [
    { status: "infeasible" } as const,
    { status: "feasible", result: gaResult } as const,
  ];
  const processor = new SolverProcessor({
    inputClient: inputClient(calls),
    solverExecutor: {
      solve: async (request) => {
        calls.push(`solve:${request.engine}:${request.solveMode}`);
        const outcome = outcomes.shift();
        assert.ok(outcome);
        return outcome;
      },
    },
    writeInputFile: async () => {},
  });

  const payload = await processor.process(
    context("auto", "optimization", logs),
  );

  assert.deepEqual(calls, [
    "input:solve-1",
    "solve:cp-sat:optimization",
    "solve:ga:optimization",
  ]);
  assert.deepEqual(payload, { status: "completed", result: gaResult });
  assert.deepEqual(logs, [
    {
      message: "Running timetable solver",
      metadata: {
        jobId: "solve-1",
        engine: "cp-sat",
        solveMode: "optimization",
      },
    },
    {
      message: "SOLVER_ENGINE_RESULT",
      metadata: {
        jobId: "solve-1",
        engine: "cp-sat",
        status: "infeasible",
      },
    },
    {
      message: "CP-SAT was infeasible; falling back to GA",
      metadata: { jobId: "solve-1" },
    },
    {
      message: "SOLVER_ENGINE_FALLBACK",
      metadata: {
        jobId: "solve-1",
        fromEngine: "cp-sat",
        toEngine: "ga",
        reason: "infeasible",
      },
    },
    {
      message: "SOLVER_ENGINE_RESULT",
      metadata: {
        jobId: "solve-1",
        engine: "ga",
        status: "feasible",
        outcome: "best-effort",
      },
    },
  ]);
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
        `solve:${request.engine}:${request.inputPath}:${request.outputPath}:${request.solveMode}`,
      );
      return outcome;
    },
  };
}

function context(
  engine: "auto" | "cp-sat" | "ga",
  solveMode: "feasibility" | "optimization" = "optimization",
  infoLogs?: Array<{
    message: string;
    metadata?: Record<string, unknown>;
  }>,
) {
  return {
    data: {
      jobId: "solve-1",
      attemptToken: "11111111-1111-4111-8111-111111111111",
      solveMode,
      engine,
    },
    tempDir: "/tmp/solve-1",
    logger: {
      debug: () => {},
      info: (message: string, metadata?: Record<string, unknown>) => {
        infoLogs?.push(metadata ? { message, metadata } : { message });
      },
      warn: () => {},
      error: () => {},
    },
    abortSignal: new AbortController().signal,
  };
}
