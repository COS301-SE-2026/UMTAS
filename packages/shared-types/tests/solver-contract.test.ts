import test from "node:test";
import { SolverResultSchema, TimetableSolveJobDataSchema } from "../index.js";

test("solver job data contains only worker inputs", (t) => {
  const job = TimetableSolveJobDataSchema.parse({
    jobId: "solve-1",
    attemptToken: "11111111-1111-4111-8111-111111111111",
    solveMode: "optimization",
  });

  t.assert.deepEqual(job, {
    jobId: "solve-1",
    attemptToken: "11111111-1111-4111-8111-111111111111",
    solveMode: "optimization",
    engine: "auto",
  });

  const redundantProfile = TimetableSolveJobDataSchema.safeParse({
    jobId: "solve-1",
    attemptToken: "11111111-1111-4111-8111-111111111111",
    solverProfileKey: "default",
    solveMode: "optimization",
    engine: "auto",
  });
  t.assert.equal(redundantProfile.success, false);
});

test("solver result distinguishes conflict-free and best-effort outcomes", (t) => {
  const conflictFree = SolverResultSchema.parse({
    engine: "ga",
    outcome: "conflict-free",
    timetableSolution: { selectedEventIds: ["a"] },
    heuristicScores: [],
    metadata: { conflictCount: 0, conflicts: [], solveMode: "feasibility" },
  });
  const bestEffort = SolverResultSchema.parse({
    engine: "ga",
    outcome: "best-effort",
    timetableSolution: { selectedEventIds: ["a", "b"] },
    heuristicScores: [],
    metadata: {
      conflictCount: 1,
      conflicts: [{ eventIds: ["a", "b"] }],
      solveMode: "optimization",
    },
  });

  t.assert.equal(conflictFree.metadata.conflictCount, 0);
  t.assert.deepEqual(bestEffort.metadata.conflicts[0]?.eventIds, ["a", "b"]);
});

test("solver result rejects ordinary feasible metadata that hides conflicts", (t) => {
  const result = SolverResultSchema.safeParse({
    engine: "ga",
    timetableSolution: { selectedEventIds: ["a", "b"] },
    heuristicScores: [],
    metadata: {},
  });
  t.assert.equal(result.success, false);
});
