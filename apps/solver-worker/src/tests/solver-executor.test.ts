import assert from "node:assert/strict";
import test from "node:test";
import { CliSolverExecutor } from "../solver-executor.js";

test("CliSolverExecutor uses the file-based solver CLI contract", async () => {
  const executor = new CliSolverExecutor({
    command: "solver-cli",
    args: ["--verbose"],
    runCliFn: async (command, args, options) => {
      assert.equal(command, "solver-cli");
      assert.deepEqual(args, [
        "--verbose",
        "--input",
        "/tmp/input.json",
        "--output",
        "/tmp/output.json",
        "--engine",
        "cp-sat",
        "--solve-mode",
        "feasibility",
      ]);
      assert.ok(options);
      assert.ok(options.abortSignal);
      return { exitCode: 0, stdout: "", stderr: "", timedOut: false };
    },
    readOutputFile: async () =>
      JSON.stringify({
        status: "feasible",
        outcome: "conflict-free",
        timetableSolution: { selectedEventIds: [] },
        heuristicScores: [],
        metadata: {
          conflictCount: 0,
          conflicts: [],
          solveMode: "feasibility",
        },
      }),
  });

  const outcome = await executor.solve({
    inputPath: "/tmp/input.json",
    outputPath: "/tmp/output.json",
    engine: "cp-sat",
    solveMode: "feasibility",
    abortSignal: new AbortController().signal,
  });

  assert.deepEqual(outcome, {
    status: "feasible",
    result: {
      engine: "cp-sat",
      outcome: "conflict-free",
      timetableSolution: { selectedEventIds: [] },
      heuristicScores: [],
      metadata: {
        conflictCount: 0,
        conflicts: [],
        solveMode: "feasibility",
      },
    },
  });
});

test("CliSolverExecutor returns an infeasible CLI outcome without treating it as an error", async () => {
  const executor = new CliSolverExecutor({
    command: "solver-cli",
    args: [],
    runCliFn: async () => ({
      exitCode: 0,
      stdout: "",
      stderr: "",
      timedOut: false,
    }),
    readOutputFile: async () => JSON.stringify({ status: "infeasible" }),
  });

  const outcome = await executor.solve({
    inputPath: "/tmp/input.json",
    outputPath: "/tmp/output.json",
    engine: "ga",
    solveMode: "optimization",
    abortSignal: new AbortController().signal,
  });

  assert.deepEqual(outcome, { status: "infeasible" });
});
