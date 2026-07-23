import test from "node:test";
import {
  SchedulingEventSchema,
  SolverResultSchema,
  TimetableSolveJobDataSchema,
} from "../src/index.js";

const schedulingEvent = {
  eventId: "event-1",
  moduleCode: "COS101",
  activityType: "lecture" as const,
  activityCode: "L1",
  date: "2026-03-17",
  startTime: "08:30",
  endTime: "09:20",
  venues: [],
};

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

test("solver result requires conflictCount to match conflicts", (t) => {
  const result = SolverResultSchema.safeParse({
    engine: "ga",
    outcome: "best-effort",
    timetableSolution: { selectedEventIds: ["a", "b"] },
    heuristicScores: [],
    metadata: {
      conflictCount: 2,
      conflicts: [{ eventIds: ["a", "b"] }],
      solveMode: "optimization",
    },
  });

  t.assert.equal(result.success, false);
});

test("solver result derives outcome from conflict count", (t) => {
  const result = SolverResultSchema.safeParse({
    engine: "ga",
    outcome: "conflict-free",
    timetableSolution: { selectedEventIds: ["a", "b"] },
    heuristicScores: [],
    metadata: {
      conflictCount: 1,
      conflicts: [{ eventIds: ["a", "b"] }],
      solveMode: "optimization",
    },
  });

  t.assert.equal(result.success, false);
});

test("scheduling events require exactly one date representation", (t) => {
  const neither = {
    ...schedulingEvent,
    date: undefined,
  };

  const both = {
    ...schedulingEvent,
    dayOfWeek: "tuesday",
  };

  t.assert.equal(SchedulingEventSchema.safeParse(neither).success, false);
  t.assert.equal(SchedulingEventSchema.safeParse(both).success, false);
});

test("scheduling events apply selection and venue defaults", (t) => {
  const { venues: _, ...withoutVenues } = schedulingEvent;
  const event = SchedulingEventSchema.parse(withoutVenues);

  t.assert.equal(event.requiredSelections, 1);
  t.assert.deepEqual(event.venues, []);
});

test("scheduling events reject impossible ISO calendar dates", (t) => {
  t.assert.equal(
    SchedulingEventSchema.safeParse({
      ...schedulingEvent,
      date: "2026-99-99",
    }).success,
    false,
  );
  t.assert.equal(
    SchedulingEventSchema.safeParse({
      ...schedulingEvent,
      date: "2026-02-29",
    }).success,
    false,
  );
});

test("scheduling events require HH:mm times", (t) => {
  for (const [startTime, endTime] of [
    ["8:30", "09:20"],
    ["24:00", "09:20"],
    ["08:30", "12:60"],
    ["08:30:00", "09:20"],
  ]) {
    t.assert.equal(
      SchedulingEventSchema.safeParse({
        ...schedulingEvent,
        startTime,
        endTime,
      }).success,
      false,
    );
  }
});

test("scheduling events require startTime to be earlier than endTime", (t) => {
  for (const [startTime, endTime] of [
    ["09:20", "08:30"],
    ["08:30", "08:30"],
  ]) {
    t.assert.equal(
      SchedulingEventSchema.safeParse({
        ...schedulingEvent,
        startTime,
        endTime,
      }).success,
      false,
    );
  }
});
